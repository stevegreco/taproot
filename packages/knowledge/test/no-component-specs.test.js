import assert from "node:assert/strict";
import { globSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { repoRoot } from "./helpers/workspace.js";

test("packages/components has no spec YAML", () => {
  const specsDir = globSync("specs/**", { cwd: join(repoRoot, "packages/components") });
  const specFiles = globSync("**/*.spec.yaml", { cwd: join(repoRoot, "packages/components") });

  assert.deepEqual(specsDir, []);
  assert.deepEqual(specFiles, []);
});

test("knowledge compile does not import packages/components", () => {
  const files = globSync("src/**/*.js", { cwd: join(repoRoot, "packages/knowledge") });
  assert.ok(files.length > 0);
  for (const file of files) {
    const text = readFileSync(join(repoRoot, "packages/knowledge", file), "utf8");
    assert.doesNotMatch(text, /@stevegreco\/design-system-components/);
    assert.doesNotMatch(text, /packages\/components\//);
  }
});
