import assert from "node:assert/strict";
import { test } from "node:test";
import { assembleCorpus } from "../src/compile/corpus.js";
import { loadCorpusInputs } from "../src/compile/inputs.js";
import { withTokenGroups } from "../src/compile/records.js";
import { rewriteBodyLinks, rewriteEmittedMarkdownUrls, toMarkdownFileUrl } from "../src/compile/narrative.js";
import { createMemoryReader, recordMarkdown, portableContract } from "./helpers/workspace.js";

test("HTML destinations share resolution and preserve unrelated markup", () => {
  const result = rewriteBodyLinks(
    '<div class="example"><img alt="Shot" src=./shot.svg><a href="./beta.md#usage">Beta</a></div>',
    {
      authoredPath: "content/alpha.md",
      recordId: "component.alpha",
      recordIdByPath: new Map([["content/beta.md", "component.beta"]]),
      assetPathToBundlePath: new Map([["content/shot.svg", "assets/ds.shot.svg"]]),
    },
  );
  assert.deepEqual(result.problems, []);
  assert.equal(
    result.body,
    '<div class="example"><img alt="Shot" src="assets/ds.shot.svg"><a href="markdown/component.beta.md#usage">Beta</a></div>',
  );
  assert.deepEqual(result.references, [
    { kind: "asset", target: "assets/ds.shot.svg" },
    { kind: "record", target: "component.beta" },
  ]);
});

test("unknown HTML destinations fail instead of shipping dangling references", () => {
  const result = rewriteBodyLinks('<img src="assets/missing.svg">', {
    authoredPath: "content/alpha.md",
    recordId: "component.alpha",
    recordIdByPath: new Map(),
    assetPathToBundlePath: new Map(),
  });
  assert.equal(result.problems[0].code, "body/unresolved-link");
});

test("corpus assembly is repeatable and leaves loaded inputs unchanged", async () => {
  const loaded = await loadCorpusInputs(
    createMemoryReader({
      "content/alpha.md": recordMarkdown(
        {
          id: "component.alpha",
          path: "content/alpha.md",
          relations: { related: ["component.beta"] },
        },
        "See [Beta](./beta.md#usage).",
      ),
      "content/beta.md": recordMarkdown({ id: "component.beta", path: "content/beta.md" }),
    }),
    [{ root: "content", visibility: "public" }],
  );
  const before = structuredClone(loaded);
  const first = assembleCorpus(loaded);
  const second = assembleCorpus(loaded);

  assert.deepEqual(loaded, before);
  assert.deepEqual(first, second);
  assert.deepEqual(first.problems, []);
  assert.equal(
    first.records.get("component.alpha").body,
    "See [Beta](markdown/component.beta.md#usage).",
  );
  assert.deepEqual(first.narrativeReferences.get("component.alpha"), [
    { kind: "record", target: "component.beta" },
  ]);
  assert.deepEqual(first.edges, [
    { from: "component.alpha", relation: "related", to: "component.beta" },
  ]);
});

test("emitted Markdown destinations are relative to the markdown file", () => {
  assert.equal(
    toMarkdownFileUrl("markdown/component.beta.md#usage"),
    "component.beta.md#usage",
  );
  assert.equal(toMarkdownFileUrl("assets/ds.shot.svg"), "../assets/ds.shot.svg");
  assert.equal(toMarkdownFileUrl("https://example.com/markdown/component.beta.md"), "https://example.com/markdown/component.beta.md");
  assert.equal(toMarkdownFileUrl("#usage"), "#usage");

  const emitted = rewriteEmittedMarkdownUrls(
    '<div class="example"><img alt="Shot" src="assets/ds.shot.svg"><a href="markdown/component.beta.md#usage">Beta</a></div>\n\nSee [Beta](markdown/component.beta.md#usage).',
  );
  assert.equal(
    emitted,
    '<div class="example"><img alt="Shot" src="../assets/ds.shot.svg"><a href="component.beta.md#usage">Beta</a></div>\n\nSee [Beta](component.beta.md#usage).',
  );
});

test("token grouping returns new data without modifying frozen source entries", () => {
  const entry = Object.freeze({ name: "component.button.primary.background.rest", group: null });
  const record = Object.freeze({
    contract: portableContract({
      parameters: { variant: { kind: "enum", values: { primary: "Primary" } } },
    }),
    tokens: Object.freeze({ namespace: "component.button", entries: Object.freeze([entry]) }),
  });
  const grouped = withTokenGroups(record);
  assert.equal(grouped.tokens.entries[0].group, "primary");
  assert.equal(record.tokens.entries[0].group, null);
  assert.notEqual(grouped, record);
  assert.notEqual(grouped.tokens.entries[0], entry);
});
