import assert from "node:assert/strict";
import { access, chmod, mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { compile, KnowledgeCompileError } from "../src/compile/index.js";
import { buildCorpus } from "../src/compile/corpus.js";
import { createWorkspaceReader } from "../src/compile/reader.js";
import { PROBLEM } from "../src/compile/tables.js";
import { codes, recordMarkdown } from "./helpers/workspace.js";

async function stubWorkspace() {
  const workspace = await mkdtemp(join(tmpdir(), "knowledge-io-"));
  await mkdir(join(workspace, "packages/knowledge"), { recursive: true });
  await mkdir(join(workspace, "packages/tokens"), { recursive: true });
  await writeFile(
    join(workspace, "packages/knowledge/package.json"),
    JSON.stringify({ version: "0.0.0" }),
  );
  await writeFile(
    join(workspace, "packages/tokens/package.json"),
    JSON.stringify({ version: "0.0.0" }),
  );
  return workspace;
}

function isCompileError(error) {
  return error instanceof KnowledgeCompileError;
}

test("compile fails when the public content root is missing", async () => {
  const workspace = await stubWorkspace();
  const outDir = join(workspace, "dist");

  await assert.rejects(
    () => compile({ workspaceRoot: workspace, outDir, revision: "test" }),
    (error) => {
      assert.ok(isCompileError(error));
      const problems = error.problems.filter((item) => item.code === PROBLEM.CORPUS_ROOT_UNREADABLE);
      assert.equal(problems.length, 1);
      assert.match(problems[0].message, /ENOENT/);
      assert.match(problems[0].path ?? "", /packages\/knowledge\/content/);
      return true;
    },
  );
});

test("compile fails when a configured internal content root is missing", async () => {
  const workspace = await stubWorkspace();
  await mkdir(join(workspace, "packages/knowledge/content"), { recursive: true });
  const missing = join(workspace, "missing-internal");
  const outDir = join(workspace, "dist");

  await assert.rejects(
    () =>
      compile({
        workspaceRoot: workspace,
        outDir,
        revision: "test",
        internalContent: { root: missing, visibility: "internal" },
      }),
    (error) => {
      assert.ok(isCompileError(error));
      const problems = error.problems.filter((item) => item.code === PROBLEM.CORPUS_ROOT_UNREADABLE);
      assert.equal(problems.length, 1);
      assert.match(problems[0].message, /ENOENT/);
      assert.equal(problems[0].path, missing);
      return true;
    },
  );
});

test("compile accepts an existing empty public content root", async () => {
  const workspace = await stubWorkspace();
  await mkdir(join(workspace, "packages/knowledge/content"), { recursive: true });
  const outDir = join(workspace, "dist");

  const result = await compile({ workspaceRoot: workspace, outDir, revision: "test" });
  assert.equal(result.bundles[0].recordCount, 0);
  assert.equal(result.bundles[1].recordCount, 0);
  assert.equal(result.bundles[0].dir, join(outDir, "public"));
  assert.equal(result.bundles[1].dir, join(outDir, "internal"));
  await access(join(result.bundles[0].dir, "manifest.json"));
  await access(join(result.bundles[1].dir, "manifest.json"));
});

test("compile names the source file when a record is invalid", async () => {
  const workspace = await stubWorkspace();
  const repoPath = "packages/knowledge/content/deep/nested/bad.md";
  const recordPath = join(workspace, repoPath);
  await mkdir(dirname(recordPath), { recursive: true });
  await writeFile(
    recordPath,
    recordMarkdown({
      id: "component.bad",
      title: "",
      sources: [{ kind: "authored", path: repoPath }],
    }),
  );

  await assert.rejects(
    () => compile({ workspaceRoot: workspace, outDir: join(workspace, "dist"), revision: "test" }),
    (error) => {
      assert.ok(isCompileError(error));
      assert.match(error.message, /packages\/knowledge\/content\/deep\/nested\/bad\.md/);
      assert.match(error.message, /\/title/);
      const problems = error.problems.filter((item) => item.code === PROBLEM.RECORD_INVALID);
      assert.equal(problems.length, 1);
      return true;
    },
  );
});

test("CORPUS_ROOT_UNREADABLE fires when a configured root is not readable", async () => {
  const workspace = await mkdtemp(join(tmpdir(), "knowledge-root-perm-"));
  const content = join(workspace, "content");
  await mkdir(content);

  try {
    await chmod(content, 0);
    const corpus = await buildCorpus(
      createWorkspaceReader(workspace),
      [{ root: content, visibility: "public" }],
      { workspaceRoot: workspace },
    );
    const problems = codes(corpus, PROBLEM.CORPUS_ROOT_UNREADABLE);
    assert.equal(problems.length, 1);
    assert.match(problems[0].message, /EACCES/);
    assert.equal(problems[0].path, content);
    assert.equal(corpus.records.size, 0);
  } finally {
    await chmod(content, 0o700);
  }
});

test("RECORD_UNREADABLE fires when a listed record file is not readable", async () => {
  const workspace = await mkdtemp(join(tmpdir(), "knowledge-record-perm-"));
  const content = join(workspace, "content");
  const recordPath = join(content, "denied.md");
  await mkdir(content);
  await writeFile(
    recordPath,
    recordMarkdown({
      id: "component.denied",
      sources: [{ kind: "authored", path: "content/denied.md" }],
    }),
  );

  try {
    await chmod(recordPath, 0);
    const corpus = await buildCorpus(
      createWorkspaceReader(workspace),
      [{ root: content, visibility: "public" }],
      { workspaceRoot: workspace },
    );
    const problems = codes(corpus, PROBLEM.RECORD_UNREADABLE);
    assert.equal(problems.length, 1);
    assert.equal(problems[0].path, "content/denied.md");
    assert.match(problems[0].message, /EACCES/);
    assert.equal(corpus.records.size, 0);
  } finally {
    await chmod(recordPath, 0o644);
  }
});
