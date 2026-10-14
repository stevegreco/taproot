import { execFileSync } from "node:child_process";
import { parseArgs } from "node:util";
import { SpecError } from "./index.js";
import { loadFromConfig, resolveConfig } from "./config.js";
import * as ops from "./operations.js";

const str = { type: "string" };

const COMMANDS = {
  validate: {
    usage: "ds-spec validate [--issues]",
    summary:
      "Check every record; list issues. --issues also warns about known issues whose tracking issue is closed (uses the network).",
    options: { issues: { type: "boolean" } },
  },
  list: {
    usage: "ds-spec list [--type <t>] [--tag <tag>] [--status <s>]",
    summary: "List records, optionally filtered.",
    options: { type: str, tag: str, status: str },
  },
  search: {
    usage: "ds-spec search <query...> [--type <t>] [--tag <tag>] [--limit <n>]",
    summary: "Find the component, pattern, or guideline that fits a need.",
    options: { type: str, tag: str, limit: str },
  },
  get: {
    usage: "ds-spec get <id | name | id#section> [--impl <name>]",
    summary:
      "Print a record, or one section of it, as Markdown. --impl web adds the package, element, and attributes.",
    options: { impl: str },
  },
  links: {
    usage: "ds-spec links <id> [--kind <k>] [--direction out|in|both]",
    summary: "Show alternatives, patterns followed, examples, and other neighbors.",
    options: { kind: str, direction: str },
  },
  rules: {
    usage: "ds-spec rules [--id <id or address>] [--topic <t>] [--level <l>] [--query <text>]",
    summary: "List must/should/may rules to review against.",
    options: { id: str, topic: str, level: str, query: str },
  },
  tokens: {
    usage: "ds-spec tokens <id> [--part <p>] [--condition <c>] [--property <p>] [--resolve]",
    summary: "Show which design tokens a component uses; --resolve adds values.",
    options: { part: str, condition: str, property: str, resolve: { type: "boolean" } },
  },
};

const GLOBAL = {
  content: str,
  config: str,
  json: { type: "boolean" },
  help: { type: "boolean", short: "h" },
};

function helpText(command) {
  if (command && COMMANDS[command]) {
    const c = COMMANDS[command];
    return `${c.usage}\n\n${c.summary}\n\nGlobal flags: --content <dir> --config <path> --json`;
  }
  const lines = Object.values(COMMANDS).map((c) => `  ${c.usage}\n      ${c.summary}`);
  return [
    "ds-spec: read the design system spec.",
    "",
    "Commands:",
    ...lines,
    "  ds-spec help [command]",
    "",
    "Global flags:",
    "  --content <dir>   Content folder (overrides spec.config.json)",
    "  --config <path>   Config file (default: nearest spec.config.json)",
    "  --json            Print JSON instead of Markdown",
    "",
    "Exit codes: 0 ok, 1 issues or nothing found, 2 usage error.",
  ].join("\n");
}

/** A token for GitHub lookups: the environment's, or the GitHub CLI's when it is signed in. */
function githubToken() {
  const fromEnv = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (fromEnv) return fromEnv;
  try {
    return (
      execFileSync("gh", ["auth", "token"], {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      }).trim() || undefined
    );
  } catch {
    return undefined;
  }
}

/**
 * Run the CLI. Returns the exit code.
 *
 * @param {string[]} argv Arguments after the executable and script.
 * @param {{ cwd?: string, stdout?: (text: string) => void, stderr?: (text: string) => void }} [io]
 */
export async function run(argv, io = {}) {
  const cwd = io.cwd ?? process.cwd();
  const out = io.stdout ?? ((text) => process.stdout.write(text));
  const err = io.stderr ?? ((text) => process.stderr.write(text));
  const usageError = (message) => {
    err(`${message}\nRun "ds-spec help" for usage.\n`);
    return 2;
  };

  const [command, ...rest] = argv;
  if (!command || command === "help" || command === "--help" || command === "-h") {
    const target = command === "help" ? rest[0] : undefined;
    if (target && !COMMANDS[target]) return usageError(`Unknown command "${target}".`);
    out(`${helpText(target)}\n`);
    return 0;
  }
  const definition = COMMANDS[command];
  if (!definition) return usageError(`Unknown command "${command}".`);

  let parsed;
  try {
    parsed = parseArgs({
      args: rest,
      options: { ...GLOBAL, ...definition.options },
      allowPositionals: true,
    });
  } catch (error) {
    return usageError(error.message);
  }
  const { values, positionals } = parsed;
  if (values.help) {
    out(`${helpText(command)}\n`);
    return 0;
  }

  const loadOptions = {
    cwd,
    contentDir: values.content,
    configPath: values.config,
  };
  const print = (result) => {
    // A failed lookup prints an error envelope in JSON: branch on `code`, not on the message.
    const json = result.error
      ? { error: result.text, code: result.error.code, suggestions: result.error.suggestions }
      : result.data;
    out(`${values.json ? JSON.stringify(json, null, 2) : result.text}\n`);
    return result.ok ? 0 : 1;
  };

  try {
    if (command === "validate") {
      const { contentDir } = resolveConfig(loadOptions);
      const token = values.issues ? githubToken() : undefined;
      return print(await ops.validate({ contentDir, checkIssues: values.issues, token }));
    }

    // An id can be a name with spaces, such as `get text field`, so its words are joined.
    const takesId = ["get", "links", "tokens"].includes(command);
    if (takesId && positionals.length === 0) return usageError(`${command} needs an id.`);
    if (!takesId && command !== "search" && positionals.length > 0) {
      return usageError(`${command} takes no positional arguments.`);
    }
    if (values.limit !== undefined && !/^[1-9]\d*$/.test(values.limit)) {
      return usageError("--limit must be a positive integer.");
    }
    if (values.direction !== undefined && !["out", "in", "both"].includes(values.direction)) {
      return usageError("--direction must be out, in, or both.");
    }

    const spec = await loadFromConfig({
      ...loadOptions,
      resolveTokens: command === "tokens" && Boolean(values.resolve),
    });
    const first = positionals.join(" ");
    const { implementations } = resolveConfig(loadOptions);
    const args = { ...values, limit: values.limit ? Number(values.limit) : undefined };
    switch (command) {
      case "list":
        return print(ops.list(spec, args));
      case "search":
        return print(
          ops.search(
            spec,
            { ...args, query: positionals.join(" ") },
            {
              implementations,
              next: (id, impl) => `ds-spec get ${id}${impl ? ` --impl ${impl}` : ""}`,
            },
          ),
        );
      case "get": {
        return print(
          ops.get(
            spec,
            { target: first, implementation: values.impl },
            {
              implementations,
              tokensHint: (id, count) =>
                `Tokens: ${count} bindings, left out here. Run \`ds-spec tokens ${id}\` to filter them by part, condition, or property.`,
              implementationHint: (id, names) =>
                `Implementation: run \`ds-spec get ${id} --impl ${names[0]}\` for the package, element, and attribute names${names.length > 1 ? ` (available: ${names.join(", ")})` : ""}.`,
            },
          ),
        );
      }
      case "links":
        return print(ops.links(spec, { ...args, id: first }));
      case "rules":
        return print(
          ops.rules(spec, args, {
            detailHint: (address) =>
              `Rationale, references, and examples are left out. Run \`ds-spec get <address>\`, such as \`ds-spec get ${address}\`, to read a rule in full.`,
          }),
        );
      case "tokens":
        return print(ops.tokens(spec, { ...args, id: first }));
    }
    return usageError(`Unknown command "${command}".`);
  } catch (error) {
    if (error instanceof ops.UsageError) return usageError(error.message);
    if (error instanceof SpecError) {
      const result = ops.formatIssues(error.issues, 0);
      err(`Invalid spec content:\n${result.text.replace(/\n[^\n]*$/, "")}\n`);
      return 1;
    }
    err(`${error.message}\n`);
    return 2;
  }
}
