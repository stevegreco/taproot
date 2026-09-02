import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { compile } from "../src/compile/index.js";
import { buildCorpus } from "../src/compile/corpus.js";
import { projectBundle } from "../src/compile/bundle.js";
import { PROBLEM } from "../src/compile/tables.js";
import { createMemoryReader, recordMarkdown, repoRoot } from "./helpers/workspace.js";

const meta = {
  knowledgeVersion: "0.0.1",
  designSystemVersion: "0.0.5",
  buildTime: new Date(0),
  revision: "test",
};

test("public bundle drops internal inbound edges", async () => {
  const outDir = await mkdtemp(join(tmpdir(), "knowledge-visibility-"));
  const result = await compile({
    workspaceRoot: repoRoot,
    outDir,
    internalContent: {
      root: join(repoRoot, "packages/knowledge/test/fixtures/internal-content"),
      visibility: "internal",
    },
    buildTime: new Date(0),
  });

  const publicRecords = JSON.parse(await readFile(join(outDir, "public/records.json"), "utf8"));
  const internalRecords = JSON.parse(await readFile(join(outDir, "internal/records.json"), "utf8"));

  assert.ok(publicRecords.every((record) => record.visibility === "public"));
  assert.equal(
    publicRecords.some((record) => JSON.stringify(record).includes("internal.uses-button")),
    false,
  );

  const publicButton = publicRecords.find((record) => record.id === "component.button");
  assert.equal((publicButton.backlinks.usedBy ?? []).includes("internal.uses-button"), false);

  const internalButton = internalRecords.find((record) => record.id === "component.button");
  assert.ok((internalButton.backlinks.usedBy ?? []).includes("internal.uses-button"));
  assert.ok(internalRecords.some((record) => record.id === "internal.uses-button"));
  assert.equal(result.bundles[0].visibility, "public");
  assert.ok(result.bundles[0].recordCount < result.bundles[1].recordCount);
});

test("VISIBILITY_LEAK fires when a public record references an internal record", async () => {
  const reader = createMemoryReader({
    "content/leaky.md": recordMarkdown({
      id: "component.leaky",
      relations: { uses: ["internal.secret"] },
      sources: [{ kind: "authored", path: "content/leaky.md" }],
    }),
    "internal/secret.md": recordMarkdown({
      id: "internal.secret",
      visibility: "internal",
      sources: [{ kind: "authored", path: "internal/secret.md" }],
    }),
  });

  const corpus = await buildCorpus(reader, [
    { root: "content", visibility: "public" },
    { root: "internal", visibility: "internal" },
  ]);
  const bundle = projectBundle(corpus, "public", meta);
  assert.ok(bundle.problems.some((item) => item.code === PROBLEM.VISIBILITY_LEAK));
});
