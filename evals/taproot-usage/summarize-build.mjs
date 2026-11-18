#!/usr/bin/env node
// Prints a Markdown summary of the build suite's runs: metrics per setup, results per task, and
// counts from the transcripts that point at what to read. Run from the repository root:
//   node evals/taproot-usage/summarize-build.mjs [flow-dir]

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const flow = process.argv[2] ?? "evals/taproot-usage/build-runs";
const SETUPS = { baseline: "No spec tools", v1: "CLI", v2: "MCP" };
const METRICS = ["correct", "components", "api", "rules", "task", "setup"];

const rows = {};
const traces = {};
for (const variant of Object.keys(SETUPS)) {
  const file = join(flow, variant, "results.jsonl");
  if (!existsSync(file)) continue;
  rows[variant] = readFileSync(file, "utf8")
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));
  traces[variant] = Object.fromEntries(
    rows[variant].map((row) => {
      const path = join(flow, variant, "traces", `${row.prompt_id}_rep${row.rep}.json`);
      return [row.prompt_id, existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : []];
    }),
  );
}

const variants = Object.keys(rows);
const mean = (list) => list.reduce((sum, n) => sum + n, 0) / (list.length || 1);
const median = (list) => {
  const sorted = [...list].sort((a, b) => a - b);
  return sorted.length ? sorted[Math.floor((sorted.length - 1) / 2)] : 0;
};
const pass = (variant, metric) =>
  `${rows[variant].filter((row) => row.grade[metric]).length}/${rows[variant].length}`;

console.log(`| Metric | ${variants.map((v) => SETUPS[v]).join(" | ")} |`);
console.log(`| --- | ${variants.map(() => "---").join(" | ")} |`);
for (const metric of METRICS) {
  console.log(`| ${metric} | ${variants.map((v) => pass(v, metric)).join(" | ")} |`);
}
const perf = [
  ["Median time (s)", (r) => r.latency_s, (n) => n.toFixed(0)],
  ["Median tokens", (r) => r.tokens, (n) => `${Math.round(n / 1000)}k`],
  ["Median tool calls", (r) => r.tool_calls, (n) => String(n)],
  ["Mean cost ($)", (r) => r.agent_cost_usd, (n) => n.toFixed(2), mean],
];
for (const [label, pick, format, reduce = median] of perf) {
  console.log(
    `| ${label} | ${variants.map((v) => format(reduce(rows[v].map(pick)))).join(" | ")} |`,
  );
}

console.log("\n| Task | " + variants.map((v) => SETUPS[v]).join(" | ") + " |");
console.log(`| --- | ${variants.map(() => "---").join(" | ")} |`);
const ids = [...new Set(variants.flatMap((v) => rows[v].map((row) => row.prompt_id)))];
for (const id of ids) {
  const cells = variants.map((v) => {
    const row = rows[v].find((r) => r.prompt_id === id);
    if (!row) return "not run";
    if (row.grade.correct) return "pass";
    return `fail: ${Object.keys(row.explanation ?? {}).join(", ")}`;
  });
  console.log(`| ${id} | ${cells.join(" | ")} |`);
}

// Transcript counts. Each is a prompt to read those transcripts, not a verdict.
const SOURCE = /@taproot-ds\/[\w-]+\/(src|dist|content)\//;
const signals = {
  "Calls that read package files": (call) => SOURCE.test(call.content),
  "Spec tool calls": (call) =>
    call.name.startsWith("mcp__taproot__") || /taproot (?!help)/.test(call.content),
  "Calls to `help`": (call) => /taproot help|taproot --help/.test(call.content),
  "Calls using `batch`": (call) =>
    /taproot batch/.test(call.content) || call.name === "mcp__taproot__batch",
  "Reads of saved tool output": (call) => call.name === "Read" && /tool-results/.test(call.content),
  "Failed tool results": () => false,
};

console.log(`\n| Transcript count (all tasks) | ${variants.map((v) => SETUPS[v]).join(" | ")} |`);
console.log(`| --- | ${variants.map(() => "---").join(" | ")} |`);
for (const [label, test] of Object.entries(signals)) {
  const cells = variants.map((v) => {
    if (label === "Failed tool results") {
      return String(rows[v].reduce((sum, row) => sum + (row.failed_tool_calls ?? 0), 0));
    }
    return String(
      Object.values(traces[v])
        .flat()
        .filter((m) => m.role === "tool_call" && test(m)).length,
    );
  });
  console.log(`| ${label} | ${cells.join(" | ")} |`);
}

for (const v of variants) {
  for (const row of rows[v]) {
    if (row.explanation) {
      console.log(`\n- ${SETUPS[v]} / ${row.prompt_id}:`);
      for (const [metric, text] of Object.entries(row.explanation)) {
        console.log(`  - ${metric}: ${text}`);
      }
    }
  }
}
