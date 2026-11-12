// The Taproot-specific half of the eval: the three setups, how one agent run happens, and how its
// answer is scored. run-eval.mjs is the generic runner around this.

import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const projectDir = process.env.TAPROOT_EVAL_PROJECT ?? join(tmpdir(), "taproot-eval-project");
const claudeBin = process.env.TAPROOT_EVAL_CLAUDE ?? "claude";

const PROJECT_CONTEXT = "You are helping in a project that uses the Taproot design system.";
const MCP_TOOL_PREFIX = "mcp__taproot__";

// The report only reads directories named baseline or v<N>, so the setups use those names.
export const SETUPS = {
  baseline: {
    name: "control",
    builtInTools: "",
    allowedTools: [],
    mcp: false,
    context: PROJECT_CONTEXT,
  },
  v1: {
    name: "cli",
    builtInTools: "Bash",
    allowedTools: ["Bash(node_modules/.bin/taproot *)"],
    mcp: false,
    context: `${PROJECT_CONTEXT} Its CLI is at node_modules/.bin/taproot, and \`node_modules/.bin/taproot help agents\` explains how to use it.`,
  },
  v2: {
    name: "mcp",
    builtInTools: "",
    allowedTools: [`${MCP_TOOL_PREFIX}*`],
    mcp: true,
    context: PROJECT_CONTEXT,
  },
};

const mcpConfig = (setup) =>
  JSON.stringify({
    mcpServers: setup.mcp
      ? { taproot: { command: "node_modules/.bin/taproot-mcp", args: [] } }
      : {},
  });

/** TAPROOT_EVAL_CASES limits a run to a comma-separated list of ids, for a pilot. */
export async function loadCases() {
  const cases = JSON.parse(readFileSync(join(here, "cases.json"), "utf8"));
  const only = process.env.TAPROOT_EVAL_CASES?.split(",");
  return only ? cases.filter((c) => only.includes(c.id)) : cases;
}

function answerFormat(c) {
  if (c.fields) {
    return `End your reply with one line of JSON with exactly these keys: ${c.fields.join(", ")}. Use null for a value that does not exist.`;
  }
  return 'End your reply with one line of JSON: {"components": ["component.<name>"]}, listing each Taproot component to use. Use an empty list if Taproot has no component for this.';
}

function harnessError(message) {
  const error = new Error(message);
  error.failure_class = "harness";
  return error;
}

/** Fail the attempt if the agent had anything other than the setup's tools. */
function assertIsolated(init, setup) {
  const tools = init.tools ?? [];
  const unexpected = tools.filter((tool) =>
    setup.mcp ? !tool.startsWith(MCP_TOOL_PREFIX) : tool !== setup.builtInTools,
  );
  if (unexpected.length) throw harnessError(`unexpected tools: ${unexpected.join(", ")}`);
  if (setup.builtInTools && !tools.includes(setup.builtInTools)) {
    throw harnessError(`${setup.builtInTools} is missing`);
  }

  const servers = init.mcp_servers ?? [];
  if (setup.mcp) {
    if (!tools.length) throw harnessError("the MCP server supplied no tools");
    if (servers.length !== 1 || servers[0].status !== "connected") {
      throw harnessError(`MCP server not connected: ${JSON.stringify(servers)}`);
    }
  } else if (servers.length) {
    throw harnessError(`unexpected MCP servers: ${JSON.stringify(servers)}`);
  }

  // Claude Code always loads its own built-in plugins. They add no tools or skills here.
  const plugins = (init.plugins ?? []).filter((plugin) => plugin.path !== "builtin");
  if (plugins.length) throw harnessError(`unexpected plugins: ${JSON.stringify(plugins)}`);
  if (init.skills?.length) throw harnessError(`unexpected skills: ${init.skills.join(", ")}`);
}

/** Only what claude needs, so a parent Claude Code session's settings do not reach the agent. */
function cleanEnv() {
  const env = { CLAUDE_CODE_DISABLE_AUTO_MEMORY: "1" };
  for (const name of ["HOME", "PATH", "TMPDIR", "USER", "LANG", "ANTHROPIC_API_KEY"]) {
    if (process.env[name]) env[name] = process.env[name];
  }
  return env;
}

function runClaude(prompt, systemText, setup, ctx) {
  const args = [
    "-p",
    "--output-format",
    "stream-json",
    "--verbose",
    "--model",
    ctx.model,
    "--effort",
    "medium",
    "--setting-sources",
    "",
    "--strict-mcp-config",
    "--mcp-config",
    mcpConfig(setup),
    "--tools",
    setup.builtInTools,
    "--permission-mode",
    "dontAsk",
    "--disable-slash-commands",
    "--no-session-persistence",
    "--append-system-prompt",
    systemText,
    ...(setup.allowedTools.length ? ["--allowedTools", ...setup.allowedTools] : []),
  ];

  return new Promise((resolve, reject) => {
    const child = spawn(claudeBin, args, {
      cwd: projectDir,
      env: cleanEnv(),
      stdio: ["pipe", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => (stdout += chunk));
    child.stderr.on("data", (chunk) => (stderr += chunk));
    child.on("error", reject);
    child.on("close", (code) => resolve({ stdout, stderr, code }));
    child.stdin.end(prompt);
    if (ctx.timeoutS > 0) {
      const timer = setTimeout(() => child.kill("SIGKILL"), ctx.timeoutS * 1000);
      child.on("close", () => clearTimeout(timer));
    }
  });
}

/** Run one agent from the case's request to its final reply. */
export async function runAgent(c, ctx) {
  const setup = SETUPS[ctx.variant];
  if (!setup) throw harnessError(`no setup for variant ${ctx.variant}`);

  const systemText = `${setup.context}\n\n${answerFormat(c)}`;
  const { stdout, stderr, code } = await runClaude(c.prompt, systemText, setup, ctx);

  const events = stdout
    .split("\n")
    .filter((line) => line.startsWith("{"))
    .map((line) => JSON.parse(line));
  const init = events.find((event) => event.type === "system" && event.subtype === "init");
  const result = events.findLast((event) => event.type === "result");
  if (!init || !result) {
    throw harnessError(
      `claude exited ${code} without a result: ${(stderr || stdout).slice(0, 500)}`,
    );
  }
  if (result.is_error) {
    // The runner retries on rate-limit and overload messages, and records anything else.
    throw harnessError(`claude reported an error: ${String(result.result).slice(0, 500)}`);
  }
  assertIsolated(init, setup);

  const transcript = [
    { role: "system", content: systemText },
    { role: "user", content: c.prompt },
  ];
  let model;
  let stopReason;
  let toolCalls = 0;
  let failedToolCalls = 0;
  for (const event of events) {
    if (event.type !== "assistant" && event.type !== "user") continue;
    const message = event.message;
    if (event.type === "assistant") {
      model = message.model ?? model;
      stopReason = message.stop_reason ?? stopReason;
    }
    for (const block of Array.isArray(message.content) ? message.content : []) {
      if (block.type === "text" && event.type === "assistant") {
        transcript.push({ role: "assistant", content: block.text });
      } else if (block.type === "tool_use") {
        toolCalls += 1;
        transcript.push({
          role: "tool_call",
          name: block.name,
          content: JSON.stringify(block.input, null, 2),
        });
      } else if (block.type === "tool_result") {
        if (block.is_error) failedToolCalls += 1;
        const content = Array.isArray(block.content)
          ? block.content.map((part) => part.text ?? "").join("\n")
          : String(block.content ?? "");
        transcript.push({ role: "tool_result", content });
      }
    }
  }

  return {
    output: result.result,
    transcript,
    model,
    usage: result.usage,
    stop_reason: result.stop_reason ?? stopReason,
    tool_calls: toolCalls,
    failed_tool_calls: failedToolCalls,
    agent_cost_usd: result.total_cost_usd,
  };
}

/** The last line that parses as a JSON object, or undefined. */
export function parseAnswer(text) {
  const lines = String(text ?? "")
    .trim()
    .split("\n")
    .reverse();
  for (const line of lines) {
    const candidate = line
      .trim()
      .replace(/^```(json)?|```$/g, "")
      .replace(/^`|`$/g, "")
      .trim();
    if (!candidate.startsWith("{")) continue;
    try {
      const parsed = JSON.parse(candidate);
      if (parsed && typeof parsed === "object") return parsed;
    } catch {
      // Keep looking at earlier lines.
    }
  }
  return undefined;
}

const normalize = (value) =>
  String(value)
    .replace(/[`<>\s]/g, "")
    .toLowerCase();

const componentName = (value) => normalize(value).replace(/^component\./, "");

/** Score a reply. Separate metrics keep "gave no answer" apart from "gave a wrong answer". */
export function gradeAnswer(c, text) {
  const answer = parseAnswer(text);
  if (!answer) {
    return {
      grade: { correct: 0, answered: 0 },
      explanation: { correct: "No JSON answer in the final reply." },
    };
  }

  let wrong = [];
  if (c.expected.components) {
    const given = Array.isArray(answer.components) ? answer.components : null;
    if (!given) {
      return {
        grade: { correct: 0, answered: 0 },
        explanation: { correct: "The JSON answer has no components list." },
      };
    }
    const expected = c.expected.components.map(componentName).sort();
    const actual = [...new Set(given.map(componentName))].sort();
    if (expected.join() !== actual.join()) {
      wrong = [`components: expected [${expected}], got [${actual}]`];
    }
  } else {
    for (const [field, expected] of Object.entries(c.expected)) {
      const actual = answer[field];
      const matches =
        expected === null || typeof expected === "boolean"
          ? actual === expected
          : actual != null && normalize(actual) === normalize(expected);
      if (!matches)
        wrong.push(`${field}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    }
  }

  return {
    grade: { correct: wrong.length ? 0 : 1, answered: 1 },
    explanation: wrong.length ? { correct: wrong.join("; ") } : undefined,
  };
}
