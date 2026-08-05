#!/usr/bin/env node
/**
 * RED-phase contract tests for the Blume-native Design Tokens documentation.
 *
 * Source checks run immediately. Build checks become fully meaningful after:
 *   pnpm build && pnpm verify:tokens
 */

import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DOCS = resolve(ROOT, "docs");
const DIST = resolve(ROOT, process.env.BLUME_DIST ?? "dist");
const TOKENS_ROOT = resolve(ROOT, "../../packages/tokens");

const primitivePages = [
  "overview",
  "color",
  "typography",
  "spacing",
  "shape",
  "motion",
  "layout",
];
const categoryPages = primitivePages.filter((page) => page !== "overview");
const primitiveBase = "design-tokens/primitives";
const routeBase = "/design-tokens/primitives";

let passed = 0;
let failed = 0;
const failures = [];

function pass(label) {
  passed++;
  console.log(`  \x1b[32m✓\x1b[0m ${label}`);
}

function fail(label, detail = "") {
  failed++;
  failures.push({ label, detail });
  console.log(`  \x1b[31m✗\x1b[0m ${label}`);
  if (detail) console.log(`      ${detail}`);
}

function check(condition, label, detail = "") {
  condition ? pass(label) : fail(label, detail);
}

function section(title) {
  console.log(`\n\x1b[1m${title}\x1b[0m`);
}

function docsExists(path) {
  return existsSync(resolve(DOCS, path));
}

function distExists(path) {
  return existsSync(resolve(DIST, path));
}

function readDocs(path) {
  return readFileSync(resolve(DOCS, path), "utf8");
}

function readDist(path) {
  const absolutePath = resolve(DIST, path);
  return existsSync(absolutePath) ? readFileSync(absolutePath, "utf8") : null;
}

function pageFile(page) {
  for (const extension of ["mdx", "md"]) {
    const path = `${primitiveBase}/${page}.${extension}`;
    if (docsExists(path)) return path;
  }
  return null;
}

function quotedArray(source, property) {
  const match = source.match(new RegExp(`${property}\\s*:\\s*\\[([\\s\\S]*?)\\]`));
  return match ? [...match[1].matchAll(/["']([^"']+)["']/g)].map((item) => item[1]) : [];
}

function hasFrontmatterField(source, field) {
  return new RegExp(`^---[\\s\\S]*?^${field}:`, "m").test(source);
}

function hasMarkdownTable(source) {
  return /^\s*\|.+\|\s*$[\r\n]+^\s*\|(?:\s*:?-{3,}:?\s*\|)+\s*$/m.test(source);
}

function assertNoCustomRuntime(source, label) {
  check(
    !/^\s*import\s/m.test(source),
    `${label} has no imports`,
    "Keep the page as direct Markdown/MDX; Blume content components need no imports."
  );
  check(
    !/\bclient:(?:load|idle|visible|media|only)\b/.test(source),
    `${label} has no client island directives`,
    "Do not add custom islands or client hydration directives."
  );
}

function cssVariableFor(path) {
  const kebab = (segment) =>
    segment.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
  return `--${path.split(".").map(kebab).join("-")}`;
}

const primitivesPath = resolve(TOKENS_ROOT, "dist/tokens/primitives.json");
let primitiveData = null;
let primitiveTokens = [];

try {
  primitiveData = JSON.parse(readFileSync(primitivesPath, "utf8"));
  const { flatten } = await import(resolve(TOKENS_ROOT, "src/flatten.js"));
  primitiveTokens = flatten(primitiveData);
} catch (error) {
  fail("Primitive token data loads", error.message);
}

const tokensByCategory = new Map();
for (const token of primitiveTokens) {
  const category = token.path.split(".")[1];
  const entries = tokensByCategory.get(category) ?? [];
  entries.push(token);
  tokensByCategory.set(category, entries);
}

// ─── 1. Filesystem-derived navigation ───────────────────────────────────────

section("1  Blume source structure");

check(
  docsExists("design-tokens/meta.ts"),
  "docs/design-tokens/meta.ts exists",
  'Create it with title "Design Tokens" and pages ["primitives"].'
);
check(
  docsExists(`${primitiveBase}/meta.ts`),
  `docs/${primitiveBase}/meta.ts exists`,
  `Create it with title "Primitive Tokens" and pages ${JSON.stringify(primitivePages)}.`
);

for (const page of primitivePages) {
  const file = pageFile(page);
  check(
    Boolean(file),
    `Primitive page "${page}" exists as Markdown/MDX`,
    `Create docs/${primitiveBase}/${page}.${page === "color" ? "mdx" : "mdx (or .md)"}.`
  );
}

check(
  docsExists(`${primitiveBase}/color.mdx`),
  `docs/${primitiveBase}/color.mdx exists specifically as MDX`,
  "The Color component page must use .mdx."
);
check(
  !docsExists("foundations"),
  "docs/foundations section is removed",
  "Delete docs/foundations/ so Blume no longer emits its navigation or routes."
);
check(
  !docsExists("tokens"),
  "no obsolete docs/tokens section exists",
  "Do not implement the superseded docs/tokens architecture."
);

// ─── 2. Navigation metadata ─────────────────────────────────────────────────

section("2  Navigation metadata");

if (docsExists("design-tokens/meta.ts")) {
  const source = readDocs("design-tokens/meta.ts");
  check(
    /title\s*:\s*["']Design Tokens["']/.test(source),
    'design-tokens/meta.ts title is "Design Tokens"'
  );
  check(
    JSON.stringify(quotedArray(source, "pages")) === JSON.stringify(["overview", "primitives"]),
    'design-tokens/meta.ts pages are exactly ["overview", "primitives"]',
    "Keep the conceptual overview before the primitive reference."
  );
}

if (docsExists(`${primitiveBase}/meta.ts`)) {
  const source = readDocs(`${primitiveBase}/meta.ts`);
  check(
    /title\s*:\s*["']Primitive Tokens["']/.test(source),
    'primitives/meta.ts title is "Primitive Tokens"'
  );
  check(
    JSON.stringify(quotedArray(source, "pages")) === JSON.stringify(primitivePages),
    `primitives/meta.ts pages are exactly ${JSON.stringify(primitivePages)}`,
    "Preserve the requested page set and ordering."
  );
}

// ─── 3. Shared content-page contracts ───────────────────────────────────────

section("3  Shared Markdown/MDX contracts");

for (const page of primitivePages) {
  const file = pageFile(page);
  if (!file) continue;
  const source = readDocs(file);
  const label = `docs/${file}`;

  check(
    hasFrontmatterField(source, "title"),
    `${label} has title frontmatter`
  );
  check(
    hasFrontmatterField(source, "description"),
    `${label} has description frontmatter`
  );
  assertNoCustomRuntime(source, label);
}

// ─── 4. Color reference contract ────────────────────────────────────────────

section("4  Primitive color reference");

const colorFile = docsExists(`${primitiveBase}/color.mdx`)
  ? `${primitiveBase}/color.mdx`
  : null;
const colorTokens = tokensByCategory.get("color") ?? [];

if (colorFile) {
  const source = readDocs(colorFile);

  check(
    /<Color\s+variant=["']table["']\s*>/.test(source),
    'color.mdx uses <Color variant="table"> directly',
    "Use Blume's table layout, not compact mode or a custom component."
  );
  check(
    /<Color\.Row(?:\s|>)/.test(source),
    "color.mdx uses <Color.Row>",
    "Group primitive scales with direct Color.Row children."
  );
  check(
    /<Color\.Item(?:\s|>)/.test(source),
    "color.mdx uses <Color.Item>",
    "Render every primitive color through direct Color.Item entries."
  );

  for (const scale of [
    "white",
    "black",
    "robRoy",
    "blueSmoke",
    "clay",
    "amber",
    "moss",
    "rust",
    "sky",
    "surface",
  ]) {
    check(
      new RegExp(scale.replace(/([a-z])([A-Z])/g, "$1.?$2"), "i").test(source),
      `color.mdx covers "${scale}" primitive colors`
    );
  }

  const missingColorVariables = colorTokens
    .map((token) => token.cssVariable ?? cssVariableFor(token.path))
    .filter(
      (variable) =>
        !new RegExp(
          `<Color\\.Item[^>]*\\bname=["']${variable.replaceAll("-", "\\-")}["']`,
          "s"
        ).test(source)
    );
  check(
    missingColorVariables.length === 0,
    `color.mdx uses all ${colorTokens.length} CSS variables as Color.Item names`,
    missingColorVariables.length
      ? `Missing: ${missingColorVariables.join(", ")}`
      : ""
  );

  const missingColorValues = [...new Set(colorTokens.map((token) => token.value))]
    .filter((value) => !source.toLowerCase().includes(value.toLowerCase()));
  check(
    missingColorValues.length === 0,
    "color.mdx passes all primitive color values to Color.Item",
    missingColorValues.length ? `Missing values: ${missingColorValues.join(", ")}` : ""
  );

  const itemCount = (source.match(/<Color\.Item(?:\s|>)/g) ?? []).length;
  check(
    itemCount >= colorTokens.length,
    `color.mdx has at least ${colorTokens.length} Color.Item entries`,
    `Found ${itemCount}; every primitive color needs a Blume swatch.`
  );
}

check(colorTokens.length > 0, "Primitive color source contains color tokens");

// ─── 5. Native reference-table contracts ────────────────────────────────────

section("5  Native Markdown reference tables");

const categoryContract = {
  typography: ["font", "text", "weight", "leading", "tracking"],
  spacing: ["space"],
  shape: ["radius", "shadow", "shadowInk", "border"],
  motion: ["ease", "duration"],
  layout: ["layout"],
};

for (const [page, categories] of Object.entries(categoryContract)) {
  const file = pageFile(page);
  if (!file) continue;
  const source = readDocs(file);

  check(
    hasMarkdownTable(source),
    `${page} uses a native Markdown table`,
    "Add a pipe table with a header separator; do not use a custom table component."
  );
  check(
    !/<[A-Z][A-Za-z0-9.]*(?:\s|>)/.test(source),
    `${page} contains no JSX components`,
    "Keep non-color references as direct Markdown/MDX with native tables."
  );

  for (const category of categories) {
    const expected = tokensByCategory.get(category) ?? [];
    const missing = expected
      .map((token) => token.cssVariable ?? cssVariableFor(token.path))
      .filter((variable) => !source.includes(variable));
    const missingValues = [...new Set(expected.map((token) => token.value))]
      .filter((value) => !source.includes(value));

    check(
      expected.length > 0,
      `Token source contains "${category}" primitives`
    );
    check(
      missing.length === 0,
      `${page} documents all ${expected.length} "${category}" CSS variables`,
      missing.length ? `Missing: ${missing.join(", ")}` : ""
    );
    check(
      missingValues.length === 0,
      `${page} documents all "${category}" token values`,
      missingValues.length ? `Missing values: ${missingValues.join(", ")}` : ""
    );
  }
}

// ─── 6. Overview and cross-links ────────────────────────────────────────────

section("6  Overview and stale-link replacement");

const overviewFile = pageFile("overview");
if (overviewFile) {
  const source = readDocs(overviewFile);
  check(
    /\bprimitive(?:s|\s+tokens?)?\b/i.test(source),
    "overview explains primitive tokens"
  );
  for (const page of categoryPages) {
    check(
      source.includes(`${routeBase}/${page}`),
      `overview links to ${routeBase}/${page}`
    );
  }
}

for (const path of ["index.mdx", "getting-started/installation.mdx"]) {
  if (!docsExists(path)) continue;
  const source = readDocs(path);
  const expectedRoute =
    path === "index.mdx" ? `${routeBase}/overview` : `${routeBase}/color`;
  check(
    source.includes(expectedRoute),
    `docs/${path} links to ${expectedRoute}`,
    `Replace /foundations/colors with ${expectedRoute}.`
  );
  check(
    !source.includes("/foundations/colors"),
    `docs/${path} has no stale /foundations/colors link`
  );
  check(
    !source.includes("/tokens/color"),
    `docs/${path} has no obsolete /tokens/color link`
  );
}

// ─── 7. Built routes and rendered content ───────────────────────────────────

section("7  Built routes and rendered content");

for (const page of primitivePages) {
  const distPath = `design-tokens/primitives/${page}/index.html`;
  check(
    distExists(distPath),
    `route ${routeBase}/${page} is built`,
    `Run pnpm build after creating docs/${primitiveBase}/${page}.mdx (or .md).`
  );
}

check(
  !distExists("foundations/colors/index.html"),
  "old /foundations/colors route is absent"
);
check(
  !distExists("tokens/color/index.html"),
  "obsolete /tokens/color route is absent"
);

const colorHtml = readDist("design-tokens/primitives/color/index.html");
if (colorHtml) {
  check(
    /data-blume-color=["']table["']/.test(colorHtml),
    "rendered color page uses Blume table variant"
  );
  check(
    /data-blume-color-swatch/.test(colorHtml),
    "rendered color page contains Blume swatches"
  );
  check(
    /data-blume-color-copy/.test(colorHtml),
    "rendered color values are copyable"
  );
  for (const token of colorTokens) {
    const variable = token.cssVariable ?? cssVariableFor(token.path);
    check(
      colorHtml.includes(variable),
      `rendered color page exposes ${variable}`
    );
  }
}

// ─── 8. Blume search index ──────────────────────────────────────────────────

section("8  Blume search index");

const searchRaw = readDist("blume-search.json");
if (searchRaw) {
  try {
    const searchIndex = JSON.parse(searchRaw);
    const routes = Array.isArray(searchIndex)
      ? searchIndex.map((entry) => entry.route)
      : [];

    pass("blume-search.json parses as valid JSON");
    for (const page of primitivePages) {
      check(
        routes.includes(`${routeBase}/${page}`),
        `search index contains ${routeBase}/${page}`
      );
    }
    check(
      !routes.includes("/foundations/colors"),
      "search index omits stale /foundations/colors"
    );
    check(
      !routes.includes("/tokens/color"),
      "search index omits obsolete /tokens/color"
    );
  } catch (error) {
    fail("blume-search.json parses as valid JSON", error.message);
  }
} else {
  console.log("  (skipped — dist/blume-search.json not present)");
}

console.log(`\n${"─".repeat(60)}`);
console.log(`\x1b[1mResults: ${passed} passed, ${failed} failed\x1b[0m`);

if (failures.length > 0) {
  console.log("\nFailed checks:");
  failures.forEach(({ label, detail }, index) => {
    console.log(`  ${index + 1}. ${label}`);
    if (detail) console.log(`     → ${detail}`);
  });
  console.log("\nThese failures are the RED-phase production implementation contract.");
  process.exit(1);
}

console.log("\n\x1b[32mAll Design Tokens documentation contracts pass.\x1b[0m");
