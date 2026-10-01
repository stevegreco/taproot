import { parseArgs } from "node:util";
import { KnowledgeError } from "./index.js";
import { loadFromConfig, resolveConfig } from "./config.js";
import * as ops from "./operations.js";

const str = { type: "string" };

const COMMANDS = {
  validate: {
    usage: "knowledge validate",
    summary: "Check every record; list issues.",
    options: {},
  },
  list: {
    usage: "knowledge list [--type <t>] [--tag <tag>] [--status <s>]",
    summary: "List records, optionally filtered.",
    options: { type: str, tag: str, status: str },
  },
  search: {
    usage: "knowledge search <query...> [--type <t>] [--tag <tag>] [--limit <n>]",
    summary: "Find the component, pattern, or guideline that fits a need.",
    options: { type: str, tag: str, limit: str },
  },
  get: {
    usage: "knowledge get <id | id#section> [--impl <name>]",
    summary:
      "Print a record, or one section of it, as Markdown. --impl web adds the package, element, and attributes.",
    options: { impl: str },
  },
  links: {
    usage: "knowledge links <id> [--kind <k>] [--direction out|in|both]",
    summary: "Show alternatives, patterns followed, examples, and other neighbors.",
    options: { kind: str, direction: str },
  },
  rules: {
    usage: "knowledge rules [--id <id or address>] [--topic <t>] [--level <l>] [--query <text>]",
    summary: "List must/should/may rules to review against.",
    options: { id: str, topic: str, level: str, query: str },
  },
  tokens: {
    usage: "knowledge tokens <id> [--part <p>] [--condition <c>] [--property <p>] [--resolve]",
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
    "knowledge: read the design system knowledge records.",
    "",
    "Commands:",
    ...lines,
    "  knowledge help [command]",
    "",
    "Global flags:",
    "  --content <dir>   Content folder (overrides knowledge.config.json)",
    "  --config <path>   Config file (default: nearest knowledge.config.json)",
    "  --json            Print JSON instead of Markdown",
    "",
    "Exit codes: 0 ok, 1 issues or nothing found, 2 usage error.",
  ].join("\n");
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
    err(`${message}\nRun "knowledge help" for usage.\n`);
    return 2;
  };

  const [command, ...rest] = argv;
  if (!command || command === "help" || command === "--help" || command === "-h") {
    const target = command === "help" ? rest[0] : undefined;
    if (target && !COMMANDS[target]) return usageError(`Unknown command "${target}".`);
    out(`${helpText(target)}\n`);
    return 0;
  }
  const spec = COMMANDS[command];
  if (!spec) return usageError(`Unknown command "${command}".`);

  let parsed;
  try {
    parsed = parseArgs({
      args: rest,
      options: { ...GLOBAL, ...spec.options },
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
    out(`${values.json ? JSON.stringify(result.data, null, 2) : result.text}\n`);
    return result.ok ? 0 : 1;
  };

  try {
    if (command === "validate") {
      const { contentDir } = resolveConfig(loadOptions);
      return print(await ops.validate({ contentDir }));
    }

    const needsPositional = { get: 1, links: 1, tokens: 1 }[command] ?? 0;
    if (command !== "search" && positionals.length !== needsPositional) {
      return usageError(
        needsPositional
          ? `${command} needs exactly one id.`
          : `${command} takes no positional arguments.`,
      );
    }
    if (values.limit !== undefined && !/^[1-9]\d*$/.test(values.limit)) {
      return usageError("--limit must be a positive integer.");
    }
    if (values.direction !== undefined && !["out", "in", "both"].includes(values.direction)) {
      return usageError("--direction must be out, in, or both.");
    }

    const knowledge = await loadFromConfig({
      ...loadOptions,
      resolveTokens: command === "tokens" && Boolean(values.resolve),
    });
    const [first] = positionals;
    const args = { ...values, limit: values.limit ? Number(values.limit) : undefined };
    switch (command) {
      case "list":
        return print(ops.list(knowledge, args));
      case "search":
        return print(ops.search(knowledge, { ...args, query: positionals.join(" ") }));
      case "get": {
        const { implementations } = resolveConfig(loadOptions);
        return print(
          ops.get(
            knowledge,
            { target: first, implementation: values.impl },
            {
              implementations,
              hint: (id, names) =>
                `Implementation: run \`knowledge get ${id} --impl ${names[0]}\` for the package, element, and attribute names${names.length > 1 ? ` (available: ${names.join(", ")})` : ""}.`,
            },
          ),
        );
      }
      case "links":
        return print(ops.links(knowledge, { ...args, id: first }));
      case "rules":
        return print(ops.rules(knowledge, args));
      case "tokens":
        return print(ops.tokens(knowledge, { ...args, id: first }));
    }
    return usageError(`Unknown command "${command}".`);
  } catch (error) {
    if (error instanceof ops.UsageError) return usageError(error.message);
    if (error instanceof KnowledgeError) {
      const result = ops.formatIssues(error.issues, 0);
      err(`Invalid knowledge content:\n${result.text.replace(/\n[^\n]*$/, "")}\n`);
      return 1;
    }
    err(`${error.message}\n`);
    return 2;
  }
}
