import assert from "node:assert/strict";
import { test } from "node:test";
import { KnowledgeRecordError, parseRecord } from "../src/index.js";

const validComponent = `---
id: component.test-button
schemaVersion: 1
type: component
title: Test button
summary: Triggers a test action.
status: draft
visibility: public
jobs:
  - implement
tags:
  - button
relations: {}
sources:
  - kind: authored
    path: packages/knowledge/content/components/test-button.md
---

Use this component to trigger a test action.
`;

test("parseRecord returns validated metadata and body", () => {
  const record = parseRecord(validComponent, { sourcePath: "test-button.md" });

  assert.equal(record.id, "component.test-button");
  assert.equal(record.type, "component");
  assert.equal(record.body, "Use this component to trigger a test action.");
});

test("parseRecord rejects an incompatible schemaVersion with a useful field path", () => {
  const markdown = validComponent.replace("schemaVersion: 1", "schemaVersion: 2");

  assert.throws(
    () => parseRecord(markdown, { sourcePath: "records/test-button.md" }),
    (error) => {
      assert.equal(error instanceof KnowledgeRecordError, true);
      assert.equal(error.sourcePath, "records/test-button.md");
      assert.match(error.message, /records\/test-button\.md/);
      assert.match(error.message, /\/schemaVersion/);
      assert.ok(
        error.issues.some((issue) => issue.path === "/schemaVersion"),
        "expected an issue pointing at /schemaVersion",
      );
      return true;
    },
  );
});

function assertIssuePath(markdown, sourcePath, expectedPath) {
  assert.throws(
    () => parseRecord(markdown, { sourcePath }),
    (error) => {
      assert.equal(error instanceof KnowledgeRecordError, true);
      assert.equal(error.sourcePath, sourcePath);
      assert.ok(
        error.issues.some((issue) => issue.path === expectedPath),
        `expected an issue pointing at ${expectedPath}, got ${JSON.stringify(error.issues)}`,
      );
      return true;
    },
  );
}

test("parseRecord rejects unknown fields at every object level", () => {
  const rootUnknown = validComponent.replace("\n---\n\n", "\nspurious: true\n---\n\n");
  assertIssuePath(rootUnknown, "test-button.md", "/spurious");

  const nestedUnknown = validComponent.replace(
    "relations: {}",
    `relations:
  unexpected:
    - component.button`,
  );
  assertIssuePath(nestedUnknown, "test-button.md", "/relations/unexpected");

  const sourceUnknown = validComponent.replace(
    "    path: packages/knowledge/content/components/test-button.md",
    `    path: packages/knowledge/content/components/test-button.md
    extra: true`,
  );
  assertIssuePath(sourceUnknown, "test-button.md", "/sources/0/extra");
});

test("parseRecord rejects generated provenance in authored Markdown", () => {
  const markdown = validComponent.replace(
    `sources:
  - kind: authored
    path: packages/knowledge/content/components/test-button.md`,
    `sources:
  - kind: authored
    path: packages/knowledge/content/components/test-button.md
  - kind: generated
    path: dist/public/records.json`,
  );

  assertIssuePath(markdown, "test-button.md", "/sources/1/kind");
});

test("parseRecord accepts an authored source that is not first", () => {
  const markdown = validComponent.replace(
    `sources:
  - kind: authored
    path: packages/knowledge/content/components/test-button.md`,
    `sources:
  - kind: component-spec
    path: packages/components/specs/button.spec.yaml
  - kind: authored
    path: packages/knowledge/content/components/test-button.md`,
  );

  const record = parseRecord(markdown, { sourcePath: "test-button.md" });
  assert.equal(record.sources[0].kind, "component-spec");
  assert.equal(record.sources[1].kind, "authored");
});

test("parseRecord requires at least one authored source", () => {
  const markdown = validComponent.replace(
    `sources:
  - kind: authored
    path: packages/knowledge/content/components/test-button.md`,
    `sources:
  - kind: adr
    path: packages/tokens/docs/adr/0003-token-tier-consumption.md`,
  );

  assert.throws(
    () => parseRecord(markdown, { sourcePath: "test-button.md" }),
    (error) => {
      assert.equal(error instanceof KnowledgeRecordError, true);
      assert.ok(
        error.issues.some((issue) => issue.path === "/sources" && issue.keyword === "contains"),
        `expected a contains issue at /sources, got ${JSON.stringify(error.issues)}`,
      );
      assert.equal(
        error.issues.some((issue) => issue.path === "/sources/0/kind"),
        false,
        "contains evaluation must not report a legal source kind as invalid",
      );
      return true;
    },
  );
});

test("parseRecord rejects a frontmatter body key", () => {
  const markdown = validComponent.replace("\n---\n\n", "\nbody: stolen from YAML\n---\n\n");
  assertIssuePath(markdown, "test-button.md", "/body");
});

test("parseRecord rejects missing frontmatter with a record-level path", () => {
  assert.throws(
    () => parseRecord("Just markdown.\n", { sourcePath: "notes.md" }),
    (error) => {
      assert.equal(error instanceof KnowledgeRecordError, true);
      assert.equal(error.sourcePath, "notes.md");
      assert.equal(error.issues.length, 1);
      assert.equal(error.issues[0].path, "");
      return true;
    },
  );
});

test("parseRecord rejects malformed YAML frontmatter with a record-level path", () => {
  assert.throws(
    () => parseRecord("---\nid: [unterminated\n---\n\nBody.\n", { sourcePath: "notes.md" }),
    (error) => {
      assert.equal(error instanceof KnowledgeRecordError, true);
      assert.equal(error.sourcePath, "notes.md");
      assert.equal(error.issues.length, 1);
      assert.equal(error.issues[0].path, "");
      return true;
    },
  );
});
