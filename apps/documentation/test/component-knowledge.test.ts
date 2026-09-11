import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "vitest";
import { fileURLToPath } from "node:url";
import { openCatalog } from "@stevegreco/design-system-knowledge/retrieve";
import {
  componentKnowledgeMarkdown,
  DocsKnowledgeError,
  loadComponentSlice,
} from "../lib/component-knowledge";

const docsRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

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
  assert.match(slice.behaviorMarkdown, /Write the label/, "label guidance sits with usage");
  assert.match(slice.behaviorMarkdown, /type="submit"/, "form behavior stays with usage");
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
  assert.equal(slice.accessibility.keyboard.length, 2, "keyboard bindings come from the contract");
  assert.ok(slice.together, "related pattern and example project into using-together");
  assert.ok(
    slice.together?.example?.src.startsWith("/knowledge-assets/"),
    "example image is a docs URL, not a bundlePath",
  );
  assert.ok(
    slice.together && slice.together.avoid.length > 0,
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

test("badge.mdx renders variants, api, and accessibility from the catalog", async () => {
  const publicRoot = dirname(
    fileURLToPath(import.meta.resolve("@stevegreco/design-system-knowledge/manifest")),
  );
  const catalog = await openCatalog(publicRoot, { expectVisibility: "public" });
  const record = catalog.get("component.badge");
  const variantValues = record.contract.parameters.variant.values;
  const slice = loadComponentSlice("badge");
  const danger = slice.variants.find((variant) => variant.name === "danger");
  const markdown = componentKnowledgeMarkdown("badge");
  const source = readFileSync(join(docsRoot, "docs/components/badge.mdx"), "utf8");
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

  assert.ok(banner, "badge.mdx has YAML frontmatter");
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
    "authored MDX must not recommend Badge danger for destructive actions",
  );
  assert.doesNotMatch(
    source,
    /<TypeTable/,
    "API facts come from ComponentKnowledge, not a copied table",
  );
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

test("button.mdx frontmatter matches the slice title and summary", () => {
  const slice = loadComponentSlice("button");
  const source = readFileSync(join(docsRoot, "docs/components/button.mdx"), "utf8");
  const banner = source.match(/^---\n([\s\S]*?)\n---/);
  assert.ok(banner, "button.mdx has YAML frontmatter");
  const title = banner[1].match(/^title:\s*(.+)$/m)?.[1]?.trim();
  const description = banner[1].match(/^description:\s*(.+)$/m)?.[1]?.trim();
  assert.equal(title, slice.title, "frontmatter title matches the record title");
  assert.equal(description, slice.summary, "frontmatter description matches the record summary");
  assert.match(source, /^## Variants$/m);
  assert.match(source, /^## Using together$/m);
  assert.match(source, /^## Attributes$/m);
  assert.match(source, /^## Accessibility$/m);
  assert.match(source, /section="review"/, "review stays available without a TOC heading");
});
