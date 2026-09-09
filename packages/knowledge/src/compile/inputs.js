import { readdir, readFile } from "node:fs/promises";
import path, { join } from "node:path";
import { KnowledgeRecordError, parseRecord } from "../index.js";
import {
  allowedPrefixes,
  isLexicallyAllowed,
  isReallyAllowed,
  pathConstraintMessage,
} from "./paths.js";
import { readAdr } from "./sources/adr.js";
import { readTokenSource } from "./sources/token-source.js";
import { PROBLEM, problem } from "./tables.js";
import { shortRevision } from "./digest.js";

const posix = path.posix;

export const CONTRIBUTORS = Object.freeze({
  authored: null,
  "token-source": readTokenSource,
  adr: readAdr,
});

/**
 * @param {import("./index.js").WorkspaceReader} reader
 * @param {readonly import("./index.js").AuthoredRoot[]} roots
 * @param {{ workspaceRoot?: string }} [options]
 */
export async function loadCorpusInputs(reader, roots, options = {}) {
  const workspaceRoot = options.workspaceRoot ?? null;
  const problems = [];
  const pending = new Map();
  const listedPathById = new Map();

  for (const root of roots) {
    let listed;
    try {
      listed = await reader.listRecords(root);
    } catch (error) {
      problems.push(
        problem({
          code: PROBLEM.CORPUS_ROOT_UNREADABLE,
          message: `cannot read content root ${root.root}: ${ioCode(error)}`,
          path: ioPath(error, root.root),
        }),
      );
      continue;
    }

    for (const repoPath of listed) {
      let text;
      try {
        text = await reader.readText(repoPath);
      } catch (error) {
        problems.push(
          problem({
            code: PROBLEM.RECORD_UNREADABLE,
            message: `cannot read record ${repoPath}: ${ioCode(error)}`,
            path: repoPath,
          }),
        );
        continue;
      }
      if (text == null) {
        problems.push(
          problem({
            code: PROBLEM.RECORD_UNREADABLE,
            message: `cannot read record ${repoPath}: ENOENT`,
            path: repoPath,
          }),
        );
        continue;
      }

      let authored;
      try {
        authored = parseRecord(text, { sourcePath: repoPath });
      } catch (error) {
        if (error instanceof KnowledgeRecordError) {
          const typedPaths = new Set(
            error.issues.filter((issue) => issue.keyword === "type").map((issue) => issue.path),
          );
          for (const issue of error.issues) {
            // Wrong type on a const field is a type error, not an unsupported version.
            if (issue.keyword === "const" && typedPaths.has(issue.path)) continue;
            const unsupported = issue.path === "/schemaVersion" && issue.keyword === "const";
            problems.push(
              problem({
                code: unsupported ? PROBLEM.RECORD_SCHEMA_UNSUPPORTED : PROBLEM.RECORD_INVALID,
                message: issue.message,
                path: issue.path ? `${repoPath} ${issue.path}` : repoPath,
              }),
            );
          }
          continue;
        }
        throw error;
      }

      for (const authoredSource of authored.sources.filter(
        (source) => source.kind === "authored",
      )) {
        if (authoredSource.path !== repoPath) {
          problems.push(
            problem({
              code: PROBLEM.RECORD_PATH_MISMATCH,
              message: `authored source path ${authoredSource.path} does not match file ${repoPath}`,
              recordId: authored.id,
              path: repoPath,
            }),
          );
        }
      }

      if (!Object.hasOwn(authored, "visibility") || authored.visibility == null) {
        authored.visibility = root.visibility;
      } else if (authored.visibility !== root.visibility) {
        problems.push(
          problem({
            code: PROBLEM.VISIBILITY_INTERNAL_PUBLIC,
            message: `record visibility ${authored.visibility} does not match root visibility ${root.visibility}`,
            recordId: authored.id,
            path: repoPath,
          }),
        );
      }

      if (pending.has(authored.id)) {
        problems.push(
          problem({
            code: PROBLEM.CORPUS_DUPLICATE_ID,
            message: `duplicate id ${authored.id} in ${listedPathById.get(authored.id)} and ${repoPath}`,
            recordId: authored.id,
            path: repoPath,
          }),
        );
        continue;
      }

      listedPathById.set(authored.id, repoPath);
      pending.set(authored.id, { authored, repoPath, text });
    }
  }

  const inputs = new Map();
  const assetBytes = new Map();
  const assetPathToBundlePath = new Map();
  const assetOwner = new Map();
  const assetIdOwner = new Map();
  const recordIdByPath = new Map();

  for (const [id, { authored, repoPath, text }] of pending) {
    recordIdByPath.set(repoPath, id);
    const prefixes = allowedPrefixes(authored.visibility, roots, workspaceRoot);
    const contribution = await readContributions(
      reader,
      authored,
      repoPath,
      text,
      prefixes,
      workspaceRoot,
    );
    problems.push(...contribution.problems);

    const assets = [];
    for (const asset of authored.assets ?? []) {
      const owner = assetIdOwner.get(asset.id);
      if (owner) {
        problems.push(
          problem({
            code: PROBLEM.CORPUS_DUPLICATE_ASSET_ID,
            message: `duplicate asset id ${asset.id} in ${owner.recordId} and ${id}`,
            recordId: id,
            path: asset.path,
          }),
        );
        continue;
      }
      assetIdOwner.set(asset.id, { recordId: id, path: asset.path });

      const constraint = await constrainPath(asset.path, prefixes, workspaceRoot);
      if (!constraint.ok) {
        problems.push(
          problem({
            code: PROBLEM.PATH_OUTSIDE_ROOT,
            message: `${id} asset ${pathConstraintMessage(constraint)}`,
            recordId: id,
            path: asset.path,
          }),
        );
        continue;
      }
      const bytes = await reader.readBytes(asset.path);
      const bundlePath = assetBundlePath(asset);
      if (bytes == null) {
        problems.push(
          problem({
            code: PROBLEM.ASSET_MISSING,
            message: `asset ${asset.id} is missing at ${asset.path}`,
            recordId: id,
            path: asset.path,
          }),
        );
        continue;
      }

      assetBytes.set(bundlePath, bytes);
      assetPathToBundlePath.set(asset.path, bundlePath);
      assetOwner.set(bundlePath, id);
      assets.push({
        ...asset,
        bundlePath,
        revision: shortRevision(bytes),
      });

      const mismatch = dimensionMismatch(asset, bytes);
      if (mismatch) {
        problems.push(
          problem({
            code: PROBLEM.ASSET_DIMENSION_MISMATCH,
            message: mismatch,
            recordId: id,
            path: asset.path,
            severity: "warning",
          }),
        );
      }
    }

    inputs.set(id, { authored, contribution, assets });
  }

  const tokenCatalog = await loadTokenNames(inputs, workspaceRoot);
  problems.push(...tokenCatalog.problems);

  return {
    inputs,
    listedPathById,
    recordIdByPath,
    assetPathToBundlePath,
    assetBytes,
    assetOwner,
    tokenNames: tokenCatalog.names,
    problems,
  };
}

export const TOKEN_CATALOG_ROOT = "packages/tokens/src/tokens";

/** List published token files under packages/tokens/src/tokens. */
export async function listTokenCatalogFiles(workspaceRoot) {
  const files = [];

  async function walk(relativeDir) {
    let entries;
    try {
      entries = await readdir(join(workspaceRoot, relativeDir), { withFileTypes: true });
    } catch (error) {
      if (error && typeof error === "object" && error.code === "ENOENT") return;
      throw error;
    }
    for (const entry of entries) {
      const relative = posix.join(relativeDir, entry.name);
      if (entry.isDirectory()) {
        await walk(relative);
        continue;
      }
      if (entry.isFile() && entry.name.endsWith(".tokens.json")) {
        files.push(relative);
      }
    }
  }

  await walk(TOKEN_CATALOG_ROOT);
  return files.sort((left, right) => left.localeCompare(right));
}

async function loadTokenNames(inputs, workspaceRoot) {
  const names = new Set();
  const problems = [];

  if (workspaceRoot) {
    for (const repoPath of await listTokenCatalogFiles(workspaceRoot)) {
      let text;
      try {
        text = await readFile(join(workspaceRoot, repoPath), "utf8");
      } catch (error) {
        if (error && typeof error === "object" && error.code === "ENOENT") continue;
        throw error;
      }
      const result = readTokenSource(text, { path: repoPath, recordId: "" });
      problems.push(...result.problems);
      for (const entry of result.fields.tokens?.entries ?? []) {
        names.add(entry.name);
      }
    }
  }

  for (const input of inputs.values()) {
    for (const entry of input.contribution.fields.tokens?.entries ?? []) {
      names.add(entry.name);
    }
  }

  if (!workspaceRoot && names.size === 0) {
    return { names: null, problems };
  }
  return { names, problems };
}

async function constrainPath(repoPath, prefixes, workspaceRoot) {
  if (workspaceRoot) {
    return isReallyAllowed(workspaceRoot, repoPath, prefixes);
  }
  return isLexicallyAllowed(repoPath, prefixes);
}

async function readContributions(
  reader,
  authored,
  repoPath,
  authoredText,
  prefixes,
  workspaceRoot,
) {
  const problems = [];
  const sources = [];
  const tokenMeta = authored.tokenRef ?? null;
  let tokenEntries;

  for (const source of authored.sources) {
    const constraint = await constrainPath(source.path, prefixes, workspaceRoot);
    if (!constraint.ok) {
      problems.push(
        problem({
          code: PROBLEM.PATH_OUTSIDE_ROOT,
          message: `${authored.id} source ${pathConstraintMessage(constraint)}`,
          recordId: authored.id,
          path: source.path,
        }),
      );
      continue;
    }

    const bytes =
      source.kind === "authored" && source.path === repoPath
        ? new TextEncoder().encode(authoredText)
        : await reader.readBytes(source.path);

    if (bytes == null) {
      problems.push(
        problem({
          code: PROBLEM.SOURCE_MISSING,
          message: `source ${source.kind} is missing at ${source.path}`,
          recordId: authored.id,
          path: source.path,
        }),
      );
      continue;
    }

    const revision = shortRevision(bytes);
    sources.push({ kind: source.kind, path: source.path, revision });

    const contributor = CONTRIBUTORS[source.kind];
    if (!contributor) continue;

    const text = new TextDecoder().decode(bytes);
    const contribution = contributor(text, { path: source.path, recordId: authored.id });
    problems.push(...contribution.problems);

    if (contribution.fields.tokens?.entries) {
      tokenEntries = contribution.fields.tokens.entries;
    }
  }

  const fields = {};

  if (tokenMeta && tokenEntries) {
    fields.tokens = {
      ...tokenMeta,
      entries: tokenEntries,
    };
  } else if (tokenMeta || tokenEntries) {
    problems.push(
      problem({
        code: PROBLEM.SOURCE_CONFLICT,
        message: `${authored.id} is missing one half of the token contract`,
        recordId: authored.id,
        path: "/tokens",
      }),
    );
  }

  return { fields, sources, problems };
}

function assetBundlePath(asset) {
  const ext = posix.extname(asset.path);
  return `assets/${asset.id}${ext}`;
}

function dimensionMismatch(asset, bytes) {
  if (asset.mediaType !== "image/svg+xml") return null;
  const text = new TextDecoder().decode(bytes);
  const actual = svgDimensions(text);
  if (!actual) return null;
  if (actual.width === asset.width && actual.height === asset.height) return null;
  return `declared ${asset.width}x${asset.height}, file is ${actual.width}x${actual.height}`;
}

function svgDimensions(text) {
  const viewBox = /viewBox\s*=\s*"([^"]+)"/i.exec(text);
  if (viewBox) {
    const parts = viewBox[1]
      .trim()
      .split(/[\s,]+/)
      .map(Number);
    if (parts.length === 4 && parts.every(Number.isFinite)) {
      return { width: parts[2], height: parts[3] };
    }
  }
  const width = /width\s*=\s*"(\d+(?:\.\d+)?)"/i.exec(text);
  const height = /height\s*=\s*"(\d+(?:\.\d+)?)"/i.exec(text);
  if (width && height) {
    return { width: Number(width[1]), height: Number(height[1]) };
  }
  return null;
}

function ioCode(error) {
  if (error && typeof error === "object" && typeof error.code === "string") {
    return error.code;
  }
  return error instanceof Error ? error.message : "unknown";
}

function ioPath(error, fallback) {
  if (error && typeof error === "object" && typeof error.path === "string") {
    return error.path;
  }
  return fallback;
}
