import { COMPILED_SCHEMA_VERSION } from "../src/schema/compiled-extensions.js";
import { recordOnlyCompiledFields, stubRecord } from "./helpers/catalog.js";
import { portableContract } from "./helpers/workspace.js";
import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "vitest";
import yaml from "js-yaml";
import { buildCorpus } from "../src/compile/corpus.js";
import { projectBundle, writeBundle } from "../src/compile/bundle.js";
import { NARRATIVE_FRONTMATTER_KEYS, PROBLEM } from "../src/compile/tables.js";
import { findCompiledIssues } from "../src/schema/compiled-record.js";
import authoredSchema from "../src/schema/index.js";
import { createFsReader, repoRoot } from "./helpers/workspace.js";

const meta = {
  knowledgeVersion: "0.0.1",
  designSystemVersion: "0.0.5",
  buildTime: new Date(0),
  revision: "test",
};

test("projectBundle emits sorted records, hashed files, and narrative projection frontmatter", async () => {
  const corpus = await buildCorpus(
    createFsReader(repoRoot),
    [{ root: join(repoRoot, "packages/knowledge/content"), visibility: "public" }],
    { workspaceRoot: repoRoot },
  );
  const bundle = projectBundle(corpus, "public", meta);

  assert.equal(
    bundle.problems.filter((item) => item.severity === "error").length,
    0,
    JSON.stringify(bundle.problems, null, 2),
  );

  const ids = bundle.records.map((record) => record.id);
  assert.deepEqual(
    ids,
    [...ids].sort((left, right) => left.localeCompare(right)),
  );

  const files = bundle.manifest.content.files.map((entry) => entry.path);
  assert.deepEqual(
    files,
    [...files].sort((left, right) => left.localeCompare(right)),
  );
  assert.equal(files.includes("manifest.json"), false);
  assert.ok(files.includes("records.json"));
  assert.equal(files.includes("records.jsonl"), false);
  assert.ok(files.includes("search-index.json"));
  assert.ok(files.includes("schema/compiled-knowledge-record.json"));
  assert.ok(files.includes("schema/knowledge-record.json"));
  assert.equal(bundle.manifest.content.visibility, "public");

  const markdown = bundle.markdown.get("markdown/component.button.md");
  assert.match(markdown, /^---\n/);
  assert.match(markdown, /^id: component\.button$/m);
  assert.doesNotMatch(markdown, /^contract:/m);
  assert.doesNotMatch(markdown, /^backlinks:/m);
  assert.doesNotMatch(markdown, /^sources:/m);

  for (const record of bundle.records) {
    const path = `markdown/${record.id}.md`;
    const text = bundle.markdown.get(path);
    const { yamlText, data } = splitCompiledMarkdown(text);
    const keys = Object.keys(data).sort();
    assert.deepEqual(keys, [...NARRATIVE_FRONTMATTER_KEYS], path);
    assert.doesNotMatch(yamlText, /^(?:contract|host|checks):/m);
    for (const field of recordOnlyCompiledFields()) {
      assert.equal(Object.hasOwn(data, field), false, `${path} emitted ${field}`);
    }
    for (const key of NARRATIVE_FRONTMATTER_KEYS) {
      assert.deepEqual(data[key], record[key], `${path} ${key}`);
    }
  }

  const dir = await mkdtemp(join(tmpdir(), "knowledge-bundle-"));
  const summary = await writeBundle(dir, bundle);
  assert.equal(summary.digest, bundle.manifest.digest);
  assert.equal(summary.recordCount, bundle.records.length);

  const written = JSON.parse(await readFile(join(dir, "records.json"), "utf8"));
  assert.deepEqual(
    written.map((record) => record.id),
    ids,
  );
  assert.equal(written[0].compiledSchemaVersion, COMPILED_SCHEMA_VERSION);
  assert.ok(written.find((record) => record.id === "component.button").backlinks);

  const internal = projectBundle(corpus, "internal", meta);
  assert.equal(internal.manifest.content.visibility, "internal");
  assert.equal(internal.records.length, bundle.records.length);
  assert.notEqual(internal.manifest.digest, bundle.manifest.digest);
});

test("COMPILED_INVALID fires when emitted records fail the derived schema", () => {
  const problems = findCompiledIssues([{ id: "component.broken", title: "Broken" }]);
  assert.ok(problems.some((item) => item.code === PROBLEM.COMPILED_INVALID));
  assert.match(problems[0].message, /compiler bug/);
});

test("compiled schema keeps contract, tokenRef, and web on components", async () => {
  const web = {
    package: "fixture",
    export: "Fixture",
    defaultTagName: "ds-fixture",
    registration: { export: "defineFixture", supportsAliases: false },
    anatomy: {},
    parameters: {},
    events: {},
  };
  const component = stubRecord("component.fixture", {
    contract: portableContract(),
    tokenRef: { tier: "component", namespace: "component.fixture", description: "Fixture" },
    web,
  });
  assert.deepEqual(findCompiledIssues([component]), []);
  for (const type of authoredSchema.properties.type.enum) {
    // Supply valid field values so failures exercise ownership, not field shape.
    const base = { ...component, type };
    delete base.contract;
    delete base.tokenRef;
    delete base.tokens;
    delete base.web;
    assert.deepEqual(findCompiledIssues([base]), [], type);
    for (const [field, value] of [
      ["contract", component.contract],
      ["tokenRef", component.tokenRef],
      ["web", web],
    ]) {
      const issues = findCompiledIssues([{ ...base, [field]: value }]);
      assert.equal(issues.length === 0, type === "component", `${type}.${field}`);
    }
  }
});

test("compiled schema still requires visibility after authored defaults", () => {
  const almost = {
    id: "component.almost",
    schemaVersion: 1,
    type: "component",
    title: "Almost",
    summary: "Almost valid.",
    status: "draft",
    jobs: ["design"],
    tags: [],
    relations: {},
    sources: [{ kind: "authored", path: "content/almost.md", revision: "abc123456789abcd" }],
    body: "Body.",
    bodyOrigin: "authored",
    compiledSchemaVersion: COMPILED_SCHEMA_VERSION,
    backlinks: {},
  };
  const missing = findCompiledIssues([almost]);
  assert.ok(missing.some((item) => item.code === PROBLEM.COMPILED_INVALID));
  const complete = findCompiledIssues([{ ...almost, visibility: "public" }]);
  assert.equal(complete.length, 0);
});

test("compiled schema forbids host, which web replaced, on a component record", async () => {
  const corpus = await buildCorpus(
    createFsReader(repoRoot),
    [{ root: join(repoRoot, "packages/knowledge/content"), visibility: "public" }],
    { workspaceRoot: repoRoot },
  );
  const button = corpus.records.get("component.button");
  const problems = findCompiledIssues([{ ...button, host: button.web }]);
  assert.ok(problems.some((item) => item.code === PROBLEM.COMPILED_INVALID));
});

function splitCompiledMarkdown(markdown) {
  assert.match(markdown, /^---\n/);
  const end = markdown.indexOf("\n---\n", 4);
  assert.notEqual(end, -1);
  const yamlText = markdown.slice(4, end);
  return { yamlText, data: yaml.load(yamlText) };
}
