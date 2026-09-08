import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { openCatalog } from "../../../../packages/knowledge/src/retrieve/index.js";
import {
  buildReviewPack,
  parseArgs,
  projectRecord,
} from "./review-pack.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const repoRoot = join(dirname(scriptPath), "../../../..");
const cliPath = join(dirname(scriptPath), "review-pack.mjs");

test("parseArgs reads repeatable ids, query, subject, hops, and bundle", () => {
  const options = parseArgs([
    "--id",
    "component.button",
    "--id",
    "pattern.action-hierarchy",
    "--query",
    "danger zone",
    "--subject",
    "source",
    "--hops",
    "2",
    "--bundle",
    "packages/knowledge/dist/public",
  ]);

  assert.deepEqual(options.ids, ["component.button", "pattern.action-hierarchy"]);
  assert.equal(options.query, "danger zone");
  assert.equal(options.subject, "source");
  assert.equal(options.hops, 2);
  assert.equal(options.bundle, "packages/knowledge/dist/public");
  assert.equal(options.help, false);
});

test("parseArgs rejects unknown flags and invalid subjects", () => {
  assert.throws(() => parseArgs(["--nope"]), /Unknown argument/);
  assert.throws(() => parseArgs(["--subject", "figma"]), /--subject must be one of/);
  assert.throws(() => parseArgs(["--hops", "-1"]), /non-negative integer/);
  assert.throws(() => parseArgs(["--id"]), /--id requires a value/);
});

test("default pack includes review checks and one-hop neighbors", async () => {
  const catalog = await openCatalog();
  const pack = buildReviewPack(catalog, {
    ids: [],
    query: "",
    hops: 1,
    subject: "design-artifact",
  });

  assert.equal(pack.kind, "design-system-review-pack");
  assert.equal(pack.subject, "design-artifact");
  assert.equal(pack.catalog.digest, catalog.info.digest);
  assert.ok(pack.catalog.knowledgeVersion);
  assert.equal(pack.records.some((record) => record.type === "binding"), false);

  const byId = Object.fromEntries(pack.records.map((record) => [record.id, record]));
  assert.ok(byId["guideline.button-review"]);
  assert.ok(byId["component.button"]);
  assert.ok(byId["pattern.action-hierarchy"]);
  assert.ok(byId["example.action-hierarchy.settings"]);
  assert.equal(byId["guideline.button-implementation"], undefined);
  assert.equal(byId["binding.button.web-component"], undefined);
  assert.equal(byId["guideline.button-review"].checks.length, 8);

  assert.deepEqual(
    pack.checks.map((check) => check.id),
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
  assert.equal(pack.checks.every((check) => check.recordId === "guideline.button-review"), true);
});

test("coverage notes flag components that have no review guideline", async () => {
  const catalog = await openCatalog();
  const pack = buildReviewPack(catalog, {
    ids: [],
    query: "",
    hops: 1,
    subject: "design-artifact",
  });

  assert.deepEqual(pack.coverage.componentsWithoutReviewGuideline, ["component.badge"]);
  assert.deepEqual(pack.coverage.patternsWithoutReviewGuideline, []);
  assert.ok(pack.coverage.catalogStatusCounts.draft >= 8);
});

test("seeding from Button still attaches the review guideline", async () => {
  const catalog = await openCatalog();
  const pack = buildReviewPack(catalog, {
    ids: ["component.button"],
    query: "",
    hops: 1,
    subject: "design-artifact",
  });

  assert.deepEqual(pack.seeds, ["component.button"]);
  const ids = pack.records.map((record) => record.id);
  assert.ok(ids.includes("guideline.button-review"));
  assert.ok(ids.includes("pattern.action-hierarchy"));
  assert.equal(ids.includes("binding.button.web-component"), false);
});

test("source subject keeps bindings and a slim host projection", async () => {
  const catalog = await openCatalog();
  const pack = buildReviewPack(catalog, {
    ids: ["component.button"],
    query: "",
    hops: 1,
    subject: "source",
  });

  const binding = pack.records.find((record) => record.id === "binding.button.web-component");
  assert.ok(binding);
  assert.ok(pack.records.some((record) => record.id === "guideline.button-implementation"));
  assert.equal(binding.host.defaultTagName, "ds-button");
  assert.equal(Object.hasOwn(binding.host, "anatomy"), false);

  const button = pack.records.find((record) => record.id === "component.button");
  assert.ok(button.contract.usage);
  assert.equal(Object.hasOwn(button, "tokens"), false);
});

test("search seed finds the settings example and its demonstrated records", async () => {
  const catalog = await openCatalog();
  const pack = buildReviewPack(catalog, {
    ids: [],
    query: "danger zone",
    hops: 1,
    subject: "design-artifact",
  });

  assert.ok(pack.seeds.includes("example.action-hierarchy.settings"));
  const example = pack.records.find((record) => record.id === "example.action-hierarchy.settings");
  assert.ok(example.annotations.some((annotation) => annotation.id === "danger-zone"));
  assert.ok(pack.records.some((record) => record.id === "pattern.action-hierarchy"));
  assert.ok(pack.records.some((record) => record.id === "guideline.button-review"));
});

test("unknown seed id fails closed", async () => {
  const catalog = await openCatalog();
  assert.throws(
    () =>
      buildReviewPack(catalog, {
        ids: ["component.select"],
        query: "",
        hops: 1,
        subject: "design-artifact",
      }),
    /component.select is not in this catalog/,
  );
});

test("unmatched query fails closed instead of dumping the corpus", async () => {
  const catalog = await openCatalog();
  assert.throws(
    () =>
      buildReviewPack(catalog, {
        ids: [],
        query: "zzzxnqv7reviewpack",
        hops: 1,
        subject: "design-artifact",
      }),
    /No catalog records matched query/,
  );
});

test("projectRecord omits host on design artifacts", () => {
  const projected = projectRecord(
    {
      id: "binding.button.web-component",
      type: "binding",
      title: "Button web component",
      summary: "Maps Button.",
      status: "draft",
      visibility: "public",
      jobs: ["implement"],
      tags: ["button"],
      body: "Host mapping.",
      host: { platform: "web-component", package: "@x/y", defaultTagName: "ds-button", anatomy: {} },
    },
    "design-artifact",
  );

  assert.equal(Object.hasOwn(projected, "host"), false);
});

test("CLI prints JSON with catalog digest", () => {
  const result = spawnSync(process.execPath, [cliPath, "--id", "component.button"], {
    cwd: repoRoot,
    encoding: "utf8",
  });

  assert.equal(result.status, 0, result.stderr);
  const pack = JSON.parse(result.stdout);
  assert.equal(pack.kind, "design-system-review-pack");
  assert.ok(pack.catalog.digest);
  assert.ok(pack.checks.some((check) => check.id === "button-review-hierarchy"));
});
