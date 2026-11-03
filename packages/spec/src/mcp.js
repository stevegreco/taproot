import fs from "node:fs";
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { SpecError } from "./index.js";
import { loadFromConfig, resolveConfig, validateFromConfig } from "./config.js";
import * as ops from "./operations.js";
import { AGENT_INSTRUCTIONS } from "./agents.js";

const TYPES = ["component", "pattern", "guideline", "example"];
const LINK_KINDS = [
  "alternative",
  "alternative-to",
  "composes",
  "used-in",
  "follows",
  "followed-by",
  "example-of",
  "examples",
  "related",
];

/** The next call for a record, naming each implementation that has a file for it. */
function nextCall(id, names) {
  if (names.length === 0) return `get ${id}`;
  const which =
    names.length === 1 ? `"${names[0]}"` : `one of ${names.map((name) => `"${name}"`).join(", ")}`;
  return `get ${id} with implementation ${which}`;
}

/**
 * Create the spec MCP server and its reload watcher.
 *
 * @param {{ cwd?: string, contentDir?: string, configPath?: string, watch?: boolean, debounceMs?: number }} [options]
 * @returns {Promise<{ server: McpServer, reload: () => Promise<void>, close: () => void }>}
 */
export async function createSpecServer(options = {}) {
  const { cwd = process.cwd(), contentDir, configPath, watch = true, debounceMs = 200 } = options;
  const loadOptions = { cwd, contentDir, configPath };

  let spec = await loadFromConfig({ ...loadOptions, resolveTokens: false });
  /** @type {string | undefined} */
  let warning;

  const server = new McpServer(
    { name: "design-system-spec", version: "0.0.1" },
    { instructions: AGENT_INSTRUCTIONS },
  );

  async function reload() {
    try {
      spec = await loadFromConfig({ ...loadOptions, resolveTokens: false });
      warning = undefined;
    } catch (error) {
      if (error instanceof SpecError) {
        const { text } = ops.formatIssues(error.issues, 0);
        warning = text.replace(/\n[^\n]*$/, "");
      } else {
        warning = `Reload failed: ${error.message}`;
      }
    }
    if (server.isConnected()) {
      server.sendResourceListChanged();
    }
  }

  /** Prefix text with the stale-content warning while the last reload has issues. */
  const disclose = (text) =>
    warning
      ? `WARNING: the content has issues, so this answer comes from the last valid version.\n${warning}\n\n${text}`
      : text;

  /** @param {ops.Result} result */
  const toResult = (result) => {
    const text = disclose(result.text);
    return {
      content: [{ type: "text", text }],
      structuredContent: {
        results: result.data,
        ...(result.error ? { error: result.error } : {}),
        ...(warning ? { warning } : {}),
      },
      isError: !result.ok,
    };
  };
  const tool = (name, description, inputSchema, run) =>
    server.registerTool(name, { description, inputSchema }, async (args) => {
      try {
        return toResult(await run(args));
      } catch (error) {
        return { content: [{ type: "text", text: error.message }], isError: true };
      }
    });

  const type = z.enum(TYPES).optional().describe("Restrict to one record type.");
  const tag = z.string().optional().describe("Restrict to records with this tag.");

  tool(
    "search",
    "Find which component, pattern, or guideline fits a need. Start here when choosing a component. Returns record ids with summaries; follow with `get`.",
    {
      query: z.string().describe('What you need, in plain words, such as "destructive action".'),
      type,
      tag,
      limit: z.number().int().positive().optional().describe("Maximum number of results."),
    },
    (args) =>
      ops.search(spec, args, {
        implementations: resolveConfig(loadOptions).implementations,
        next: nextCall,
        browse: "the `list` tool",
      }),
  );
  tool(
    "get",
    "Read a record as Markdown: a component's contract, or a pattern, guideline, or example. Pass `id#section` to read one section or one rule. Set `implementation` to also get how a technology realizes a component: package, what to import, and the member (attribute, prop, event, or callback) that implements each parameter and event. Use after `search` to read the top result.",
    {
      target: z
        .string()
        .describe(
          'A record id, a name such as "button", or "id#section", such as component.button#rules.',
        ),
      implementation: z
        .string()
        .optional()
        .describe('An implementation name, such as "web". Only with a whole record.'),
    },
    ({ target, implementation }) =>
      ops.get(
        spec,
        { target, implementation },
        {
          implementations: resolveConfig(loadOptions).implementations,
          tokensHint: (_id, count) =>
            `Tokens: ${count} bindings, left out here. Call \`tokens\` to filter them by part, condition, or property.`,
          implementationHint: (id, names) =>
            `Implementations: ${names.join(", ")}. Call ${nextCall(id, names)} for the package, import, and API names.`,
        },
      ),
  );
  tool(
    "list",
    "List every record with its summary, optionally filtered. Use to see what exists.",
    {
      type,
      tag,
      status: z.enum(["draft", "stable", "deprecated"]).optional(),
    },
    (args) => ops.list(spec, args),
  );
  tool(
    "links",
    "Follow relationships from a record: alternatives (when it is the wrong choice), patterns it follows, examples, and related records. Use after `get` to find the better component or the guidance that applies.",
    {
      id: z.string().describe("A record id."),
      kind: z.enum(LINK_KINDS).optional().describe("Only this kind of link."),
      direction: z.enum(["out", "in", "both"]).optional().describe('Default "out".'),
    },
    (args) => ops.links(spec, args),
  );
  tool(
    "rules",
    "Get must/should/may rules to review a design or implementation against; cite rules by address. Filter by record id (or address), topic, level, or text.",
    {
      id: z.string().optional().describe("A record id or rule address."),
      topic: z.enum(["content", "behavior", "accessibility"]).optional(),
      level: z.enum(["must", "should", "may"]).optional(),
      query: z.string().optional().describe("Text to look for in rule statements."),
    },
    (args) =>
      ops.rules(spec, args, {
        detailHint: (address) =>
          `Rationale, references, and examples are left out. Call \`get\` with a rule address, such as ${address}, to read it in full.`,
      }),
  );
  tool(
    "tokens",
    "Look up which design tokens a component part uses in a given variant or state; set resolve to get values.",
    {
      id: z.string().describe("A component id, such as component.button."),
      part: z.string().optional().describe("An anatomy part, such as control."),
      condition: z
        .string()
        .optional()
        .describe('A state or variant condition, such as "variant.primary + hover".'),
      property: z.string().optional().describe("A style property, such as background."),
      resolve: z.boolean().optional().describe("Include token values for each configured set."),
    },
    // Token files are read only here, so a broken token file cannot fail `get` or a resource read.
    (args) =>
      ops.tokens(spec, args, {
        resolveToken: args.resolve ? resolveConfig(loadOptions).resolveToken : undefined,
      }),
  );
  tool(
    "format",
    "Read the format reference that records do not repeat: the property names token bindings use, token keywords, condition syntax, anatomy roles, and the system-wide constants (such as border width and focus-ring width and offset) with the tokens that hold them. Use before styling a part a record does not bind.",
    {
      resolve: z.boolean().optional().describe("Include each constant's value in each token set."),
    },
    (args) => {
      const { constants, resolveToken } = resolveConfig(loadOptions);
      return ops.format(args, {
        constants,
        resolveToken: args.resolve ? resolveToken : undefined,
        resolveHint: "Call `format` with resolve for values.",
      });
    },
  );
  tool(
    "validate",
    "Check every record in the content folder and list issues. Use after editing content.",
    {},
    async () => {
      const { issues, recordCount } = await validateFromConfig(loadOptions);
      return ops.formatIssues(issues, recordCount);
    },
  );

  server.registerResource(
    "record",
    new ResourceTemplate("spec://{id}", {
      list: () => ({
        resources: spec.list().map((record) => ({
          uri: `spec://${record.id}`,
          name: record.id,
          title: record.title,
          description: record.summary,
          mimeType: "text/markdown",
        })),
      }),
    }),
    { description: "A record rendered as Markdown.", mimeType: "text/markdown" },
    (uri, { id }) => {
      const target = decodeURIComponent(String(id));
      if (!spec.get(target.split("#")[0])) throw new Error(`Unknown record "${target}".`);
      return {
        contents: [
          { uri: uri.href, mimeType: "text/markdown", text: disclose(spec.render(target)) },
        ],
      };
    },
  );

  let watcher;
  let timer;
  if (watch) {
    try {
      watcher = fs.watch(spec.contentDir, { recursive: true }, () => {
        clearTimeout(timer);
        timer = setTimeout(reload, debounceMs);
      });
      watcher.on("error", () => {});
    } catch {
      // Watching is a convenience; the server still works without it.
    }
  }
  return {
    server,
    reload,
    close() {
      clearTimeout(timer);
      watcher?.close();
    },
  };
}
