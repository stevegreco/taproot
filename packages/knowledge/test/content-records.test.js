import { globSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import { test } from "node:test";
import { parseRecord } from "../src/index.js";

const contentRoot = join(dirname(fileURLToPath(import.meta.url)), "../content");
const authoredRecords = globSync("**/*.md", { cwd: contentRoot }).sort();

test("parseRecord accepts every authored content record", () => {
  assert.ok(authoredRecords.length > 0);

  for (const relative of authoredRecords) {
    const sourcePath = `packages/knowledge/content/${relative}`;
    const record = parseRecord(readFileSync(join(contentRoot, relative), "utf8"), {
      sourcePath,
    });

    assert.equal(record.schemaVersion, 1);
    assert.ok(record.body.length > 0);

    if (record.id === "guideline.button-review") {
      assert.equal(record.checks.length, 8);
    }

    if (record.type === "example") {
      assert.equal(record.assets.length, 1);
      assert.equal(record.annotations.length, 3);
    }
  }
});
