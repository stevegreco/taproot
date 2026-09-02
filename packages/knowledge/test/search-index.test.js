import assert from "node:assert/strict";
import { test } from "node:test";
import { buildSearchIndex, tokenize } from "../src/compile/search-index.js";

test("postings are indexes into records, not ids", () => {
  const records = [
    { id: "component.alpha", title: "Alpha", summary: "First record", tags: ["alpha"], body: "hello world" },
    { id: "component.beta", title: "Beta", summary: "Second record", tags: ["beta"], body: "hello there" },
  ];
  const index = buildSearchIndex(records);
  assert.equal(index.version, 1);
  assert.deepEqual(index.records, ["component.alpha", "component.beta"]);
  assert.deepEqual(index.terms.hello, [0, 1]);
  assert.deepEqual(index.terms.world, [0]);
  assert.equal(
    index.terms.hello.every((posting) => Number.isInteger(posting)),
    true,
  );
});

test("stopwords and one-character tokens are dropped", () => {
  assert.deepEqual([...tokenize("the a I of x go")].sort(), ["go"]);
  assert.equal(tokenize("the and of").size, 0);
});

test("component.button tokenizes to component and button", () => {
  assert.deepEqual([...tokenize("component.button")].sort(), ["button", "component"]);
});
