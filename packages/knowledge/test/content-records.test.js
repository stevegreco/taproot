import { globSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import { test } from "vitest";
import { parseAuthoredRecord, parseRecord } from "../src/index.js";

const contentRoot = join(dirname(fileURLToPath(import.meta.url)), "../content");
const authoredMarkdown = globSync("**/*.md", { cwd: contentRoot }).sort();
const authoredYaml = globSync("**/*.spec.yaml", { cwd: contentRoot }).sort();

test("parseRecord accepts every authored Markdown content record", () => {
  assert.ok(authoredMarkdown.length > 0);

  for (const relative of authoredMarkdown) {
    const sourcePath = `packages/knowledge/content/${relative}`;
    const record = parseRecord(readFileSync(join(contentRoot, relative), "utf8"), {
      sourcePath,
    });

    assert.equal(record.schemaVersion, 1);
    assert.ok(record.body.length > 0);
    assert.notEqual(record.type, "component");

    if (record.id === "guideline.button-review") {
      assert.equal(record.checks.length, 8);
    }

    if (record.type === "guideline" && record.jobs.includes("review")) {
      assert.ok(Array.isArray(record.checks) && record.checks.length >= 1);
    }

    if (record.type === "example") {
      assert.ok(Array.isArray(record.assets) && record.assets.length >= 1);
      assert.ok(Array.isArray(record.annotations) && record.annotations.length >= 1);
    }
  }
});

test("parseAuthoredRecord accepts YAML component specs without bodies", () => {
  assert.ok(authoredYaml.length > 0);

  for (const relative of authoredYaml) {
    assert.match(relative, /^components\/([^/]+)\/\1\.spec\.yaml$/);

    const sourcePath = `packages/knowledge/content/${relative}`;
    const record = parseAuthoredRecord(readFileSync(join(contentRoot, relative), "utf8"), {
      sourcePath,
    });

    assert.equal(record.schemaVersion, 1);
    assert.equal(record.type, "component");
    assert.equal(Object.hasOwn(record, "body"), false);
    assert.ok(record.contract.usage.do.every((item) => typeof item.id === "string"));
  }
});
