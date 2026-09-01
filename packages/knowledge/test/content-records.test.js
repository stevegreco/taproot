import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import { test } from "node:test";
import { parseRecord } from "../src/index.js";

const contentRoot = join(dirname(fileURLToPath(import.meta.url)), "../content");

const authoredRecords = [
  ["components/button.md", "component.button", "component"],
  ["patterns/action-hierarchy.md", "pattern.action-hierarchy", "pattern"],
  ["guidelines/button-implementation.md", "guideline.button-implementation", "guideline"],
  ["guidelines/button-review.md", "guideline.button-review", "guideline"],
  ["examples/action-hierarchy-settings.md", "example.action-hierarchy.settings", "example"],
];

test("parseRecord accepts every authored content record", () => {
  assert.equal(authoredRecords.length, 5);

  for (const [relative, id, type] of authoredRecords) {
    const sourcePath = `packages/knowledge/content/${relative}`;
    const record = parseRecord(readFileSync(join(contentRoot, relative), "utf8"), {
      sourcePath,
    });

    assert.equal(record.id, id);
    assert.equal(record.type, type);
    assert.equal(record.schemaVersion, 1);
    assert.ok(record.body.length > 0);

    if (id === "guideline.button-review") {
      assert.equal(record.checks.length, 8);
    }

    if (type === "example") {
      assert.equal(record.assets.length, 1);
      assert.equal(record.annotations.length, 3);
    }
  }
});
