import assert from "node:assert/strict";
import { mkdir, mkdtemp, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "vitest";
import { PROBLEM } from "../src/compile/tables.js";
import { buildCorpus } from "../src/compile/corpus.js";
import {
  inspectRepoPath,
  isInsidePrefix,
  isLexicallyAllowed,
  isReallyAllowed,
  safeJoinWorkspace,
} from "../src/compile/paths.js";
import { codes, createFsReader, recordMarkdown, tinySvg } from "./helpers/workspace.js";

test("inspectRepoPath rejects absolute, empty, and traversal segments", () => {
  assert.equal(inspectRepoPath("packages/tokens/src/file.json").ok, true);
  assert.equal(inspectRepoPath("../secret.svg").reason, "traversal");
  assert.equal(inspectRepoPath("content/../secret.svg").reason, "traversal");
  assert.equal(inspectRepoPath("content/./file.svg").reason, "traversal");
  assert.equal(inspectRepoPath("/etc/passwd").reason, "absolute");
  assert.equal(inspectRepoPath("").reason, "empty");
});

test("isLexicallyAllowed keeps records inside their authored root or packages/tokens", () => {
  const publicPrefixes = ["content", "packages/tokens"];
  assert.equal(isLexicallyAllowed("content/examples/frame.svg", publicPrefixes).ok, true);
  assert.equal(
    isLexicallyAllowed("packages/tokens/src/tokens/components/button.tokens.json", publicPrefixes)
      .ok,
    true,
  );
  assert.equal(isLexicallyAllowed("internal/secret.svg", publicPrefixes).reason, "outside-root");
  assert.equal(
    isLexicallyAllowed("packages/other/file.json", publicPrefixes).reason,
    "outside-root",
  );

  const internalPrefixes = ["internal", "packages/tokens"];
  assert.equal(isLexicallyAllowed("internal/shot.svg", internalPrefixes).ok, true);
  assert.equal(isLexicallyAllowed("content/public.svg", internalPrefixes).reason, "outside-root");
});

test("isInsidePrefix does not treat a sibling prefix as nested", () => {
  assert.equal(isInsidePrefix("content", "content/file.md"), true);
  assert.equal(isInsidePrefix("content", "content-extra/file.md"), false);
});

test("safeJoinWorkspace refuses paths that leave the workspace", () => {
  const root = "/tmp/knowledge-workspace";
  assert.equal(safeJoinWorkspace(root, "content/file.md"), join(root, "content/file.md"));
  assert.equal(safeJoinWorkspace(root, "../secret.md"), null);
  assert.equal(safeJoinWorkspace(root, "/etc/passwd"), null);
});

test("isReallyAllowed rejects a symlink that leaves allowed roots", async () => {
  const workspace = await mkdtemp(join(tmpdir(), "knowledge-symlink-"));
  await mkdir(join(workspace, "content"), { recursive: true });
  await writeFile(join(workspace, "outside.svg"), tinySvg);
  await symlink(join(workspace, "outside.svg"), join(workspace, "content/escape.svg"));

  const prefixes = ["content", "packages/tokens"];
  const check = await isReallyAllowed(workspace, "content/escape.svg", prefixes);
  assert.equal(check.ok, false);
  assert.equal(check.reason, "symlink");
});

test("PATH_OUTSIDE_ROOT fires when a symlink asset leaves the public root", async () => {
  const workspace = await mkdtemp(join(tmpdir(), "knowledge-symlink-corpus-"));
  await mkdir(join(workspace, "content"), { recursive: true });
  await writeFile(join(workspace, "outside.svg"), tinySvg);
  await symlink(join(workspace, "outside.svg"), join(workspace, "content/escape.svg"));
  await writeFile(
    join(workspace, "content/leaky.md"),
    recordMarkdown(
      {
        id: "example.symlink",
        type: "example",
        sources: [{ kind: "authored", path: "content/leaky.md" }],
        assets: [
          {
            id: "example.symlink.frame",
            path: "content/escape.svg",
            mediaType: "image/svg+xml",
            width: 10,
            height: 10,
            alt: "Escapes through a symlink.",
          },
        ],
        annotations: [{ id: "note", label: "Note", description: "Must not publish." }],
      },
      "A leaked image.",
    ),
  );

  const corpus = await buildCorpus(
    createFsReader(workspace),
    [{ root: join(workspace, "content"), visibility: "public" }],
    { workspaceRoot: workspace },
  );
  const problems = codes(corpus, PROBLEM.PATH_OUTSIDE_ROOT);
  assert.equal(problems.length, 1);
  assert.equal(problems[0].recordId, "example.symlink");
  assert.equal(problems[0].path, "content/escape.svg");
  assert.match(problems[0].message, /resolves outside allowed roots/);
});
