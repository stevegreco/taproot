import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { mkdir, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { buildCorpus } from "./corpus.js";
import { projectBundle, writeBundle } from "./bundle.js";
import { createWorkspaceReader } from "./reader.js";
import { PROBLEM, problem } from "./tables.js";

export { createWorkspaceReader } from "./reader.js";

/**
 * @typedef {"public"|"internal"} Visibility
 *
 * @typedef {object} AuthoredRoot
 * @property {string} root
 * @property {Visibility} visibility
 *
 * @typedef {object} WorkspaceReader
 * @property {(root: AuthoredRoot) => Promise<readonly string[]>} listRecords
 *   Rejects when the configured root or a nested directory cannot be read.
 * @property {(repoPath: string) => Promise<string|null>} readText
 *   Resolves null when the file is missing. Rejects on other read failures.
 * @property {(repoPath: string) => Promise<Uint8Array|null>} readBytes
 */

export class KnowledgeCompileError extends Error {
  /**
   * @param {readonly import("./tables.js").Problem[]} problems
   */
  constructor(problems) {
    const details = problems
      .map((item) => `  ${item.code}  ${item.path ?? item.recordId ?? ""}  ${item.message}`)
      .join("\n");
    super(`knowledge compile failed\n${details}`);
    this.name = "KnowledgeCompileError";
    this.problems = Object.freeze(problems);
  }
}

export async function compile(options) {
  const workspaceRoot = options.workspaceRoot;
  const outDir = options.outDir ?? join(workspaceRoot, "packages/knowledge/dist");
  const lockDir = `${outDir}.lock`;
  await acquireCompileLock(lockDir);

  let staging;
  try {
    await removeOrphanStaging(outDir);

    const knowledgeVersion = await readPackageVersion(
      join(workspaceRoot, "packages/knowledge/package.json"),
    );
    const designSystemVersion = await readPackageVersion(
      join(workspaceRoot, "packages/tokens/package.json"),
    );
    const revision = options.revision !== undefined ? options.revision : gitRevision(workspaceRoot);
    const buildTime = options.buildTime ?? sourceDateOrNow();

    const roots = [
      {
        root: join(workspaceRoot, "packages/knowledge/content"),
        visibility: "public",
      },
    ];
    if (options.internalContent) {
      roots.push(options.internalContent);
    }

    const reader = createWorkspaceReader(workspaceRoot);
    const corpus = await buildCorpus(reader, roots, { workspaceRoot });
    const meta = { knowledgeVersion, designSystemVersion, buildTime, revision };
    const publicBundle = projectBundle(corpus, "public", meta);
    const projected = [publicBundle];
    if (options.internalContent) {
      projected.push(projectBundle(corpus, "internal", meta));
    }

    const problems = [...corpus.problems, ...projected.flatMap((bundle) => bundle.problems)];
    const errors = problems.filter((item) => item.severity === "error");
    const warnings = problems.filter((item) => item.severity === "warning");
    if (errors.length > 0) {
      throw new KnowledgeCompileError(errors);
    }

    staging = `${outDir}.tmp-${process.pid}-${randomBytes(8).toString("hex")}`;
    await mkdir(staging, { recursive: true });
    const bundles = [];
    for (const bundle of projected) {
      bundles.push(await writeBundle(join(staging, bundle.visibility), bundle));
    }
    await rm(outDir, { recursive: true, force: true });
    await rename(staging, outDir);
    staging = undefined;

    return {
      bundles: bundles.map((bundle) => ({
        ...bundle,
        dir: join(outDir, basename(bundle.dir)),
      })),
      warnings,
    };
  } finally {
    if (staging) {
      await rm(staging, { recursive: true, force: true });
    }
    await rm(lockDir, { recursive: true, force: true });
  }
}

async function acquireCompileLock(lockDir) {
  let stoleStale = false;
  while (true) {
    try {
      await mkdir(lockDir);
      break;
    } catch (error) {
      if (error?.code !== "EEXIST") throw error;
      if (!stoleStale && (await isCompileLockStale(lockDir))) {
        await rm(lockDir, { recursive: true, force: true });
        stoleStale = true;
        continue;
      }
      throw lockHeldError(lockDir);
    }
  }

  try {
    await writeFile(
      join(lockDir, "owner.json"),
      `${JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString() })}\n`,
    );
  } catch (error) {
    await rm(lockDir, { recursive: true, force: true });
    throw error;
  }
}

function lockHeldError(lockDir) {
  return new KnowledgeCompileError([
    problem({
      code: PROBLEM.COMPILE_LOCK_HELD,
      path: lockDir,
      message: `compile lock is held. If no compile is running, remove it with: rm -rf ${lockDir}`,
    }),
  ]);
}

async function isCompileLockStale(lockDir) {
  try {
    const owner = JSON.parse(await readFile(join(lockDir, "owner.json"), "utf8"));
    return !isPidAlive(owner.pid);
  } catch {
    return true;
  }
}

function isPidAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error?.code !== "ESRCH";
  }
}

async function readPackageVersion(packageJsonPath) {
  try {
    const raw = JSON.parse(await readFile(packageJsonPath, "utf8"));
    return raw.version;
  } catch (error) {
    throw new KnowledgeCompileError([
      problem({
        code: PROBLEM.COMPILE_PACKAGE_UNREADABLE,
        path: packageJsonPath,
        message: `cannot read package version: ${error instanceof Error ? error.message : "read failed"}`,
      }),
    ]);
  }
}

function gitRevision(workspaceRoot) {
  try {
    return execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: workspaceRoot,
      encoding: "utf8",
    }).trim();
  } catch {
    return null;
  }
}

function sourceDateOrNow() {
  const epoch = process.env.SOURCE_DATE_EPOCH;
  if (epoch && /^[0-9]+$/.test(epoch)) {
    return new Date(Number(epoch) * 1000);
  }
  return new Date();
}

async function removeOrphanStaging(outDir) {
  const parent = dirname(outDir);
  const prefix = `${basename(outDir)}.tmp-`;
  let names;
  try {
    names = await readdir(parent);
  } catch {
    return;
  }
  await Promise.all(
    names
      .filter((name) => name.startsWith(prefix))
      .map((name) => rm(join(parent, name), { recursive: true, force: true })),
  );
}
