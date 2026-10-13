#!/usr/bin/env node
/**
 * The definition of done for a component: the spec, the hand-written runtime,
 * its tests, and the docs pieces, plus the "decide what it ships" checklist
 * and which MUST rules have tests. This script is the only complete list;
 * SKILL.md describes the steps.
 *
 *   node .agents/skills/create-component/scripts/status.mjs <name>
 *
 * Exits 1 when a required file or entry is missing, or when a rationale entry
 * names an unknown checklist item. `warn` rows do not fail.
 *
 * Lists that tests derive from the filesystem (content.test.js,
 * package-root.test.js) need no entry and are not checked here.
 */
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * The "decide what it ships" checklist. A spec settles an item with a
 * `rationale` entry whose `covers` names it, or with a parameter, state,
 * preference, rule, or rationale text that matches its keywords.
 */
const CHECKLIST = [
  {
    id: "disabled",
    label: "Disabled",
    question: "Can it be unavailable? Is it focusable, and is the reason shown?",
    keywords: /\bdisabled?\b/i,
  },
  {
    id: "selected",
    label: "Visited, selected, or checked",
    question: "Does it have a persistent on/off or visited state?",
    keywords: /\b(visited|selected|checked|pressed|toggle)\b/i,
  },
  {
    id: "loading",
    label: "Loading",
    question: "Can it wait on work? Does it block activation while it does?",
    keywords: /\b(loading|busy|pending)\b/i,
  },
  {
    id: "invalid",
    label: "Invalid",
    question: "Can its value be wrong? What message says so?",
    keywords: /\b(invalid|error)\b/i,
  },
  {
    id: "sizes",
    label: "Sizes",
    question: "More than one size, or a placement variant?",
    keywords: /\b(size|sizes|sm|md|lg)\b/i,
  },
  {
    id: "density",
    label: "Density",
    question: "Does it change in compact layouts, or does the layout handle that?",
    keywords: /\b(density|compact)\b/i,
  },
  {
    id: "icon-only",
    label: "Icon-only",
    question: "Can it render without text? Where does its accessible name come from?",
    keywords: /\b(icon-only|icon only|unlabeled|accessible ?name)\b/i,
  },
  {
    id: "right-to-left",
    label: "Right-to-left",
    question: "Does anything mirror when the direction is right-to-left?",
    keywords: /\b(rtl|right-to-left|mirror)/i,
  },
  {
    id: "reduced-motion",
    label: "Reduced motion",
    question: "Does it animate? What happens when the user prefers reduced motion?",
    keywords: /\b(reduced[- ]?motion|animate|transition|motion)/i,
  },
  {
    id: "forced-colors",
    label: "High contrast and forced colors",
    question: "Does every state stay visible without color alone?",
    keywords: /\b(forced[- ]colors|high contrast)\b/i,
  },
];

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
const testPath = `packages/components/test/${slug}.test.js`;
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
  testPath,
  `apps/documentation/implementation/${slug}.md`,
  `apps/documentation/examples/${slug}.tsx`,
  `apps/documentation/examples/${slug}.verify.js`,
  `apps/storybook/stories/${slug}.stories.js`,
];
for (const file of files) row(existsSync(path.join(root, file)), file);

console.log("\nHand-written entries");
const has = (file, pattern) => pattern.test(read(file) ?? "");
row(
  has("packages/components/src/index.js", new RegExp(`^define${pascal}\\(\\);$`, "m")),
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
const exampleSource = read(`apps/documentation/examples/${slug}.tsx`);
if (exampleSource) {
  row(
    exampleSource.includes(`\`${slug}.verify.js\``),
    `examples/${slug}.tsx Verify header names ${slug}.verify.js`,
  );
}
const prose = existsSync(path.join(root, `apps/documentation/docs/components/${slug}.mdx`));
row(prose ? true : "warn", `docs/components/${slug}.mdx preview prose`, prose ? "" : "optional");

const specSource = read(specPath);
if (specSource) {
  const requireFromSpec = createRequire(path.join(root, "packages/spec/package.json"));
  const { parse } = requireFromSpec("yaml");
  const spec = parse(specSource);
  checklist(spec);
  ruleCoverage(spec, read(testPath) ?? "");
} else {
  console.log("\nDecide-what-it-ships items (no spec yet)");
  for (const item of CHECKLIST) console.log(`  todo  ${item.label}: ${item.question}`);
}

console.log(missing ? `\n${missing} required item(s) missing.` : "\nNo required items missing.");
process.exit(missing ? 1 : 0);

/** Where each checklist item is decided: a `covers` marker first, then a keyword scan. */
function checklist(spec) {
  const rationale = spec.rationale ?? [];
  const known = new Set(CHECKLIST.map((item) => item.id));
  const unknown = rationale.flatMap((entry) => (entry.covers ?? []).filter((id) => !known.has(id)));

  const parameters = Object.keys(spec.parameters ?? {});
  const states = spec.states ?? [];
  const preferences = Object.keys(spec.preferences ?? {});
  const rules = (spec.rules ?? []).map((rule) => `${rule.id} ${rule.statement}`);
  const rationaleText = rationale.map((entry) => `${entry.decision} ${entry.why}`);

  console.log("\nDecide-what-it-ships items (covers marker, else keyword scan)");
  for (const item of CHECKLIST) {
    const marked = rationale.find((entry) => entry.covers?.includes(item.id));
    if (marked) {
      row(true, item.label, `rationale: ${marked.decision}`);
      continue;
    }
    const where = [];
    const { keywords } = item;
    if (parameters.some((name) => keywords.test(name))) where.push("parameter");
    if (states.some((name) => keywords.test(name))) where.push("state");
    if (preferences.some((name) => keywords.test(name))) where.push("preference");
    if (rules.some((text) => keywords.test(text))) where.push("rule");
    if (rationaleText.some((text) => keywords.test(text))) where.push("rationale");
    row(
      where.length > 0 ? true : "warn",
      item.label,
      where.length
        ? `keyword: ${where.join(", ")}`
        : `${item.question} Decide it, or add a rationale entry with covers: [${item.id}]`,
    );
  }
  for (const id of unknown) {
    row(false, `rationale covers unknown item "${id}"`, `use one of: ${[...known].join(", ")}`);
  }
}

/**
 * MUST rules with no test named `[<rule-id>] …` in the component's test file.
 * Content rules say what authors write, which a component test can't check.
 */
function ruleCoverage(spec, testSource) {
  const tagged = new Set();
  for (const [, tags] of testSource.matchAll(/["'`]((?:\[[a-z0-9-]+\])+) /g)) {
    for (const [, id] of tags.matchAll(/\[([a-z0-9-]+)\]/g)) tagged.add(id);
  }
  const must = (spec.rules ?? []).filter(
    (rule) => rule.level === "must" && rule.topic !== "content",
  );
  const untested = must.filter((rule) => !tagged.has(rule.id));

  console.log(`\nMUST rules (except content) with a test tagged [rule-id] in ${testPath}`);
  if (untested.length === 0) {
    row(true, `all ${must.length} MUST rule(s)`);
    return;
  }
  row(true, `${must.length - untested.length} of ${must.length} MUST rule(s)`);
  for (const rule of untested) row("warn", `[${rule.id}] has no test`, rule.statement.trim());
}
