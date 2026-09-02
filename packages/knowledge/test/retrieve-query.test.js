import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { compile } from "../src/compile/index.js";
import { openCatalog, KnowledgeQueryError } from "../src/retrieve/index.js";
import { authored, projectFiles, stubIndex, stubManifest, stubRecord } from "./helpers/catalog.js";
import { repoRoot } from "./helpers/workspace.js";

test("get returns a hit, undefined for a miss, and malformed-id for button", async () => {
  const catalog = await openCatalog();
  assert.equal(catalog.get("component.button").id, "component.button");
  assert.equal(catalog.get("component.missing"), undefined);
  assert.throws(() => catalog.get("button"), (error) => {
    assert.equal(error instanceof KnowledgeQueryError, true);
    assert.equal(error.code, "malformed-id");
    return true;
  });
  assert.throws(() => catalog.get(1), TypeError);
});

test("list filters AND across keys and OR within a key", async () => {
  const catalog = await openCatalog();
  const guidelines = catalog.list({ type: "guideline" });
  assert.deepEqual(
    guidelines.map((record) => record.id),
    ["guideline.button-implementation", "guideline.button-review"],
  );

  const implement = catalog.list({ jobs: "implement", type: ["guideline", "pattern"] });
  assert.deepEqual(
    implement.map((record) => record.id),
    ["guideline.button-implementation", "pattern.action-hierarchy"],
  );

  const unused = catalog.list({ tags: "not-used-yet" });
  assert.deepEqual(unused, []);

  assert.throws(() => catalog.list({ typo: "x" }), (error) => {
    assert.equal(error.code, "unknown-filter");
    return true;
  });
  assert.throws(() => catalog.list({ type: "widget" }), (error) => {
    assert.equal(error.code, "unknown-filter-value");
    return true;
  });
  assert.throws(() => catalog.list({ tags: "Not A Slug" }), (error) => {
    assert.equal(error.code, "unknown-filter-value");
    return true;
  });
});

test("list visibility narrows an internal catalog and never widens a public one", async () => {
  const bundle = await projectFiles(
    {
      "content/alpha.md": authored("content/alpha.md", { id: "component.alpha" }),
      "internal/secret.md": authored("internal/secret.md", {
        id: "internal.secret",
        visibility: "internal",
        type: "guideline",
        relations: { uses: ["component.alpha"] },
      }),
    },
    "internal",
  );
  const catalog = await openCatalog({
    records: bundle.records,
    searchIndex: bundle.searchIndex,
    manifest: bundle.manifest,
  });
  assert.equal(catalog.info.visibility, "internal");
  assert.deepEqual(
    catalog.list({ visibility: "internal" }).map((record) => record.id),
    ["internal.secret"],
  );

  const publicCatalog = await openCatalog();
  assert.equal(publicCatalog.list({ visibility: "internal" }).length, 0);
});

test("related groups two edges onto one neighbor via[]", async () => {
  const bundle = await projectFiles({
    "content/alpha.md": authored("content/alpha.md", {
      id: "component.alpha",
      relations: { uses: ["component.beta"], related: ["component.beta"] },
    }),
    "content/beta.md": authored("content/beta.md", { id: "component.beta" }),
  });
  const catalog = await openCatalog({
    records: bundle.records,
    searchIndex: bundle.searchIndex,
    manifest: bundle.manifest,
  });

  const neighbors = catalog.related("component.alpha");
  assert.equal(neighbors.length, 1);
  assert.equal(neighbors[0].record.id, "component.beta");
  assert.deepEqual(neighbors[0].via, [
    { relation: "related", direction: "symmetric" },
    { relation: "uses", direction: "outbound" },
  ]);

  const inbound = catalog.related("component.beta");
  assert.equal(inbound.length, 1);
  assert.equal(inbound[0].record.id, "component.alpha");
  assert.deepEqual(inbound[0].via, [
    { relation: "related", direction: "symmetric" },
    { relation: "uses", direction: "inbound" },
  ]);
});

test("related throws for an unknown seed and returns [] for an isolated record", async () => {
  const isolated = stubRecord("fixture.alone");
  const catalog = await openCatalog({
    records: [isolated],
    searchIndex: stubIndex([isolated]),
    manifest: stubManifest(1),
  });
  assert.deepEqual(catalog.related("fixture.alone"), []);
  assert.throws(() => catalog.related("fixture.missing"), (error) => {
    assert.equal(error.code, "unknown-record");
    return true;
  });
});

test("a public catalog cannot related() an internal neighbor", async () => {
  const outDir = await mkdtemp(join(tmpdir(), "knowledge-related-vis-"));
  await compile({
    workspaceRoot: repoRoot,
    outDir,
    internalContent: {
      root: join(repoRoot, "packages/knowledge/test/fixtures/internal-content"),
      visibility: "internal",
    },
    buildTime: new Date(0),
    revision: "test",
  });

  const publicCatalog = await openCatalog(join(outDir, "public"));
  const internalCatalog = await openCatalog(join(outDir, "internal"));

  assert.equal(
    publicCatalog.related("component.button").some((neighbor) => neighbor.record.id === "internal.uses-button"),
    false,
  );
  assert.equal(
    internalCatalog.related("component.button").some((neighbor) => neighbor.record.id === "internal.uses-button"),
    true,
  );
  assert.throws(() => publicCatalog.related("internal.uses-button"), (error) => {
    assert.equal(error.code, "unknown-record");
    return true;
  });
});
