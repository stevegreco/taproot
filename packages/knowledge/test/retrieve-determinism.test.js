import assert from "node:assert/strict";
import { test } from "vitest";
import { buildSearchIndex } from "../src/compile/search-index.js";
import { openCatalog } from "../src/retrieve/index.js";
import { stubManifest, stubRecord } from "./helpers/catalog.js";

function byCodeUnit(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function shuffle(items, seed) {
  const copy = [...items];
  let state = seed;
  for (let index = copy.length - 1; index > 0; index -= 1) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const swap = state % (index + 1);
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
}

function shuffleTerms(terms, seed) {
  const entries = shuffle(Object.entries(terms), seed);
  return Object.fromEntries(entries);
}

function neighborIds(catalog, id) {
  return catalog.related(id).map((neighbor) => neighbor.record.id);
}

test("shuffled records and term insertion still yield identical id sequences", async () => {
  const hyphen = stubRecord("order.a-b", {
    title: "Hyphen order",
    summary: "Shared pumpkin summary.",
    tags: ["order"],
    relations: { uses: ["order.a.b"] },
    body: "pumpkin hyphen body",
  });
  const dotted = stubRecord("order.a.b", {
    title: "Dotted order",
    summary: "Shared pumpkin summary.",
    tags: ["order"],
    backlinks: { usedBy: ["order.a-b"] },
    body: "pumpkin dotted body",
  });
  const extra = stubRecord("order.aa", {
    title: "Extra order",
    summary: "Quiet summary.",
    tags: ["order"],
    body: "quiet extra body",
  });

  const first = await openShuffled([hyphen, dotted, extra], 1);
  const second = await openShuffled([hyphen, dotted, extra], 99);

  const expectedIds = ["order.a-b", "order.a.b", "order.aa"].sort(byCodeUnit);
  assert.deepEqual(
    first.list().map((record) => record.id),
    expectedIds,
  );
  assert.deepEqual(
    first.list().map((record) => record.id),
    second.list().map((record) => record.id),
  );
  assert.deepEqual(
    first.search("pumpkin").map((hit) => hit.record.id),
    second.search("pumpkin").map((hit) => hit.record.id),
  );
  assert.deepEqual(neighborIds(first, "order.a-b"), neighborIds(second, "order.a-b"));
  assert.deepEqual(first.related("order.a-b")[0].via, second.related("order.a-b")[0].via);
});

test("real public catalog list search and related are stable across opens", async () => {
  const first = await openCatalog();
  const second = await openCatalog();
  assert.deepEqual(
    first.list().map((record) => record.id),
    second.list().map((record) => record.id),
  );
  assert.deepEqual(
    first.search("button").map((hit) => hit.record.id),
    second.search("button").map((hit) => hit.record.id),
  );
  assert.deepEqual(neighborIds(first, "component.button"), neighborIds(second, "component.button"));
});

async function openShuffled(records, seed) {
  const ordered = shuffle(records, seed);
  const searchIndex = buildSearchIndex(ordered);
  searchIndex.terms = shuffleTerms(searchIndex.terms, seed + 7);
  return openCatalog({
    records: shuffle(ordered, seed + 3),
    searchIndex,
    manifest: stubManifest(records.length),
  });
}
