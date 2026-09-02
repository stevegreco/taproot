import assert from "node:assert/strict";
import { globSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { repoRoot } from "./helpers/workspace.js";

test("packages/components has no spec YAML", () => {
  const specsDir = globSync("specs/**", { cwd: join(repoRoot, "packages/components") });
  const specFiles = globSync("**/*.spec.yaml", { cwd: join(repoRoot, "packages/components") });

  assert.deepEqual(specsDir, []);
  assert.deepEqual(specFiles, []);
});
