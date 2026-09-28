import assert from "node:assert/strict";
import { test } from "vitest";
import { buildSearchIndex, collectSearchText, tokenize } from "../src/compile/search-index.js";

test("postings are indexes into records, not ids", () => {
  const records = [
    {
      id: "component.alpha",
      title: "Alpha",
      summary: "First record",
      tags: ["alpha"],
      body: "hello world",
    },
    {
      id: "component.beta",
      title: "Beta",
      summary: "Second record",
      tags: ["beta"],
      body: "hello there",
    },
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

test("non-ASCII letters are separators, not indexed terms", () => {
  assert.deepEqual([...tokenize("café")].sort(), ["caf"]);
  assert.equal(tokenize("日本語").size, 0);
});

test("contract host and checks add terms without stringifying the record", () => {
  const record = {
    id: "component.secret",
    type: "guideline",
    title: "Quiet title",
    summary: "Quiet summary.",
    jobs: ["implement", "review"],
    tags: ["quiet"],
    body: "Quiet body.",
    contract: {
      usage: {
        do: [{ situation: "Trigger an action." }],
        avoid: [{ situation: "Navigate away." }],
      },
      anatomy: [{ name: "control", role: "interactive-surface", description: "unused role text" }],
      parameters: {
        fullWidth: { kind: "boolean" },
        variant: { kind: "enum", values: { ghost: "Low emphasis." } },
      },
      events: { activate: { description: "unused event prose" } },
      states: ["pressed", "focus"],
      accessibility: { requirements: ["Icon-only buttons have an accessibleName."] },
    },
    host: {
      defaultTagName: "ds-button",
      anatomy: { content: { slot: "default", part: "button" } },
      parts: { button: { description: "unused part prose" } },
      parameters: {
        fullWidth: { attribute: "full-width", property: "fullWidth" },
        accessibleName: { attribute: "aria-label" },
      },
    },
    checks: [
      { id: "button-review-label", requirement: "The accessible label describes the result." },
    ],
  };

  const text = collectSearchText(record);
  assert.match(text, /fullWidth/);
  assert.match(text, /accessibleName/);
  assert.match(text, /pressed/);
  assert.match(text, /ds-button/);
  assert.match(text, /aria-label/);
  assert.match(text, /accessible label describes/);
  assert.equal(text.includes("component.secret"), false);
  assert.equal(text.includes("guideline"), false);
  assert.equal(text.includes("implement"), false);
  assert.equal(text.includes("unused role text"), false);
  assert.equal(text.includes("unused event prose"), false);
  assert.equal(text.includes("unused part prose"), false);

  const index = buildSearchIndex([record]);
  assert.deepEqual(index.records, ["component.secret"]);
  assert.deepEqual(index.terms.fullwidth, [0]);
  assert.deepEqual(index.terms.accessiblename, [0]);
  assert.deepEqual(index.terms.pressed, [0]);
  assert.deepEqual(index.terms.ds, [0]);
  assert.equal(index.terms.guideline, undefined);
  assert.equal(index.terms.implement, undefined);
  assert.equal(index.terms.review, undefined);
});

test("each record still contributes one posting set", () => {
  const records = [
    {
      id: "spec.one",
      title: "One",
      summary: "First",
      tags: ["one"],
      body: "shared",
      contract: { parameters: { fullWidth: { kind: "boolean" } } },
    },
    {
      id: "spec.two",
      title: "Two",
      summary: "Second",
      tags: ["two"],
      body: "shared",
      contract: { parameters: { fullWidth: { kind: "boolean" } } },
    },
  ];
  const index = buildSearchIndex(records);
  assert.deepEqual(index.records, ["spec.one", "spec.two"]);
  assert.deepEqual(index.terms.shared, [0, 1]);
  assert.deepEqual(index.terms.fullwidth, [0, 1]);
  assert.equal(index.records.filter((id) => id === "spec.one").length, 1);
});
