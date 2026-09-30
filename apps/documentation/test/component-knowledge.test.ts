import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "vitest";
import { fileURLToPath } from "node:url";
import { loadKnowledge } from "@stevegreco/design-system-knowledge";
import {
  assembleSlices,
  componentKnowledgeMarkdown,
  componentSlugs,
  DocsKnowledgeError,
  loadComponentSlice,
} from "../lib/component-knowledge";
import {
  ImplementationError,
  loadImplementations,
  parseImplementation,
} from "../lib/implementation";
import { componentPageEntries } from "../lib/component-pages";

const docsRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const pages = new Map(componentPageEntries().map((entry) => [entry.slug, entry.raw ?? ""]));

/** The generated MDX source of `/components/<slug>`, front matter included. */
function pageSource(slug: string): string {
  const source = pages.get(slug);
  assert.ok(source, `component.${slug} has a generated page`);
  return source;
}

test("button slice variants and api come from the knowledge record and the implementation file", () => {
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
    slice.variants.find((variant) => variant.name === "danger")?.guidance ?? "",
    /^Use `danger` only for a destructive or difficult-to-reverse action\./,
    "variant guidance is the pattern section the spec names in parameters.variant.guidance",
  );
  assert.match(
    slice.introMarkdown,
    /Use \[Link\]\(\/components\/link\) instead\. Links provide native navigation semantics\./,
    "intro links the alternative component's page and keeps the reason",
  );
  assert.match(
    slice.introMarkdown,
    /### When to use\n\n- Trigger an action in the current view\./,
    "intro lists the situations the component is for",
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
  assert.match(slice.behaviorMarkdown, /### Write the content/, "content guidance sits with usage");
  assert.match(slice.behaviorMarkdown, /### Forms/, "the implementation guide's Forms section");
  assert.match(slice.behaviorMarkdown, /type="submit"/, "form behavior stays with usage");
  assert.doesNotMatch(
    slice.behaviorMarkdown,
    /### Register and render/,
    "installation comes from the page's Import section, not the guide",
  );
  assert.match(
    slice.behaviorMarkdown,
    /action hierarchy pattern\]\(#using-together\)/,
    "content rule references rewrite to in-page pattern anchors",
  );
  assert.ok(
    slice.api.some((row) => row.name === "aria-label"),
    "api includes the aria-label attribute from the implementation",
  );
  assert.ok(
    slice.api.some((row) => row.name === "form" && row.kind === "property"),
    "api includes the form property from the contract",
  );
  assert.ok(
    slice.api.some((row) => row.name === "click" && row.kind === "event"),
    "api includes the click event from the contract",
  );
  const type = slice.api.find((row) => row.name === "type");
  assert.ok(type);
  assert.deepEqual(
    type.values.map((value) => value.name),
    ["button", "submit", "reset"],
    "the type attribute renames the spec's action values",
  );
  assert.equal(type.defaultDisplay, "button", "the default is renamed with the values");
  assert.equal(type.typeDisplay, '"button" | "submit" | "reset"');
  const variant = slice.api.find((row) => row.name === "variant");
  assert.ok(variant);
  assert.deepEqual(
    variant.values.map((value) => value.name),
    ["primary", "secondary", "ghost", "danger"],
  );
  assert.equal(variant.description, "", "enum members keep value text off the row description");
  assert.equal(slice.accessibility.keyboard.length, 3, "keyboard bindings come from the record");
  assert.ok(slice.together, "related pattern and example project into using-together");
  assert.equal(
    slice.together?.example?.src,
    "/knowledge-assets/example.action-hierarchy.settings/action-hierarchy-settings.svg",
    "example image is a docs URL under the example id",
  );
  assert.ok(
    existsSync(
      join(
        docsRoot,
        "public/knowledge-assets/example.action-hierarchy.settings/action-hierarchy-settings.svg",
      ),
    ),
    "the example image is copied into public",
  );
  assert.ok(
    slice.together && slice.together.patterns[0].avoid.length > 0,
    "pattern Avoid items stay with using-together",
  );
  assert.equal(slice.review?.checks.length, 10, "the review checklist lists every rule");
  assert.deepEqual(
    slice.review?.checks.slice(0, 2).map((check) => [check.id, check.level]),
    [
      ["label-describes-result", "must"],
      ["danger-for-destructive", "must"],
    ],
  );
});

test("button knowledge markdown keeps ghost and aria-label without reprinting the pattern", () => {
  const markdown = componentKnowledgeMarkdown("button");

  assert.match(markdown, /ghost/, "markdown lists the ghost variant");
  assert.match(markdown, /aria-label/, "markdown lists the aria-label attribute");
  assert.match(markdown, /\/knowledge-assets\//, "example image is a docs URL");
  assert.doesNotMatch(
    markdown,
    /\]\(assets\//,
    "markdown must not leak record-relative asset paths",
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
  assert.doesNotMatch(markdown, /^must /m, "review markdown does not lead with severity codes");
});

test("badge variant examples use the implementation tag and status labels", () => {
  const slice = loadComponentSlice("badge");
  const danger = slice.variants.find((variant) => variant.name === "danger");

  assert.equal(slice.tagName, "ds-badge");
  assert.ok(danger, "the record includes danger");
  assert.equal(danger.exampleLabel, "Failed");
  assert.equal(danger.exampleHtml, '<ds-badge variant="danger">Failed</ds-badge>');
  assert.doesNotMatch(
    danger.exampleHtml,
    /Delete project/,
    "Badge danger is not a Button delete action",
  );
});

test("the badge page renders variants, api, and accessibility from the knowledge base", async () => {
  const knowledge = await loadKnowledge();
  const record = knowledge.get("component.badge") as unknown as {
    parameters: { variant: { values: Record<string, string> } };
    rules: { topic: string; statement: string }[];
  };
  const variantValues = record.parameters.variant.values;
  const slice = loadComponentSlice("badge");
  const danger = slice.variants.find((variant) => variant.name === "danger");
  const markdown = componentKnowledgeMarkdown("badge");
  const source = pageSource("badge");
  const banner = source.match(/^---\n([\s\S]*?)\n---/);

  assert.ok(danger, "the record includes danger");
  assert.deepEqual(
    Object.fromEntries(slice.variants.map((variant) => [variant.name, variant.description])),
    variantValues,
    "variant copy tracks the record",
  );
  assert.deepEqual(
    slice.accessibility.requirements,
    record.rules.filter((rule) => rule.topic === "accessibility").map((rule) => rule.statement),
    "accessibility tracks the record's accessibility rules",
  );
  assert.equal(
    danger.description,
    "Failed or blocked status, not a destructive action.",
    "danger meaning comes from the component record",
  );
  assert.match(markdown, /not a destructive action/);
  assert.ok(
    slice.api.some((row) => row.name === "variant"),
    "api includes the variant attribute",
  );
  assert.equal(
    slice.api.some((row) => row.name === "hidden"),
    false,
    "Badge does not publish hidden; native hiding is a host attribute, not a parameter",
  );
  assert.equal(slice.accessibility.keyboard.length, 0, "Badge has no keyboard bindings");
  assert.ok(
    slice.accessibility.requirements.some((item) => /live-region/.test(item)),
    "accessibility keeps the live-region rule from the record",
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
  assert.match(
    slice.introMarkdown,
    /Use \[Button\]\(\/components\/button\) instead\./,
    "Button is the stated alternative, linked to its page",
  );
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
  assert.equal(loadComponentSlice("badge").title, "Badge", "component.badge is available to docs");
  assert.throws(
    () => loadComponentSlice("dialog"),
    DocsKnowledgeError,
    "a component without an implementation file has no page",
  );
  assert.throws(
    () => componentKnowledgeMarkdown("button", "hierarchy"),
    DocsKnowledgeError,
    "unknown page sections fail instead of dumping related records",
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

test("a knowledge component gets a page only when it has an implementation file", async () => {
  const knowledge = await loadKnowledge();
  const components = knowledge
    .list({ type: "component" })
    .map((record) => record.id.slice("component.".length));
  const implemented = loadImplementations(join(docsRoot, "implementation/")).map((item) =>
    item.component.slice("component.".length),
  );

  for (const slug of implemented) assert.ok(components.includes(slug), `component.${slug} exists`);
  assert.deepEqual([...componentSlugs()].sort(), [...implemented].sort());
});

test("an implementation file for a component that does not exist fails with its file name", () => {
  const ghost = parseImplementation(
    "---\ncomponent: component.ghost\npackage: pkg\ntagName: ds-ghost\ndefineExport: defineGhost\napi:\n  - { name: x, kind: attribute, type: string, description: X. }\n---\n",
    "implementation/ghost.md",
  );
  return loadKnowledge().then((knowledge) => {
    assert.throws(
      () => assembleSlices(knowledge, [ghost], mkdtempSync(join(tmpdir(), "assets-"))),
      /implementation\/ghost\.md: component "component\.ghost" is not a component record/,
    );
  });
});

test("an api table that skips a knowledge parameter or event fails the build", async () => {
  const knowledge = await loadKnowledge();
  const badge = parseImplementation(
    "---\ncomponent: component.badge\npackage: pkg\ntagName: ds-badge\ndefineExport: defineBadge\napi:\n  - { name: hidden, kind: attribute, type: boolean, description: Hides. }\n---\n",
    "implementation/badge.md",
  );
  assert.throws(
    () => assembleSlices(knowledge, [badge], mkdtempSync(join(tmpdir(), "assets-"))),
    /does not cover component\.badge parameter "variant"/,
  );
});

test("implementation front matter is validated with the file name in every error", () => {
  const parse = (frontMatter: string) =>
    parseImplementation(`---\n${frontMatter}\n---\n`, "implementation/x.md");
  const valid =
    "component: component.x\npackage: pkg\ntagName: ds-x\ndefineExport: defineX\napi:\n  - { name: a, kind: attribute, parameter: a }";

  assert.doesNotThrow(() => parse(valid));
  assert.throws(
    () => parseImplementation("no front matter", "implementation/x.md"),
    /x\.md: must start with YAML/,
  );
  assert.throws(() => parse(valid.replace("component.x", "button")), /x\.md: component "button"/);
  assert.throws(() => parse(valid.replace("ds-x", "dsx")), /tagName "dsx"/);
  assert.throws(() => parse(`${valid}\nextra: 1`), /unknown field "extra"/);
  assert.throws(() => parse(valid.replace("kind: attribute", "kind: slot")), /kind must be one of/);
  assert.throws(
    () => parse(valid.replace("parameter: a", "type: string")),
    /needs "parameter".*or both "type" and "description"/,
  );
  assert.throws(
    () => parse(`${valid}\n  - { name: a, kind: attribute, parameter: b }`),
    /lists the attribute "a" twice/,
  );
  assert.throws(() => parse(valid.replace("api:", "api: []\nold:")), ImplementationError);
});

test("every implementation file's api rows resolve against its record", () => {
  for (const slug of componentSlugs()) {
    const slice = loadComponentSlice(slug);
    assert.ok(slice.api.length > 0, `${slug} has an api table`);
    assert.ok(
      readdirSync(join(docsRoot, "implementation")).includes(`${slug}.md`),
      `${slug} has an implementation file`,
    );
  }
});
