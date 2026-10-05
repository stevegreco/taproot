#!/usr/bin/env node
/**
 * Report what a component still needs: the spec, the hand-written runtime,
 * its tests, and the docs pieces. Also scans the spec for the
 * "decide what it ships" items in the create-component skill.
 *
 *   node .agents/skills/create-component/scripts/status.mjs <name>
 *
 * Exits 1 when a required file or entry is missing. Checklist rows are a
 * keyword scan of the spec; confirm each by reading the spec.
 */
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../../../", import.meta.url));
const slug = process.argv[2];
if (!slug || !/^[a-z][a-z0-9-]*$/.test(slug)) {
  console.error("Usage: status.mjs <name>   (for example: checkbox)");
  process.exit(2);
}

const pascal = slug
  .split("-")
  .map((word) => word[0].toUpperCase() + word.slice(1))
  .join("");
const specPath = `packages/spec/content/components/${slug}/${slug}.spec.yaml`;
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
  `packages/components/src/${slug}.d.ts`,
  `packages/components/test/${slug}.test.js`,
  `apps/documentation/implementation/${slug}.md`,
  `apps/documentation/examples/${slug}.tsx`,
  `apps/documentation/examples/${slug}.verify.js`,
  `apps/storybook/stories/${slug}.stories.js`,
];
for (const file of files) row(existsSync(path.join(root, file)), file);

console.log("\nHand-written entries");
const has = (file, pattern) => pattern.test(read(file) ?? "");
row(
  has("packages/components/src/index.js", new RegExp(`\\bdefine${pascal}\\b`)),
  `src/index.js exports and calls define${pascal}`,
);
row(
  has("packages/components/src/index.d.ts", new RegExp(`\\./${slug}\\.js`)),
  "src/index.d.ts re-exports the types and adds the JSX attributes",
);
row(
  has("packages/components/test/host-checks.test.js", new RegExp(`id: "${slug}"`)),
  "test/host-checks.test.js table row",
);
row(
  has("packages/components/test/package-root.test.js", new RegExp(`"ds-${slug}"`)),
  "test/package-root.test.js table row",
);
const exampleSource = read(`apps/documentation/examples/${slug}.tsx`);
if (exampleSource) {
  row(
    exampleSource.includes(`\`${slug}.verify.js\``),
    `examples/${slug}.tsx Verify header names ${slug}.verify.js`,
  );
}
const prose = existsSync(path.join(root, `apps/documentation/docs/components/${slug}.mdx`));
row(prose ? true : "warn", `docs/components/${slug}.mdx preview prose`, prose ? "" : "optional");
const nav = read("apps/documentation/docs/components/meta.ts") ?? "";
row(
  nav.includes(`"${slug}"`) ? true : "warn",
  "docs/components/meta.ts nav order",
  nav.includes(`"${slug}"`) ? "" : "optional; unlisted pages sort last",
);

const specSource = read(specPath);
if (specSource) {
  const requireFromSpec = createRequire(path.join(root, "packages/spec/package.json"));
  const { parse } = requireFromSpec("yaml");
  checklist(parse(specSource));
}

console.log(missing ? `\n${missing} required item(s) missing.` : "\nNo required items missing.");
process.exit(missing ? 1 : 0);

/** Where each "decide what it ships" item is decided, by keyword. */
function checklist(spec) {
  const parameters = Object.keys(spec.parameters ?? {});
  const states = spec.states ?? [];
  const preferences = Object.keys(spec.preferences ?? {});
  const rules = (spec.rules ?? []).map((rule) => `${rule.id} ${rule.statement}`);
  const rationale = (spec.rationale ?? []).map((item) => `${item.decision} ${item.why}`);

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

  console.log("\nDecide-what-it-ships items (keyword scan; confirm by reading the spec)");
  for (const [item, pattern] of items) {
    const where = [];
    if (parameters.some((name) => pattern.test(name))) where.push("parameter");
    if (states.some((name) => pattern.test(name))) where.push("state");
    if (preferences.some((name) => pattern.test(name))) where.push("preference");
    if (rules.some((text) => pattern.test(text))) where.push("rule");
    if (rationale.some((text) => pattern.test(text))) where.push("rationale");
    row(
      where.length > 0 ? true : "warn",
      item,
      where.length ? where.join(", ") : "not found: add it to the spec or a rationale entry",
    );
  }
}
