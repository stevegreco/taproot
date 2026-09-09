import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { access, chmod, mkdir, mkdtemp, unlink, writeFile } from "node:fs/promises";
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

function ownerFile(pid) {
  return `${JSON.stringify({ pid, startedAt: new Date().toISOString() })}\n`;
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
  assert.equal(result.bundles.length, 1);
  assert.equal(result.bundles[0].recordCount, 0);
  assert.equal(result.bundles[0].dir, join(outDir, "public"));
  await access(join(result.bundles[0].dir, "manifest.json"));
  await access(join(result.bundles[0].dir, "records.json"));
  await access(join(result.bundles[0].dir, "search-index.json"));
  await assert.rejects(() => access(join(result.bundles[0].dir, "records.jsonl")), {
    code: "ENOENT",
  });
  await assert.rejects(() => access(join(outDir, "internal")), { code: "ENOENT" });
});

test("a public-only compile does not leave a previous internal bundle", async () => {
  const workspace = await stubWorkspace();
  await mkdir(join(workspace, "packages/knowledge/content"), { recursive: true });
  const internalRoot = join(workspace, "internal-content");
  await mkdir(internalRoot, { recursive: true });
  await writeFile(
    join(internalRoot, "secret.md"),
    recordMarkdown({
      id: "internal.secret",
      visibility: "internal",
      sources: [{ kind: "authored", path: "internal-content/secret.md" }],
    }),
  );
  const outDir = join(workspace, "dist");

  await compile({
    workspaceRoot: workspace,
    outDir,
    revision: "test",
    internalContent: { root: internalRoot, visibility: "internal" },
  });
  await access(join(outDir, "internal/manifest.json"));

  const publicOnly = await compile({ workspaceRoot: workspace, outDir, revision: "test" });
  assert.equal(publicOnly.bundles.length, 1);
  await access(join(outDir, "public/manifest.json"));
  await assert.rejects(() => access(join(outDir, "internal")), { code: "ENOENT" });
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

test("compile fails with a coded error when the compile lock is held", async () => {
  const workspace = await stubWorkspace();
  await mkdir(join(workspace, "packages/knowledge/content"), { recursive: true });
  const outDir = join(workspace, "dist");
  const lockDir = `${outDir}.lock`;
  await mkdir(lockDir);
  await writeFile(join(lockDir, "owner.json"), ownerFile(process.pid));

  await assert.rejects(
    () => compile({ workspaceRoot: workspace, outDir, revision: "test" }),
    (error) => {
      assert.ok(isCompileError(error));
      const problems = error.problems.filter((item) => item.code === PROBLEM.COMPILE_LOCK_HELD);
      assert.equal(problems.length, 1);
      assert.equal(problems[0].path, lockDir);
      assert.match(error.message, /rm -rf/);
      assert.ok(error.message.includes(lockDir));
      return true;
    },
  );

  await access(lockDir);
});

test("compile steals a lock whose owner process is gone", async () => {
  const workspace = await stubWorkspace();
  await mkdir(join(workspace, "packages/knowledge/content"), { recursive: true });
  const outDir = join(workspace, "dist");
  const lockDir = `${outDir}.lock`;
  const child = spawn(process.execPath, ["-e", "setInterval(() => {}, 1000)"], {
    stdio: "ignore",
  });
  const pid = child.pid;
  child.kill("SIGKILL");
  await once(child, "exit");
  await mkdir(lockDir);
  await writeFile(join(lockDir, "owner.json"), ownerFile(pid));

  const result = await compile({ workspaceRoot: workspace, outDir, revision: "test" });
  assert.equal(result.bundles[0].recordCount, 0);
  await assert.rejects(() => access(lockDir));
});

test("compile steals a leftover lock directory with no owner file", async () => {
  const workspace = await stubWorkspace();
  await mkdir(join(workspace, "packages/knowledge/content"), { recursive: true });
  const outDir = join(workspace, "dist");
  const lockDir = `${outDir}.lock`;
  await mkdir(lockDir);

  const result = await compile({ workspaceRoot: workspace, outDir, revision: "test" });
  assert.equal(result.bundles[0].recordCount, 0);
  await assert.rejects(() => access(lockDir));
});

test("compile names the package.json path when the version cannot be read", async () => {
  const workspace = await stubWorkspace();
  await mkdir(join(workspace, "packages/knowledge/content"), { recursive: true });
  const outDir = join(workspace, "dist");
  const packageJsonPath = join(workspace, "packages/tokens/package.json");
  await unlink(packageJsonPath);

  await assert.rejects(
    () => compile({ workspaceRoot: workspace, outDir, revision: "test" }),
    (error) => {
      assert.ok(isCompileError(error));
      const problems = error.problems.filter(
        (item) => item.code === PROBLEM.COMPILE_PACKAGE_UNREADABLE,
      );
      assert.equal(problems.length, 1);
      assert.equal(problems[0].path, packageJsonPath);
      assert.match(error.message, /ENOENT/);
      return true;
    },
  );

  await assert.rejects(() => access(`${outDir}.lock`));
});
