import { realpath } from "node:fs/promises";
import path from "node:path";

const posix = path.posix;

export const DEFAULT_DOMAIN_ROOTS = Object.freeze(["packages/tokens"]);

export function toRepoPath(input) {
  return String(input).replaceAll("\\", "/");
}

export function repoRelativePrefix(rootPath, workspaceRoot) {
  if (workspaceRoot && path.isAbsolute(rootPath)) {
    const rel = path.relative(workspaceRoot, rootPath);
    return posix.normalize(toRepoPath(rel) || ".");
  }
  return posix.normalize(toRepoPath(rootPath));
}

export function isInsidePrefix(prefix, repoPath) {
  const root = posix.normalize(toRepoPath(prefix)).replace(/\/$/, "");
  const target = posix.normalize(toRepoPath(repoPath));
  if (root === ".") {
    return target !== ".." && !target.startsWith("../") && !posix.isAbsolute(target);
  }
  return target === root || target.startsWith(`${root}/`);
}

export function allowedPrefixes(
  visibility,
  authoredRoots,
  workspaceRoot = null,
  domainRoots = DEFAULT_DOMAIN_ROOTS,
) {
  const own = authoredRoots
    .filter((root) => root.visibility === visibility)
    .map((root) => repoRelativePrefix(root.root, workspaceRoot));
  const domain = domainRoots.map((root) => posix.normalize(toRepoPath(root)));
  return [...own, ...domain];
}

export function inspectRepoPath(repoPath) {
  if (typeof repoPath !== "string" || repoPath.length === 0) {
    return { ok: false, reason: "empty", path: repoPath ?? "" };
  }
  const posixPath = toRepoPath(repoPath);
  if (posix.isAbsolute(posixPath) || path.isAbsolute(repoPath)) {
    return { ok: false, reason: "absolute", path: posixPath };
  }
  const segments = posixPath.split("/");
  if (segments.some((part) => part === "." || part === "..")) {
    return { ok: false, reason: "traversal", path: posixPath };
  }
  const normalized = posix.normalize(posixPath);
  if (normalized === ".." || normalized.startsWith("../") || posix.isAbsolute(normalized)) {
    return { ok: false, reason: "traversal", path: posixPath };
  }
  return { ok: true, path: normalized };
}

export function isLexicallyAllowed(repoPath, prefixes) {
  const inspected = inspectRepoPath(repoPath);
  if (!inspected.ok) return inspected;
  if (!prefixes.some((prefix) => isInsidePrefix(prefix, inspected.path))) {
    return { ok: false, reason: "outside-root", path: inspected.path };
  }
  return inspected;
}

export function safeJoinWorkspace(workspaceRoot, repoPath) {
  const inspected = inspectRepoPath(repoPath);
  if (!inspected.ok) return null;
  const absolute = path.resolve(workspaceRoot, ...inspected.path.split("/"));
  const rel = path.relative(path.resolve(workspaceRoot), absolute);
  if (rel.startsWith("..") || path.isAbsolute(rel)) return null;
  return absolute;
}

export async function isReallyAllowed(workspaceRoot, repoPath, prefixes) {
  const lexical = isLexicallyAllowed(repoPath, prefixes);
  if (!lexical.ok) return lexical;

  const absolute = path.join(workspaceRoot, ...lexical.path.split("/"));
  let resolved;
  try {
    resolved = await realpath(absolute);
  } catch {
    return { ...lexical, exists: false };
  }

  let workspaceReal;
  try {
    workspaceReal = await realpath(workspaceRoot);
  } catch {
    workspaceReal = path.resolve(workspaceRoot);
  }

  const rel = path.relative(workspaceReal, resolved);
  const repoResolved = toRepoPath(rel);
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    return { ok: false, reason: "symlink", path: lexical.path, resolved: repoResolved };
  }
  if (!prefixes.some((prefix) => isInsidePrefix(prefix, repoResolved))) {
    return { ok: false, reason: "symlink", path: lexical.path, resolved: repoResolved };
  }
  return { ok: true, path: lexical.path, resolved: repoResolved, exists: true };
}

export function pathConstraintMessage(check) {
  if (check.reason === "absolute") {
    return `path ${check.path} is absolute`;
  }
  if (check.reason === "traversal") {
    return `path ${check.path} uses . or ..`;
  }
  if (check.reason === "symlink") {
    return `path ${check.path} resolves outside allowed roots`;
  }
  if (check.reason === "empty") {
    return "path is empty";
  }
  return `path ${check.path} is outside allowed roots`;
}
