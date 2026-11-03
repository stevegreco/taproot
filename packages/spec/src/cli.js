import { parseArgs } from "node:util";
import { AGENT_INSTRUCTIONS } from "./agents.js";
import { loadFromConfig, resolveConfig, validateFromConfig } from "./config.js";
import { INVERSE } from "./links.js";
import * as ops from "./operations.js";
import { schema } from "./schema/info.js";
import { splitWords } from "./util.js";

const str = { type: "string" };

const COMMANDS = {
  validate: {
    usage: "ds-spec validate",
    summary: "Check every record; list issues.",
    options: {},
  },
  list: {
    usage: "ds-spec list [--type <t>] [--tag <tag>] [--status <s>] [--impl <name>]",
    summary:
      "List records, optionally filtered. --impl <name> lists the components that implementation has.",
    options: { type: str, tag: str, status: str, impl: str },
  },
  search: {
    usage: "ds-spec search <query...> [--type <t>] [--tag <tag>] [--limit <n>]",
    summary: "Find the component, pattern, or guideline that fits a need.",
    options: { type: str, tag: str, limit: str },
  },
  get: {
    usage: "ds-spec get <id | name | id#section> [--impl <name>]",
    summary:
      "Print a record, or one section of it, as Markdown. --impl <name> adds how that technology implements it: package, import, and API names.",
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
  format: {
    usage: "ds-spec format [--resolve]",
    summary:
      "Print the format reference: token binding properties, keywords, anatomy roles, and the system-wide constant tokens; --resolve adds values.",
    options: { resolve: { type: "boolean" } },
  },
  batch: {
    usage: 'ds-spec batch --command "<command>" [--command "<command>" ...]',
    summary:
      "Run several commands in one process, loading the spec once. Prints one result per command, in order, or a JSON array with --json. The exit code is the worst command's.",
    options: { command: { type: "string", multiple: true } },
  },
};

/** Global flags a batch passes to every command, so its commands do not set them. */
const BATCH_FLAGS = ["--json", "--content", "--config"];

/**
 * Loads the spec once per set of options and shares it between the commands of a batch. The
 * warning about left-out record files is written once, by the first command that loads.
 */
function createLoader() {
  const cache = new Map();
  return (options, err) => {
    const key = JSON.stringify(options);
    if (!cache.has(key)) {
      cache.set(
        key,
        loadFromConfig(options).then((spec) => {
          const skipped = [...new Set(spec.issues.map((issue) => issue.file))];
          if (skipped.length > 0) {
            err(
              `Warning: left out ${skipped.length} record file${skipped.length === 1 ? "" : "s"} with issues: ${skipped.join(", ")}. Run "ds-spec validate" for details.\n`,
            );
          }
          return spec;
        }),
      );
    }
    return cache.get(key);
  };
}

/** The next call for a record, naming each implementation that has a file for it. */
function nextCall(id, names) {
  if (names.length === 0) return `ds-spec get ${id}`;
  return `ds-spec get ${id} --impl ${names.length === 1 ? names[0] : `<${names.join(" | ")}>`}`;
}

/** The values each filter flag takes. Any other value is a usage error. */
const CHOICES = {
  type: schema.properties.type.enum,
  status: schema.properties.status.enum,
  topic: schema.$defs.rule.properties.topic.enum,
  level: schema.$defs.rule.properties.level.enum,
  kind: Object.keys(INVERSE),
  direction: ["out", "in", "both"],
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
    "  ds-spec help agents",
    "      How an agent should use the spec.",
    "",
    "Global flags:",
    "  --content <dir>   Content folder (overrides spec.config.json)",
    "  --config <path>   Config file (default: nearest spec.config.json)",
    "  --json            Print JSON instead of Markdown",
    "",
    "Exit codes: 0 ok, 1 issues or nothing found, 2 usage error.",
  ].join("\n");
}

/**
 * Run the CLI. Returns the exit code.
 *
 * @param {string[]} argv Arguments after the executable and script.
 * @param {{ cwd?: string, stdout?: (text: string) => void, stderr?: (text: string) => void, load?: ReturnType<typeof createLoader> }} [io]
 *   `load` shares loaded specs between the commands of a batch.
 */
export async function run(argv, io = {}) {
  const cwd = io.cwd ?? process.cwd();
  const load = io.load ?? createLoader();
  const out = io.stdout ?? ((text) => process.stdout.write(text));
  const err = io.stderr ?? ((text) => process.stderr.write(text));
  const usageError = (message) => {
    err(`${message}\nRun "ds-spec help" for usage.\n`);
    return 2;
  };

  const [command, ...rest] = argv;
  if (!command || command === "help" || command === "--help" || command === "-h") {
    const target = command === "help" ? rest[0] : undefined;
    if (target === "agents") {
      out(`${AGENT_INSTRUCTIONS}\n`);
      return 0;
    }
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
    // An empty result exits 1 too, so "nothing found" never reads as success.
    const empty = Array.isArray(result.data) && result.data.length === 0;
    return result.ok && !empty ? 0 : 1;
  };

  if (command === "batch") {
    if (positionals.length > 0) return usageError("batch takes its commands with --command.");
    if (!values.command?.length) return usageError("batch needs at least one --command.");
    return runBatch(values, { cwd, out, err, load });
  }

  try {
    if (command === "validate") {
      const { issues, recordCount } = await validateFromConfig(loadOptions);
      return print(ops.formatIssues(issues, recordCount));
    }
    if (command === "format") {
      if (positionals.length > 0) return usageError("format takes no positional arguments.");
      const { constants, resolveToken } = resolveConfig(loadOptions);
      return print(
        ops.format(
          { resolve: values.resolve },
          {
            constants,
            resolveToken,
            resolveHint: "Run `ds-spec format --resolve` for values.",
          },
        ),
      );
    }

    // An id can be a name with spaces, such as `get text field`, so its words are joined.
    const takesId = ["get", "links", "tokens"].includes(command);
    if (takesId && positionals.length === 0) return usageError(`${command} needs an id.`);
    if (!takesId && command !== "search" && positionals.length > 0) {
      return usageError(
        `${command} takes no positional arguments. Quote a value of several words, such as --query 'dismiss label'.`,
      );
    }
    if (values.limit !== undefined && !/^[1-9]\d*$/.test(values.limit)) {
      return usageError("--limit must be a positive integer.");
    }
    for (const [flag, choices] of Object.entries(CHOICES)) {
      if (values[flag] !== undefined && !choices.includes(values[flag])) {
        return usageError(`--${flag} must be one of: ${choices.join(", ")}.`);
      }
    }

    // One invalid record, such as a draft with TODOs, must not hide the rest.
    const spec = await load(
      {
        ...loadOptions,
        resolveTokens: command === "tokens" && Boolean(values.resolve),
        skipInvalid: true,
      },
      err,
    );
    const first = positionals.join(" ");
    const { implementations } = resolveConfig(loadOptions);
    const args = { ...values, limit: values.limit ? Number(values.limit) : undefined };
    switch (command) {
      case "list":
        return print(ops.list(spec, { ...args, implementation: values.impl }, { implementations }));
      case "search":
        return print(
          ops.search(
            spec,
            { ...args, query: positionals.join(" ") },
            {
              implementations,
              next: nextCall,
              browse: "`ds-spec list`",
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
                `Implementations: ${names.join(", ")}. Run \`${nextCall(id, names)}\` for the package, import, and API names.`,
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
    err(`${error.message}\n`);
    return 2;
  }
}

/**
 * Run each `--command` in this process with the batch's global flags, sharing one loaded spec.
 * Each command's output is exactly what it prints alone, under a `$ ds-spec <command>` line; with
 * `--json`, the batch prints an array of `{ command, exitCode, result }`, where `result` is the
 * command's own JSON, and `stderr` when the command wrote any. A failed command does not stop the
 * others, and the batch exits with the highest exit code.
 */
async function runBatch(values, { cwd, out, err, load }) {
  const flags = [
    ...(values.json ? ["--json"] : []),
    ...(values.content ? ["--content", values.content] : []),
    ...(values.config ? ["--config", values.config] : []),
  ];
  const results = [];
  for (const line of values.command) {
    let stdout = "";
    let stderr = "";
    const capture = {
      cwd,
      load,
      stdout: (text) => (stdout += text),
      stderr: (text) => (stderr += text),
    };
    let exitCode;
    let words;
    try {
      words = splitWords(line);
    } catch (error) {
      stderr = `Cannot read "${line}": ${error.message}.\n`;
      exitCode = 2;
    }
    if (words) {
      const flag = words.find((word) => BATCH_FLAGS.includes(word.split("=")[0]));
      if (words.length === 0) {
        stderr = "An empty --command.\n";
        exitCode = 2;
      } else if (words[0] === "batch") {
        stderr = "A batch cannot run batch.\n";
        exitCode = 2;
      } else if (flag) {
        stderr = `Put ${flag.split("=")[0]} on batch, not on its commands.\n`;
        exitCode = 2;
      } else {
        exitCode = await run([...words, ...flags], capture);
      }
    }
    results.push({ command: line, exitCode, stdout, stderr });
  }

  if (values.json) {
    const parse = (text) => {
      if (!text.trim()) return null;
      try {
        return JSON.parse(text);
      } catch {
        return text.trimEnd();
      }
    };
    const json = results.map(({ command, exitCode, stdout, stderr }) => ({
      command,
      exitCode,
      result: parse(stdout),
      ...(stderr ? { stderr: stderr.trimEnd() } : {}),
    }));
    out(`${JSON.stringify(json, null, 2)}\n`);
  } else {
    out(results.map(({ command, stdout }) => `$ ds-spec ${command}\n${stdout}`).join("\n"));
    for (const { command, stderr } of results) {
      if (stderr) err(`$ ds-spec ${command}\n${stderr}`);
    }
  }
  return Math.max(...results.map((result) => result.exitCode));
}
