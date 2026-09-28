import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "vitest";
import { fileURLToPath } from "node:url";
import { openCatalog } from "@stevegreco/design-system-knowledge/retrieve";
import {
  componentKnowledgeMarkdown,
  componentSlugs,
  DocsKnowledgeError,
  loadComponentSlice,
  projectTogether,
  variantGuidance,
} from "../lib/component-knowledge";
import { componentPageEntries } from "../lib/component-pages";

const docsRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const pages = new Map(componentPageEntries().map((entry) => [entry.slug, entry.raw ?? ""]));

/** The generated MDX source of `/components/<slug>`, front matter included. */
function pageSource(slug: string): string {
  const source = pages.get(slug);
  assert.ok(source, `component.${slug} has a generated page`);
  return source;
}

test("button slice variants and api come from the public catalog contract", () => {
  const slice = loadComponentSlice("button");

  assert.deepEqual(
    slice.variants.map((variant) => variant.name),
    ["primary", "secondary", "ghost", "danger"],
    "variant names are the contract enum keys, including ghost",
  );
  assert.equal(
    slice.variants.filter((variant) => variant.isDefault).length,
    1,
    "exactly one variant is the contract default",
  );
  assert.match(
    slice.introMarkdown,
    /Use Link instead/,
    "intro uses usage guidance from the compiled contract",
  );
  assert.match(
    slice.introMarkdown,
    /### When to avoid\n\n- /,
    "avoid items keep negation framing as a heading plus list the docs renderer can parse",
  );
  assert.doesNotMatch(
    slice.introMarkdown,
    /Triggers an action or submits or resets a form\.\n\nNavigate to another location/,
    "avoid items are not bare intro paragraphs",
  );
  assert.match(slice.behaviorMarkdown, /Write the label/, "label guidance sits with usage");
  assert.match(slice.behaviorMarkdown, /type="submit"/, "form behavior stays with usage");
  assert.match(
    slice.behaviorMarkdown,
    /action hierarchy pattern\]\(#using-together\)/,
    "content rule references rewrite to in-page pattern anchors",
  );
  assert.ok(
    slice.api.some((row) => row.name === "aria-label"),
    "api includes the aria-label attribute from the contract",
  );
  assert.ok(
    slice.api.some((row) => row.name === "form" && row.kind === "property"),
    "api includes the form property from the contract",
  );
  assert.ok(
    slice.api.some((row) => row.name === "click" && row.kind === "event"),
    "api includes the click event from the contract",
  );
  const variant = slice.api.find((row) => row.name === "variant");
  assert.ok(variant);
  assert.deepEqual(
    variant.values.map((value) => value.name),
    ["primary", "secondary", "ghost", "danger"],
  );
  assert.equal(variant.description, "", "enum members keep value text off the row description");
  assert.equal(slice.accessibility.keyboard.length, 3, "keyboard bindings come from the contract");
  assert.ok(slice.together, "related pattern and example project into using-together");
  assert.ok(
    slice.together?.example?.src.startsWith("/knowledge-assets/"),
    "example image is a docs URL, not a bundlePath",
  );
  assert.ok(
    slice.together && slice.together.patterns[0].avoid.length > 0,
    "pattern Avoid items stay with using-together",
  );
  assert.equal(slice.review?.checks.length, 8, "review uses guideline checks, not body prose");
});

test("button knowledge markdown keeps ghost and aria-label without reprinting the pattern", () => {
  const markdown = componentKnowledgeMarkdown("button");

  assert.match(markdown, /ghost/, "markdown lists the ghost variant");
  assert.match(markdown, /aria-label/, "markdown lists the aria-label attribute");
  assert.match(markdown, /\/knowledge-assets\//, "example image is a docs URL");
  assert.doesNotMatch(
    markdown,
    /assets\/example\.action-hierarchy\.settings/,
    "markdown must not leak bundle-relative asset paths",
  );
  assert.match(
    markdown,
    /Do not use it for the\s+main path through a task/,
    "ghost guidance appears in the variants section",
  );
  assert.doesNotMatch(
    markdown,
    /Define the action group/,
    "full pattern body does not belong on the page",
  );
  assert.doesNotMatch(
    markdown,
    /Highest-emphasis action\. Supporting action\. Low-emphasis action/,
    "enum descriptions are keyed, not concatenated",
  );
  assert.doesNotMatch(markdown, /^error /m, "review markdown does not lead with severity codes");
});

test("badge variant examples use the host tag and status labels", () => {
  const slice = loadComponentSlice("badge");
  const danger = slice.variants.find((variant) => variant.name === "danger");

  assert.equal(slice.tagName, "ds-badge");
  assert.ok(danger, "contract includes danger");
  assert.equal(danger.exampleLabel, "Failed");
  assert.equal(danger.exampleHtml, '<ds-badge variant="danger">Failed</ds-badge>');
  assert.doesNotMatch(
    danger.exampleHtml,
    /Delete project/,
    "Badge danger is not a Button delete action",
  );
});

test("the badge page renders variants, api, and accessibility from the catalog", async () => {
  const publicRoot = dirname(
    fileURLToPath(import.meta.resolve("@stevegreco/design-system-knowledge/manifest")),
  );
  const catalog = await openCatalog(publicRoot, { expectVisibility: "public" });
  const record = catalog.get("component.badge");
  const variantValues = record.contract.parameters.variant.values;
  const slice = loadComponentSlice("badge");
  const danger = slice.variants.find((variant) => variant.name === "danger");
  const markdown = componentKnowledgeMarkdown("badge");
  const source = pageSource("badge");
  const banner = source.match(/^---\n([\s\S]*?)\n---/);

  assert.ok(danger, "contract includes danger");
  assert.deepEqual(
    Object.fromEntries(slice.variants.map((variant) => [variant.name, variant.description])),
    variantValues,
    "variant copy tracks the compiled contract",
  );
  assert.deepEqual(
    slice.accessibility.requirements,
    record.contract.accessibility.requirements.map((item) => item.statement),
    "accessibility tracks the compiled contract",
  );
  assert.equal(
    danger.description,
    "Failed or blocked status, not a destructive action.",
    "danger meaning comes from the component contract",
  );
  assert.match(markdown, /not a destructive action/);
  assert.ok(
    slice.api.some((row) => row.name === "variant"),
    "api includes the variant attribute from the contract",
  );
  assert.equal(
    slice.api.some((row) => row.name === "hidden"),
    false,
    "Badge does not publish hidden; native hiding is a host attribute, not a contract parameter",
  );
  assert.equal(slice.accessibility.keyboard.length, 0, "Badge has no keyboard bindings");
  assert.ok(
    slice.accessibility.requirements.some((item) => /live-region/.test(item)),
    "accessibility keeps the live-region rule from the contract",
  );

  assert.ok(banner, "the badge page has YAML frontmatter");
  const title = banner[1].match(/^title:\s*(.+)$/m)?.[1]?.trim();
  const description = banner[1].match(/^description:\s*(.+)$/m)?.[1]?.trim();
  assert.equal(title, slice.title, "frontmatter title matches the record title");
  assert.equal(description, slice.summary, "frontmatter description matches the record summary");
  assert.match(source, /component="badge"\s+section="intro"/);
  assert.match(source, /section="variants"/);
  assert.match(source, /section="api"/);
  assert.match(source, /section="accessibility"/);
  assert.doesNotMatch(
    source,
    /destructive states/,
    "the page must not recommend Badge danger for destructive actions",
  );
  assert.doesNotMatch(
    source,
    /<TypeTable/,
    "API facts come from ComponentKnowledge, not a copied table",
  );
});

test("text field slice has no variant axis and publishes label, hint, and error", () => {
  const slice = loadComponentSlice("text-field");
  const source = pageSource("text-field");
  const banner = source.match(/^---\n([\s\S]*?)\n---/);

  assert.equal(slice.tagName, "ds-text-field");
  assert.deepEqual(slice.variants, []);
  assert.ok(
    slice.api.some((row) => row.name === "label"),
    "api includes the label attribute",
  );
  assert.ok(
    slice.api.some((row) => row.name === "error"),
    "api includes the error attribute",
  );
  assert.ok(
    slice.api.some((row) => row.name === "input" && row.kind === "event"),
    "api includes the input event",
  );
  assert.ok(
    slice.accessibility.requirements.some((item) =>
      /aria|accessible description|describe/i.test(item),
    ),
    "accessibility keeps the description rule",
  );
  assert.match(slice.behaviorMarkdown, /type="email"/, "form behavior stays with usage");
  assert.ok(banner, "the text-field page has YAML frontmatter");
  const title = banner[1].match(/^title:\s*(.+)$/m)?.[1]?.trim();
  const description = banner[1].match(/^description:\s*(.+)$/m)?.[1]?.trim();
  assert.equal(title, slice.title);
  assert.equal(description, slice.summary);
  assert.doesNotMatch(source, /section="variants"/);
});

test("link slice ties placement variants and Button to the action hierarchy", () => {
  const slice = loadComponentSlice("link");
  const source = pageSource("link");
  const banner = source.match(/^---\n([\s\S]*?)\n---/);

  assert.equal(slice.tagName, "ds-link");
  assert.deepEqual(
    slice.variants.map((variant) => variant.name),
    ["inline", "standalone"],
  );
  assert.match(
    slice.variants.find((variant) => variant.name === "inline")?.guidance ?? "",
    /inside a sentence/,
    "inline guidance comes from the action hierarchy pattern",
  );
  assert.deepEqual(
    slice.together?.patterns.map((pattern) => pattern.title),
    ["Action hierarchy"],
  );
  assert.match(slice.introMarkdown, /Use Button instead\./, "Button is the stated alternative");
  assert.match(
    slice.behaviorMarkdown,
    /\[action hierarchy pattern\]\(#using-together\)/,
    "the content rule points at the action hierarchy on this page",
  );
  assert.ok(
    slice.api.some((row) => row.name === "href"),
    "api includes href",
  );
  assert.equal(
    slice.api.some((row) => row.name === "disabled"),
    false,
    "Link has no disabled state",
  );
  assert.ok(banner, "the link page has YAML frontmatter");
  const title = banner[1].match(/^title:\s*(.+)$/m)?.[1]?.trim();
  const description = banner[1].match(/^description:\s*(.+)$/m)?.[1]?.trim();
  assert.equal(title, slice.title);
  assert.equal(description, slice.summary);
});

test("loadComponentSlice rejects dotted ids and unknown slugs", () => {
  assert.throws(
    () => loadComponentSlice("component.button"),
    DocsKnowledgeError,
    "component.button is a record id, not a page slug",
  );
  assert.equal(
    loadComponentSlice("badge").title,
    "Badge",
    "public component.badge is available to docs",
  );
  assert.throws(
    () => loadComponentSlice("dialog"),
    DocsKnowledgeError,
    "missing public component records fail the docs build",
  );
  assert.throws(
    () => componentKnowledgeMarkdown("button", "hierarchy"),
    DocsKnowledgeError,
    "unknown page sections fail instead of dumping related records",
  );
});

test("component record bodies keep bundle-root destinations for docs rewriting", async () => {
  const publicRoot = dirname(
    fileURLToPath(import.meta.resolve("@stevegreco/design-system-knowledge/manifest")),
  );
  const catalog = await openCatalog(publicRoot, { expectVisibility: "public" });
  const body = catalog.get("component.button").body;
  assert.match(body, /\]\(markdown\/pattern\.action-hierarchy\.md#assign-emphasis\)/);
  assert.match(
    body.replace(/\]\(markdown\/([^)]+?)\.md(?:#[^)]*)?\)/g, (_match, id) => {
      const type = id.slice(0, id.indexOf("."));
      return type === "pattern" ? "](#using-together)" : `](#${id})`;
    }),
    /action hierarchy pattern\]\(#using-together\)/,
  );
});

test("the button page frontmatter matches the slice title and summary", () => {
  const slice = loadComponentSlice("button");
  const source = pageSource("button");
  const banner = source.match(/^---\n([\s\S]*?)\n---/);
  assert.ok(banner, "the button page has YAML frontmatter");
  const title = banner[1].match(/^title:\s*(.+)$/m)?.[1]?.trim();
  const description = banner[1].match(/^description:\s*(.+)$/m)?.[1]?.trim();
  assert.equal(title, slice.title, "frontmatter title matches the record title");
  assert.equal(description, slice.summary, "frontmatter description matches the record summary");
  assert.match(source, /^## Variants$/m);
  assert.match(source, /^## Using together$/m);
  assert.match(source, /^## API$/m);
  assert.match(source, /^## Accessibility$/m);
  assert.match(source, /section="review"/, "review stays available without a TOC heading");
});

test("every component record has a page, and every prose file has a record", () => {
  const prose = readdirSync(join(docsRoot, "docs/components"))
    .filter((file) => file.endsWith(".mdx"))
    .map((file) => file.slice(0, -".mdx".length));
  const records = [...componentSlugs()].sort();

  assert.deepEqual([...pages.keys()].sort(), records);
  for (const slug of prose) {
    assert.ok(
      records.includes(slug),
      `docs/components/${slug}.mdx has no component.${slug} record`,
    );
  }
});

test("a page imports, registers, and shows usage from the binding", () => {
  const source = pageSource("checkbox");

  assert.match(source, /pnpm add @stevegreco\/design-system @stevegreco\/design-system-components/);
  assert.match(
    source,
    /import \{ defineCheckbox \} from "@stevegreco\/design-system-components\/checkbox";\n\ndefineCheckbox\(\);/,
  );
  assert.match(
    source,
    /lang="html"\n  code=\{`<form>\n  <ds-checkbox label="Email me product updates"/,
  );
  assert.match(source, /<Component path="checkbox" \/>/);
  assert.match(source, /The parent checkbox shows indeterminate/, "prose from checkbox.mdx");
  assert.doesNotMatch(source, /^## Variants$/m, "no heading for a section without content");
});

const scratchPattern = {
  id: "pattern.scratch",
  title: "Scratch",
  summary: "Scratch summary.",
  relations: { guides: ["component.scratch"] },
  body: "## Assign emphasis\n\n### Primary\n\nScratch primary guidance.\n\n## Avoid\n\n- Scratch item",
};

test("variant guidance is opt-in, not inferred from pattern headings", () => {
  assert.equal(
    variantGuidance("component.scratch", [scratchPattern]).size,
    0,
    "a ### Primary heading alone guides nothing",
  );

  const optedIn = {
    ...scratchPattern,
    variantGuidance: { "component.scratch": { primary: "primary" } },
  };
  assert.equal(
    variantGuidance("component.scratch", [optedIn]).get("primary"),
    "Scratch primary guidance.",
  );
  assert.equal(
    variantGuidance("component.other", [optedIn]).size,
    0,
    "another component with the same variant name gets nothing",
  );
});

test("using-together keeps every related pattern", () => {
  const together = projectTogether(
    [scratchPattern, { ...scratchPattern, id: "pattern.second", title: "Second" }],
    undefined,
  );
  assert.deepEqual(
    together?.patterns.map((pattern) => [pattern.id, pattern.avoid]),
    [
      ["pattern.scratch", ["Scratch item"]],
      ["pattern.second", ["Scratch item"]],
    ],
  );
});
