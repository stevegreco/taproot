#!/usr/bin/env node
/**
 * Report what a component still needs: authored files, docs glue, and
 * the definition-of-done checklist in docs/knowledge/new-component.md.
 *
 *   node .agents/skills/create-component/scripts/status.mjs <slug>
 *
 * Exits 1 when a required file is missing. Checklist rows are a
 * keyword scan of the spec; confirm each by reading the spec.
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../../../", import.meta.url));
const slug = process.argv[2];
if (!slug || !/^[a-z][a-z0-9-]*$/.test(slug)) {
  console.error("Usage: status.mjs <slug>   (for example: checkbox)");
  process.exit(2);
}

const specPath = `packages/knowledge/content/components/${slug}/${slug}.spec.yaml`;
const read = (file) => {
  const full = path.join(root, file);
  return existsSync(full) ? readFileSync(full, "utf8") : null;
};

let missing = 0;
const row = (ok, label, detail = "") => {
  if (ok === false) missing += 1;
  const mark = ok === true ? "ok  " : ok === false ? "MISS" : "warn";
  console.log(`  ${mark}  ${label}${detail ? `  (${detail})` : ""}`);
};

console.log(`\nFiles for component.${slug}`);
const files = [
  specPath,
  `packages/components/src/${slug}.js`,
  `packages/components/src/${slug}.css`,
  `packages/components/test/${slug}.test.js`,
  `apps/documentation/examples/${slug}.tsx`,
  `apps/documentation/examples/${slug}.verify.js`,
];
for (const file of files) row(existsSync(path.join(root, file)), file);

console.log("\nGlue (the build generates src/<slug>.d.ts, src/index.js, and src/index.d.ts)");
const prose = existsSync(path.join(root, `apps/documentation/docs/components/${slug}.mdx`));
row(
  prose ? true : "warn",
  `docs/components/${slug}.mdx preview prose`,
  prose ? "" : "optional; the page renders from the catalog",
);
const specSource = read(specPath);
row(/^  example:/m.test(specSource ?? ""), "web example (the docs usage snippet)");
for (const file of [`packages/components/src/${slug}.d.ts`, "packages/components/src/index.js"]) {
  const tracked = spawnSync("git", ["ls-files", "--error-unmatch", file], { cwd: root });
  row(
    tracked.status === 0,
    `${file} is committed`,
    tracked.status === 0 ? "" : "run pnpm build and commit it",
  );
}
const nav = read("apps/documentation/docs/components/meta.ts") ?? "";
row(
  nav.includes(`"${slug}"`) ? true : "warn",
  "docs/components/meta.ts nav order",
  nav.includes(`"${slug}"`) ? "" : "optional; unlisted pages sort last",
);

const exampleSource = read(`apps/documentation/examples/${slug}.tsx`);
if (exampleSource) {
  row(
    exampleSource.includes(`\`${slug}.verify.js\``),
    `examples/${slug}.tsx Verify header names ${slug}.verify.js`,
  );
}

if (specSource) {
  const requireFromKnowledge = createRequire(path.join(root, "packages/knowledge/package.json"));
  const { parse } = requireFromKnowledge("yaml");
  const contract = parse(specSource).contract ?? {};
  checklist(contract);
}

console.log(missing ? `\n${missing} required item(s) missing.` : "\nNo required items missing.");
process.exit(missing ? 1 : 0);

/** Where each new-component.md checklist item is decided, by keyword. */
function checklist(contract) {
  const parameters = Object.keys(contract.parameters ?? {});
  const states = contract.states ?? [];
  const rules = [...(contract.behavior ?? []), ...(contract.accessibility?.requirements ?? [])].map(
    (rule) => `${rule.id} ${rule.statement}`,
  );
  const rationale = (contract.rationale ?? []).map((item) => `${item.decision} ${item.rationale}`);

  const items = [
    ["Disabled", /\bdisabled?\b/i],
    ["Visited, selected, or checked", /\b(visited|selected|checked|pressed|toggle)\b/i],
    ["Loading", /\b(loading|busy|pending)\b/i],
    ["Invalid", /\b(invalid|error)\b/i],
    ["Sizes", /\b(size|sizes|sm|md|lg)\b/i],
    ["Density", /\b(density|compact)\b/i],
    ["Icon-only", /\b(icon-only|icon only|unlabeled|accessible ?name)\b/i],
    ["Right-to-left", /\b(rtl|right-to-left|mirror)/i],
    ["Reduced motion", /\b(reduced[- ]?motion|animate|transition|motion)/i],
    ["High contrast and forced colors", /\b(forced[- ]colors|high contrast)\b/i],
  ];

  console.log("\nDefinition-of-done checklist (keyword scan; confirm by reading the spec)");
  for (const [item, pattern] of items) {
    const where = [];
    if (parameters.some((name) => pattern.test(name))) where.push("parameter");
    if (states.some((name) => pattern.test(name))) where.push("state");
    if (Object.keys(contract.configurationAxes ?? {}).some((name) => pattern.test(name))) {
      where.push("axis");
    }
    if (rules.some((text) => pattern.test(text))) where.push("rule");
    if (rationale.some((text) => pattern.test(text))) where.push("rationale");
    row(
      where.length > 0 ? true : "warn",
      item,
      where.length ? where.join(", ") : "not found: add it to the contract or a rationale entry",
    );
  }
}
