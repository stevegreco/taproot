import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { compile } from "../src/compile/index.js";
import { repoRoot } from "./helpers/workspace.js";

test("compile is byte-identical across runs with a fixed buildTime", async () => {
  const options = {
    workspaceRoot: repoRoot,
    outDir: await mkdtemp(join(tmpdir(), "knowledge-determinism-")),
    buildTime: new Date(0),
    revision: "fixed-revision",
  };

  const first = await compile(options);
  const firstRecords = await readFile(join(options.outDir, "public/records.json"));

  const second = await compile(options);
  const secondRecords = await readFile(join(options.outDir, "public/records.json"));

  assert.deepEqual(
    first.bundles.map((bundle) => bundle.digest),
    second.bundles.map((bundle) => bundle.digest),
  );
  assert.deepEqual(firstRecords, secondRecords);

  const manifest = JSON.parse(await readFile(join(options.outDir, "public/manifest.json"), "utf8"));
  assert.equal(manifest.build.time, new Date(0).toISOString());
  assert.equal(manifest.digest.startsWith("sha256:"), true);
  assert.equal(
    manifest.content.files.some((entry) => entry.path === "manifest.json"),
    false,
  );
});
