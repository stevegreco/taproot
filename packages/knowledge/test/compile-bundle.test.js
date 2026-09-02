import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { buildCorpus } from "../src/compile/corpus.js";
import { projectBundle, writeBundle } from "../src/compile/bundle.js";
import { PROBLEM } from "../src/compile/tables.js";
import { findCompiledIssues, deriveCompiledSchema } from "../src/schema/compiled-record.js";
import authoredSchema from "../src/schema/index.js";
import { createFsReader, repoRoot } from "./helpers/workspace.js";

const meta = {
  knowledgeVersion: "0.0.1",
  designSystemVersion: "0.0.5",
  buildTime: new Date(0),
  revision: "test",
};

test("projectBundle emits sorted records, hashed files, and reduced markdown frontmatter", async () => {
  const corpus = await buildCorpus(createFsReader(repoRoot), [
    { root: join(repoRoot, "packages/knowledge/content"), visibility: "public" },
  ]);
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

  const dir = await mkdtemp(join(tmpdir(), "knowledge-bundle-"));
  const summary = await writeBundle(dir, bundle);
  assert.equal(summary.digest, bundle.manifest.digest);
  assert.equal(summary.recordCount, bundle.records.length);

  const written = JSON.parse(await readFile(join(dir, "records.json"), "utf8"));
  assert.deepEqual(
    written.map((record) => record.id),
    ids,
  );
  assert.equal(written[0].compiledSchemaVersion, 2);
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

test("compiled schema forbids host on a component record", async () => {
  const corpus = await buildCorpus(createFsReader(repoRoot), [
    { root: join(repoRoot, "packages/knowledge/content"), visibility: "public" },
  ]);
  const button = corpus.records.get("component.button");
  const binding = corpus.records.get("binding.button.web-component");
  const compiledSchema = deriveCompiledSchema(authoredSchema);
  const problems = findCompiledIssues(compiledSchema, [
    { ...button, host: binding.host },
  ]);
  assert.ok(problems.some((item) => item.code === PROBLEM.COMPILED_INVALID));
});
