import assert from "node:assert/strict";
import { join } from "node:path";
import { test } from "node:test";
import { KnowledgeRecordError, parseRecord } from "../src/index.js";
import { projectBundle } from "../src/compile/bundle.js";
import { buildCorpus } from "../src/compile/corpus.js";
import {
  COMPILED_FIELD_VIEW,
  findMarkdownFieldClaims,
} from "../src/compile/tables.js";
import { createFsReader, repoRoot } from "./helpers/workspace.js";

const meta = {
  knowledgeVersion: "0.0.1",
  designSystemVersion: "0.0.5",
  buildTime: new Date(0),
  revision: "test",
};

test("every compiled public record key is in COMPILED_FIELD_VIEW", async () => {
  const bundle = await publicBundle();
  for (const record of bundle.records) {
    for (const key of Object.keys(record)) {
      assert.equal(
        Object.hasOwn(COMPILED_FIELD_VIEW, key),
        true,
        `${record.id} has unclassified compiled field ${key}`,
      );
    }
  }
});

test("findMarkdownFieldClaims is empty on compiled public bodies", async () => {
  const bundle = await publicBundle();
  for (const record of bundle.records) {
    assert.deepEqual(
      findMarkdownFieldClaims(record.body),
      [],
      `${record.id}: ${JSON.stringify(findMarkdownFieldClaims(record.body))}`,
    );
  }
});

test("findMarkdownFieldClaims flags a markdown path as a field owner and ignores narrative contract language", () => {
  const claims = findMarkdownFieldClaims(
    "see markdown/component.button.md for the contract",
  );
  assert.equal(claims.length > 0, true);
  assert.equal(
    claims.some((claim) => claim.pattern === "markdown-path-field-owner"),
    true,
  );

  assert.deepEqual(
    findMarkdownFieldClaims("The contract requires a visible label"),
    [],
  );
  assert.deepEqual(
    findMarkdownFieldClaims(
      "See markdown/binding.button.web-component.md. Button stays host-neutral.",
    ),
    [],
  );
  assert.deepEqual(
    findMarkdownFieldClaims("ADR 0003 deleted spec.button. Use get(\"component.button\")."),
    [],
  );
  const specClaim = findMarkdownFieldClaims("see spec.button for the contract");
  assert.equal(
    specClaim.some((claim) => claim.pattern === "spec-id-contract-home"),
    true,
  );
});

test("parseRecord on compiled Button Markdown throws", async () => {
  const bundle = await publicBundle();
  const markdown = bundle.markdown.get("markdown/component.button.md");
  assert.equal(typeof markdown, "string");
  assert.throws(
    () => parseRecord(markdown, { sourcePath: "markdown/component.button.md" }),
    (error) => {
      assert.equal(error instanceof KnowledgeRecordError, true);
      assert.match(error.message, /narrative projection/);
      return true;
    },
  );

  const authoredPath = "packages/knowledge/content/components/button.md";
  const parsed = parseRecord(markdown, { sourcePath: authoredPath });
  assert.equal(parsed.id, "component.button");
  assert.equal(parsed.visibility, "public");
  assert.equal(Object.hasOwn(parsed, "contract"), false);
  assert.deepEqual(parsed.sources, [{ kind: "authored", path: authoredPath }]);
});

async function publicBundle() {
  const corpus = await buildCorpus(
    createFsReader(repoRoot),
    [{ root: join(repoRoot, "packages/knowledge/content"), visibility: "public" }],
    { workspaceRoot: repoRoot },
  );
  return projectBundle(corpus, "public", meta);
}
