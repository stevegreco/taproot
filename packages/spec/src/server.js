import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import * as ops from "./operations.js";
import { AGENT_INSTRUCTIONS } from "./agents.js";
import { openSnapshot } from "./snapshot.js";
import packageJson from "../package.json" with { type: "json" };

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
 * The answers a server reads. Each is a function, because the local server's change as files change.
 *
 * @typedef {object} ServerSource
 * @property {() => import("./spec.js").Spec} spec
 * @property {() => { implementations: Record<string, ops.ImplementationSource>, constants: Record<string, string>, resolveToken?: (ref: string) => Record<string, string> | undefined }} config
 * @property {() => string | undefined} [warning] Why the answers may be stale, for the start of each one.
 * @property {() => Promise<ops.Result>} [validate] Offers the `validate` tool, which needs source files.
 */

/**
 * Create the MCP server. This module and what it imports use no Node APIs, so it runs on any host.
 *
 * @param {ServerSource} source
 * @returns {McpServer}
 */
export function createServer(source) {
  const { warning: readWarning = () => undefined } = source;
  const server = new McpServer(
    { name: "taproot", version: packageJson.version },
    { instructions: AGENT_INSTRUCTIONS },
  );

  /** Prefix text with the stale-content warning while the last reload has issues. */
  const disclose = (text) => {
    const warning = readWarning();
    return warning
      ? `WARNING: the content has issues, so this answer comes from the last valid version.\n${warning}\n\n${text}`
      : text;
  };

  /** @param {ops.Result} result */
  const toResult = (result) => {
    const text = disclose(result.text);
    const warning = readWarning();
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
      ops.search(source.spec(), args, {
        implementations: source.config().implementations,
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
          'A record id, a name such as "button", or "id#section", such as component.button#rules or component.card#parts.title.',
        ),
      implementation: z
        .string()
        .optional()
        .describe('An implementation name, such as "web". Only with a whole record.'),
    },
    ({ target, implementation }) =>
      ops.get(
        source.spec(),
        { target, implementation },
        {
          implementations: source.config().implementations,
          tokensHint: (_id, count) =>
            `Tokens: ${count} bindings, left out here. Call \`tokens\` to filter them by part, condition, or property.`,
          implementationHint: (id, names) =>
            `Implementations: ${names.join(", ")}. Call ${nextCall(id, names)} for the package, import, and API names.`,
          setupHint: (name) =>
            `Setup: install, styles, and fonts are the same for every component. Call \`setup\` with implementation "${name}" once per project.`,
        },
      ),
  );
  tool(
    "setup",
    "Read the setup every component of an implementation shares: installing the package, loading its styles and the optional page defaults, and fonts. Read it once per project, before building with an implementation's components.",
    {
      implementation: z.string().describe('An implementation name, such as "web" or "react".'),
    },
    ({ implementation }) =>
      ops.setup({ implementation }, { implementations: source.config().implementations }),
  );
  tool(
    "list",
    "List every record with its summary, optionally filtered. Use to see what exists.",
    {
      type,
      tag,
      status: z.enum(["draft", "stable", "deprecated"]).optional(),
      implementation: z
        .string()
        .optional()
        .describe('Only components this implementation has, such as "react".'),
    },
    (args) => ops.list(source.spec(), args, { implementations: source.config().implementations }),
  );
  tool(
    "links",
    "Follow relationships from a record: alternatives (when it is the wrong choice), patterns it follows, examples, and related records. Use after `get` to find the better component or the guidance that applies.",
    {
      id: z.string().describe("A record id."),
      kind: z.enum(LINK_KINDS).optional().describe("Only this kind of link."),
      direction: z.enum(["out", "in", "both"]).optional().describe('Default "out".'),
    },
    (args) => ops.links(source.spec(), args),
  );
  tool(
    "rules",
    "Get must/should/may rules to review a design or implementation against; cite rules by address. Filter by record id (or address), topic, level, or text. Filtered to a component, the list includes the rules it inherits from the patterns and guidelines it follows.",
    {
      id: z.string().optional().describe("A record id or rule address."),
      topic: z.enum(["content", "behavior", "accessibility"]).optional(),
      level: z.enum(["must", "should", "may"]).optional(),
      query: z.string().optional().describe("Text to look for in rule statements."),
    },
    (args) =>
      ops.rules(source.spec(), args, {
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
      ops.tokens(source.spec(), args, {
        resolveToken: args.resolve ? source.config().resolveToken : undefined,
      }),
  );
  tool(
    "format",
    "Read the format reference that records do not repeat: the property names token bindings use, token keywords, condition syntax, anatomy roles, and the system-wide constants (such as border width and focus-ring width and offset) with the tokens that hold them. Use before styling a part a record does not bind.",
    {
      resolve: z.boolean().optional().describe("Include each constant's value in each token set."),
    },
    (args) => {
      const { constants, resolveToken } = source.config();
      return ops.format(args, {
        constants,
        resolveToken: args.resolve ? resolveToken : undefined,
        resolveHint: "Call `format` with resolve for values.",
      });
    },
  );
  if (source.validate) {
    tool(
      "validate",
      "Check every record in the content folder and list issues. Use after editing content.",
      {},
      source.validate,
    );
  }

  server.registerResource(
    "record",
    new ResourceTemplate("spec://{id}", {
      list: () => ({
        resources: source
          .spec()
          .list()
          .map((record) => ({
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
      const spec = source.spec();
      if (!spec.get(target.split("#")[0])) throw new Error(`Unknown record "${target}".`);
      return {
        contents: [
          { uri: uri.href, mimeType: "text/markdown", text: disclose(spec.render(target)) },
        ],
      };
    },
  );

  return server;
}

/**
 * Create a read-only MCP server over a snapshot. See ADR 0006.
 *
 * @param {import("./snapshot.js").Snapshot} snapshot
 * @returns {McpServer}
 */
export function createSnapshotServer(snapshot) {
  const { spec, implementations, constants, resolveToken } = openSnapshot(snapshot);
  const config = { implementations, constants, resolveToken };
  return createServer({ spec: () => spec, config: () => config });
}
