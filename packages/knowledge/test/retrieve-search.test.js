import assert from "node:assert/strict";
import { test } from "node:test";
import { buildSearchIndex } from "../src/compile/search-index.js";
import { openCatalog } from "../src/retrieve/index.js";
import { stubManifest, stubRecord } from "./helpers/catalog.js";

test("title matches outrank body matches", async () => {
  const titleHit = stubRecord("fixture.title-hit", {
    title: "Focus ring",
    summary: "Other words.",
    tags: ["fixture"],
    body: "Unrelated body copy.",
  });
  const bodyHit = stubRecord("fixture.body-hit", {
    title: "Something else",
    summary: "Other words.",
    tags: ["fixture"],
    body: "The focus appears only in the body.",
  });
  const records = [titleHit, bodyHit];
  const catalog = await openCatalog({
    records,
    searchIndex: buildSearchIndex(records),
    manifest: stubManifest(2),
  });

  const hits = catalog.search("focus");
  assert.deepEqual(
    hits.map((hit) => hit.record.id),
    ["fixture.title-hit", "fixture.body-hit"],
  );
  assert.equal("score" in hits[0], false);
});

test("two-term coverage beats a one-term title hit", async () => {
  const coverage = stubRecord("fixture.coverage", {
    title: "Other",
    summary: "Other words.",
    tags: ["fixture"],
    body: "destructive button appears only here",
  });
  const titleOnly = stubRecord("fixture.title-only", {
    title: "Destructive",
    summary: "Other words.",
    tags: ["fixture"],
    body: "Unrelated body copy.",
  });
  const records = [coverage, titleOnly];
  const catalog = await openCatalog({
    records,
    searchIndex: buildSearchIndex(records),
    manifest: stubManifest(2),
  });

  const hits = catalog.search("destructive button");
  assert.deepEqual(
    hits.map((hit) => hit.record.id),
    ["fixture.coverage", "fixture.title-only"],
  );
  assert.deepEqual(hits[0].terms, ["button", "destructive"]);
  assert.deepEqual(hits[1].terms, ["destructive"]);
});

test("stopword queries return []", async () => {
  const record = stubRecord("fixture.words", { body: "The button is in the form." });
  const catalog = await openCatalog({
    records: [record],
    searchIndex: buildSearchIndex([record]),
    manifest: stubManifest(1),
  });
  assert.deepEqual(catalog.search("the and of"), []);
  assert.deepEqual(catalog.search(""), []);
});

test("search guideline is empty on the real slice because type is not indexed", async () => {
  const catalog = await openCatalog();
  assert.equal(catalog.list({ type: "guideline" }).length > 0, true);
  assert.deepEqual(catalog.search("guideline"), []);
});

test("compiled contract host and checks are searchable", async () => {
  const catalog = await openCatalog();
  const fullWidthIds = catalog.search("fullWidth").map((hit) => hit.record.id);
  const accessibleNameIds = catalog.search("accessibleName").map((hit) => hit.record.id);
  const pressedIds = catalog.search("pressed").map((hit) => hit.record.id);
  const tagIds = catalog.search("ds-button").map((hit) => hit.record.id);

  assert.equal(fullWidthIds.includes("component.button"), true);
  assert.equal(fullWidthIds.includes("spec.button"), true);
  assert.equal(accessibleNameIds.includes("component.button"), true);
  assert.equal(pressedIds.includes("component.button"), true);
  assert.equal(tagIds.includes("binding.button.web-component"), true);
  assert.deepEqual(catalog.search("guideline"), []);
});

test("posting indexes map through searchIndex.records, not records.json position", async () => {
  const alpha = stubRecord("fixture.alpha", {
    title: "Alpha title",
    body: "shared term uniquealpha",
  });
  const zeta = stubRecord("fixture.zeta", {
    title: "Zeta title",
    body: "shared term uniquezeta",
  });
  const indexed = [alpha, zeta];
  const searchIndex = buildSearchIndex(indexed);
  assert.deepEqual(searchIndex.records, ["fixture.alpha", "fixture.zeta"]);

  const catalog = await openCatalog({
    records: [zeta, alpha],
    searchIndex,
    manifest: stubManifest(2),
  });
  const hits = catalog.search("uniquezeta");
  assert.equal(hits.length, 1);
  assert.equal(hits[0].record.id, "fixture.zeta");
});
