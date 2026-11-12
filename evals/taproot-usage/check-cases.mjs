#!/usr/bin/env node
// Checks each case's expected answer against the current spec, then writes cases.md for review.
// Costs nothing: it runs the taproot CLI and calls no model.
// Run from the repository root: node evals/taproot-usage/check-cases.mjs

import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const cases = JSON.parse(readFileSync(join(here, "cases.json"), "utf8"));

function taproot(args) {
  try {
    return execSync(`node packages/spec/bin/taproot.js ${args}`, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (error) {
    return `${error.stdout ?? ""}${error.stderr ?? ""}`;
  }
}

const records = taproot("list");
const problems = [];

const seen = new Set();
for (const c of cases) {
  if (seen.has(c.id)) problems.push(`${c.id}: duplicate id`);
  seen.add(c.id);

  for (const id of c.expected.components ?? []) {
    if (!records.includes(`- ${id} `)) problems.push(`${c.id}: no record named ${id}`);
  }
  if (c.source) {
    const output = taproot(c.source).toLowerCase();
    for (const [field, value] of Object.entries(c.expected)) {
      if (value === null || typeof value === "boolean") continue;
      if (!output.includes(String(value).toLowerCase())) {
        problems.push(`${c.id}: "${value}" (${field}) not in \`taproot ${c.source}\``);
      }
    }
  }
  if (c.absentFrom && taproot(c.absentFrom.source).includes(c.absentFrom.text)) {
    problems.push(
      `${c.id}: ${c.absentFrom.text} now appears in \`taproot ${c.absentFrom.source}\``,
    );
  }
  if (c.fields && c.fields.some((field) => !(field in c.expected))) {
    problems.push(`${c.id}: a requested field has no expected value`);
  }
}

const count = (tag) => cases.filter((c) => c.tags.includes(tag)).length;
const cell = (text) => String(text).replaceAll("|", "\\|");
const answer = (c) =>
  c.expected.components
    ? c.expected.components.join(" + ") || "(no component: says none fits)"
    : Object.entries(c.expected)
        .map(([key, value]) => `${key}: ${value}`)
        .join("; ");

const groups = ["choose", "no-match", "compose", "fact"];
const sections = groups.map((group) => {
  const rows = cases
    .filter((c) => c.tags[0] === group)
    .map((c) => `| \`${c.id}\` | ${cell(c.prompt)} | ${cell(answer(c))} |`);
  return [
    `## ${group} (${rows.length})`,
    "",
    "| Id | Request | Expected |",
    "| --- | --- | --- |",
    ...rows,
  ].join("\n");
});

writeFileSync(
  join(here, "cases.md"),
  `# Taproot usage eval: draft tasks

Generated from \`cases.json\` by \`check-cases.mjs\`. ${cases.length} tasks. Each runs through the CLI, the MCP server, and the control with neither.

Drafted from the spec, not from real requests, so they may be cleaner than what people actually ask.

${sections.join("\n\n")}
`,
);

console.log(
  `${cases.length} cases: ${count("choose")} choose (${count("trap")} traps), ${count("no-match")} no-match, ${count("compose")} compose, ${count("fact")} fact`,
);
if (problems.length) {
  console.error(problems.join("\n"));
  process.exit(1);
}
console.log("every expected answer matches the spec");
