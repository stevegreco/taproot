import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import yaml from "js-yaml";
import { buildCorpus } from "../src/compile/corpus.js";
import { projectBundle, writeBundle } from "../src/compile/bundle.js";
import {
  NARRATIVE_FRONTMATTER_KEYS,
  PROBLEM,
  RECORD_ONLY_FIELDS,
  isNarrativeFrontmatterKeys,
} from "../src/compile/tables.js";
import { findCompiledIssues, deriveCompiledSchema } from "../src/schema/compiled-record.js";
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
  assert.deepEqual(ids, [...ids].sort((left, right) => left.localeCompare(right)));

  const files = bundle.manifest.content.files.map((entry) => entry.path);
  assert.deepEqual(files, [...files].sort((left, right) => left.localeCompare(right)));
  assert.equal(files.includes("manifest.json"), false);
  assert.ok(files.includes("records.json"));
  assert.ok(files.includes("schema/compiled-knowledge-record.json"));

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
    assert.equal(isNarrativeFrontmatterKeys(keys), true, path);
    assert.doesNotMatch(yamlText, /^(?:contract|host|checks):/m);
    for (const field of RECORD_ONLY_FIELDS) {
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
  assert.equal(written[0].compiledSchemaVersion, 3);
  assert.ok(written.find((record) => record.id === "component.button").backlinks);
});

test("COMPILED_INVALID fires when emitted records fail the derived schema", () => {
  const compiledSchema = deriveCompiledSchema(authoredSchema);
  const problems = findCompiledIssues(compiledSchema, [
    { id: "component.broken", title: "Broken" },
  ]);
  assert.ok(problems.some((item) => item.code === PROBLEM.COMPILED_INVALID));
  assert.match(problems[0].message, /compiler bug/);
});

test("compiled schema still requires visibility after authored defaults", () => {
  const compiledSchema = deriveCompiledSchema(authoredSchema);
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
    compiledSchemaVersion: 3,
    backlinks: {},
  };
  const missing = findCompiledIssues(compiledSchema, [almost]);
  assert.ok(missing.some((item) => item.code === PROBLEM.COMPILED_INVALID));
  const complete = findCompiledIssues(compiledSchema, [{ ...almost, visibility: "public" }]);
  assert.equal(complete.length, 0);
});

test("compiled schema forbids contract on a binding record", async () => {
  const corpus = await buildCorpus(
    createFsReader(repoRoot),
    [{ root: join(repoRoot, "packages/knowledge/content"), visibility: "public" }],
    { workspaceRoot: repoRoot },
  );
  const button = corpus.records.get("component.button");
  const binding = corpus.records.get("binding.button.web-component");
  const compiledSchema = deriveCompiledSchema(authoredSchema);
  const problems = findCompiledIssues(compiledSchema, [
    { ...binding, contract: button.contract },
  ]);
  assert.ok(problems.some((item) => item.code === PROBLEM.COMPILED_INVALID));
});

test("compiled schema forbids host on a component record", async () => {
  const corpus = await buildCorpus(
    createFsReader(repoRoot),
    [{ root: join(repoRoot, "packages/knowledge/content"), visibility: "public" }],
    { workspaceRoot: repoRoot },
  );
  const button = corpus.records.get("component.button");
  const binding = corpus.records.get("binding.button.web-component");
  const compiledSchema = deriveCompiledSchema(authoredSchema);
  const problems = findCompiledIssues(compiledSchema, [
    { ...button, host: binding.host },
  ]);
  assert.ok(problems.some((item) => item.code === PROBLEM.COMPILED_INVALID));
});

function splitCompiledMarkdown(markdown) {
  assert.match(markdown, /^---\n/);
  const end = markdown.indexOf("\n---\n", 4);
  assert.notEqual(end, -1);
  const yamlText = markdown.slice(4, end);
  return { yamlText, data: yaml.load(yamlText) };
}
