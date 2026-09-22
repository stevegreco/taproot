import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "vitest";
import { compile } from "../src/compile/index.js";
import { openCatalog, KnowledgeQueryError } from "../src/retrieve/index.js";
import { authored, projectFiles, stubIndex, stubManifest, stubRecord } from "./helpers/catalog.js";
import { portableContract, repoRoot } from "./helpers/workspace.js";

test("get returns a hit, undefined for a miss, and malformed-id for button", async () => {
  const catalog = await openCatalog();
  assert.equal(catalog.get("component.button").id, "component.button");
  assert.equal(catalog.get("component.badge").id, "component.badge");
  assert.equal(catalog.get("spec.button"), undefined);
  assert.equal(
    catalog
      .related("component.badge")
      .some((neighbor) => neighbor.record.id === "component.button"),
    true,
  );
  assert.equal(
    catalog.related("component.button").some((neighbor) => neighbor.record.id === "spec.button"),
    false,
  );
  assert.equal(catalog.get("component.missing"), undefined);
  assert.throws(
    () => catalog.get("button"),
    (error) => {
      assert.equal(error instanceof KnowledgeQueryError, true);
      assert.equal(error.code, "malformed-id");
      return true;
    },
  );
  assert.throws(() => catalog.get(1), TypeError);
});

test("get identifies contract provenance from the component authored source", async () => {
  const path = "content/components/owned.md";
  const bundle = await projectFiles({
    [path]: authored(path, {
      id: "component.owned",
      contract: portableContract({ description: "Owned on the component." }),
    }),
  });
  const catalog = await openCatalog({
    records: bundle.records,
    searchIndex: bundle.searchIndex,
    manifest: bundle.manifest,
  });

  const record = catalog.get("component.owned");
  const authoredSources = record.sources.filter((source) => source.kind === "authored");

  assert.equal(record.contract.description, "Owned on the component.");
  assert.equal(Object.hasOwn(record, "contractSource"), false);
  assert.equal(authoredSources.length, 1);
  assert.equal(authoredSources[0].path, path);
  assert.match(authoredSources[0].revision, /^[0-9a-f]{16}$/);
});

test("Button guidance uses guides and reviews, not related", async () => {
  const catalog = await openCatalog();
  const neighbors = catalog.related("component.button");
  const byId = Object.fromEntries(neighbors.map((neighbor) => [neighbor.record.id, neighbor]));

  for (const id of [
    "binding.button.web-component",
    "component.badge",
    "example.action-hierarchy.settings",
    "guideline.button-implementation",
    "guideline.button-review",
    "pattern.action-hierarchy",
  ]) {
    assert.ok(byId[id], `related("component.button") includes ${id}`);
  }

  assert.deepEqual(catalog.get("component.button").relations.related, ["component.badge"]);
  assert.equal(Object.hasOwn(catalog.get("component.button").relations, "guides"), false);

  assert.deepEqual(byId["pattern.action-hierarchy"].via, [
    { relation: "guides", direction: "inbound" },
    { relation: "uses", direction: "inbound" },
  ]);
  assert.deepEqual(byId["guideline.button-implementation"].via, [
    { relation: "guides", direction: "inbound" },
  ]);
  assert.deepEqual(byId["guideline.button-review"].via, [
    { relation: "reviews", direction: "inbound" },
  ]);
  assert.deepEqual(byId["component.badge"].via, [{ relation: "related", direction: "symmetric" }]);
  assert.deepEqual(byId["binding.button.web-component"].via, [
    { relation: "implements", direction: "inbound" },
  ]);
  assert.deepEqual(byId["example.action-hierarchy.settings"].via, [
    { relation: "uses", direction: "inbound" },
  ]);

  const pattern = catalog.get("pattern.action-hierarchy");
  assert.deepEqual(pattern.relations.guides, ["component.button"]);
  assert.equal(Object.hasOwn(pattern.relations, "related"), false);

  const implementation = catalog.get("guideline.button-implementation");
  assert.deepEqual(implementation.relations.guides, ["component.button"]);
  assert.deepEqual(implementation.relations.uses, ["pattern.action-hierarchy"]);
  assert.equal(Object.hasOwn(implementation.relations, "related"), false);

  const review = catalog.get("guideline.button-review");
  assert.deepEqual(review.relations.reviews, ["component.button", "pattern.action-hierarchy"]);
  assert.equal(Object.hasOwn(review.relations, "related"), false);
  assert.deepEqual(review.checks.length > 0, true);

  assert.deepEqual(catalog.get("component.badge").relations.related, ["component.button"]);
});

test("Button review keeps checks and does not restate them in the body", async () => {
  const catalog = await openCatalog();
  const review = catalog.get("guideline.button-review");

  assert.deepEqual(
    review.checks.map((check) => check.id),
    [
      "button-review-semantics",
      "button-review-hierarchy",
      "button-review-danger",
      "button-review-label",
      "button-review-form-type",
      "button-review-disabled",
      "button-review-focus",
      "button-review-tokens",
    ],
  );
  assert.match(
    review.body,
    /source-only review cannot verify focus/,
    "keep the note that a source-only review cannot verify focus or disabled behavior",
  );
  assert.doesNotMatch(
    review.body,
    /^## /m,
    "review body must not restate checks as a heading list",
  );
});

test("list filters AND across keys and OR within a key", async () => {
  const catalog = await openCatalog();
  const guidelines = catalog.list({ type: "guideline" });
  assert.equal(
    guidelines.every((record) => record.type === "guideline"),
    true,
  );
  const guidelineIds = guidelines.map((record) => record.id);
  assert.deepEqual(guidelineIds, [...guidelineIds].sort());
  assert.equal(guidelineIds.includes("guideline.button-implementation"), true);
  assert.equal(guidelineIds.includes("guideline.button-review"), true);

  const implement = catalog.list({ jobs: "implement", type: ["guideline", "pattern"] });
  assert.equal(
    implement.every(
      (record) =>
        record.jobs.includes("implement") &&
        (record.type === "guideline" || record.type === "pattern"),
    ),
    true,
  );
  const implementIds = implement.map((record) => record.id);
  assert.equal(implementIds.includes("guideline.button-implementation"), true);
  assert.equal(implementIds.includes("pattern.action-hierarchy"), true);

  const unused = catalog.list({ tags: "not-used-yet" });
  assert.deepEqual(unused, []);

  assert.throws(
    () => catalog.list({ typo: "x" }),
    (error) => {
      assert.equal(error.code, "unknown-filter");
      return true;
    },
  );
  assert.throws(
    () => catalog.list({ type: "spec" }),
    (error) => {
      assert.equal(error.code, "unknown-filter-value");
      return true;
    },
  );
  assert.throws(
    () => catalog.list({ type: "widget" }),
    (error) => {
      assert.equal(error.code, "unknown-filter-value");
      return true;
    },
  );
  assert.throws(
    () => catalog.list({ tags: "Not A Slug" }),
    (error) => {
      assert.equal(error.code, "unknown-filter-value");
      return true;
    },
  );
});

test("every public component record has a contract", async () => {
  const catalog = await openCatalog();
  const components = catalog.list({ type: "component" });
  assert.equal(
    components.some((record) => record.id === "component.button"),
    true,
  );
  assert.equal(
    components.some((record) => record.id === "component.badge"),
    true,
  );
  for (const record of components) {
    assert.equal(record.type, "component");
    assert.ok(record.contract);
    assert.equal(Object.hasOwn(record.contract, "tagName"), false);
    assert.ok(record.contract.parameters);
  }
  const binding = catalog.get("binding.button.web-component");
  assert.equal(binding.host.defaultTagName, "ds-button");
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
  assert.throws(
    () => catalog.related("fixture.missing"),
    (error) => {
      assert.equal(error.code, "unknown-record");
      return true;
    },
  );
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
    publicCatalog
      .related("component.button")
      .some((neighbor) => neighbor.record.id === "internal.uses-button"),
    false,
  );
  assert.equal(
    internalCatalog
      .related("component.button")
      .some((neighbor) => neighbor.record.id === "internal.uses-button"),
    true,
  );
  assert.throws(
    () => publicCatalog.related("internal.uses-button"),
    (error) => {
      assert.equal(error.code, "unknown-record");
      return true;
    },
  );
});
