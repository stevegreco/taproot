import { createHash } from "node:crypto";
import path from "node:path";
import { fromMarkdown } from "mdast-util-from-markdown";
import { visit } from "unist-util-visit";
import { KnowledgeRecordError, parseRecord } from "../index.js";
import {
  allowedPrefixes,
  isLexicallyAllowed,
  isReallyAllowed,
  pathConstraintMessage,
} from "./paths.js";
import { readAdr } from "./sources/adr.js";
import { readTokenSource } from "./sources/token-source.js";
import { PROBLEM, SIZE_BRIDGE, problem } from "./tables.js";

const posix = path.posix;

export const CONTRIBUTORS = Object.freeze({
  authored: null,
  "token-source": readTokenSource,
  adr: readAdr,
});

export { PROBLEM, REVERSE_RELATION, SIZE_BRIDGE } from "./tables.js";

export function sha256Hex(data) {
  return createHash("sha256").update(data).digest("hex");
}

export function shortRevision(data) {
  return sha256Hex(data).slice(0, 16);
}

/**
 * @param {import("./index.js").WorkspaceReader} reader
 * @param {readonly import("./index.js").AuthoredRoot[]} roots
 * @param {{ workspaceRoot?: string }} [options]
 */
export async function buildCorpus(reader, roots, options = {}) {
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
          for (const issue of error.issues) {
            const unsupported = issue.path === "/schemaVersion";
            problems.push(
              problem({
                code: unsupported
                  ? PROBLEM.RECORD_SCHEMA_UNSUPPORTED
                  : PROBLEM.RECORD_INVALID,
                message: issue.message,
                path: issue.path || repoPath,
              }),
            );
          }
          continue;
        }
        throw error;
      }

      const authoredSource = authored.sources.find((source) => source.kind === "authored");
      if (authoredSource && authoredSource.path !== repoPath) {
        problems.push(
          problem({
            code: PROBLEM.RECORD_PATH_MISMATCH,
            message: `authored source path ${authoredSource.path} does not match file ${repoPath}`,
            recordId: authored.id,
            path: repoPath,
          }),
        );
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

  const mergedById = new Map();
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

    mergedById.set(id, assembleRecord(authored, contribution, assets));
  }

  problems.push(...attachContractFromUses(mergedById));
  for (const record of mergedById.values()) {
    applyTokenGroups(record);
    problems.push(...checkSourceAgreement(record));
    problems.push(...completenessProblems(record));
  }
  problems.push(...checkBindingAgreement(mergedById));

  const edges = [];
  for (const record of mergedById.values()) {
    for (const [relation, targets] of Object.entries(record.relations ?? {})) {
      for (const to of targets ?? []) {
        if (to === record.id) {
          problems.push(
            problem({
              code: PROBLEM.CORPUS_SELF_RELATION,
              message: `${record.id} ${relation} itself`,
              recordId: record.id,
              path: `/relations/${relation}`,
            }),
          );
          continue;
        }
        if (!mergedById.has(to)) {
          problems.push(
            problem({
              code: PROBLEM.CORPUS_UNRESOLVED_RELATION,
              message: `${record.id} ${relation} unresolved target ${to}`,
              recordId: record.id,
              path: `/relations/${relation}`,
            }),
          );
          continue;
        }
        edges.push({ from: record.id, relation, to });
      }
    }

    for (const annotation of record.annotations ?? []) {
      for (const to of annotation.relatesTo ?? []) {
        if (!mergedById.has(to)) {
          problems.push(
            problem({
              code: PROBLEM.CORPUS_UNRESOLVED_ANNOTATION,
              message: `${record.id} annotation ${annotation.id} relatesTo unresolved target ${to}`,
              recordId: record.id,
              path: `/annotations/${annotation.id}/relatesTo`,
            }),
          );
        }
      }
    }
  }

  for (const [id, record] of mergedById) {
    const rewritten = rewriteBodyLinks(record.body, {
      recordIdByPath,
      assetPathToBundlePath,
      authoredPath: listedPathById.get(id),
      recordId: id,
    });
    record.body = rewritten.body;
    problems.push(...rewritten.problems);
  }

  const records = new Map(
    [...mergedById.entries()].sort(([left], [right]) => left.localeCompare(right)),
  );
  edges.sort(compareEdges);

  return {
    records,
    edges: Object.freeze(edges),
    assetBytes,
    assetOwner,
    problems: Object.freeze(problems),
  };
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
  let decisions = [];

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
      source.kind === "authored"
        ? new TextEncoder().encode(authoredText)
        : await reader.readBytes(source.path);

    if (source.kind !== "authored" && bytes == null) {
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

    const revision = shortRevision(bytes ?? authoredText);
    sources.push({ kind: source.kind, path: source.path, revision });

    const contributor = CONTRIBUTORS[source.kind];
    if (!contributor) continue;

    const text = new TextDecoder().decode(bytes);
    const contribution = contributor(text, { path: source.path, recordId: authored.id });
    problems.push(...contribution.problems);

    if (contribution.fields.tokens?.entries) {
      tokenEntries = contribution.fields.tokens.entries;
    }
    if (contribution.fields.decisions) {
      decisions = decisions.concat(
        contribution.fields.decisions.map((entry) => ({ ...entry, revision })),
      );
    }
  }

  const fields = {};
  if (decisions.length > 0) fields.decisions = decisions;

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

function assembleRecord(authored, contribution, assets) {
  const record = {
    id: authored.id,
    schemaVersion: authored.schemaVersion,
    compiledSchemaVersion: 2,
    type: authored.type,
    title: authored.title,
    summary: authored.summary,
    status: authored.status,
    visibility: authored.visibility,
    jobs: authored.jobs,
    tags: authored.tags,
    relations: authored.relations,
    sources: contribution.sources,
    body: authored.body,
  };

  if (authored.checks) record.checks = authored.checks;
  if (assets.length > 0) record.assets = assets;
  if (authored.annotations) record.annotations = authored.annotations;
  if (authored.contract) record.contract = authored.contract;
  if (authored.host) record.host = authored.host;
  if (authored.tokenRef) record.tokenRef = authored.tokenRef;
  if (contribution.fields.tokens) record.tokens = contribution.fields.tokens;
  if (contribution.fields.decisions) record.decisions = contribution.fields.decisions;

  return record;
}

function attachContractFromUses(records) {
  const problems = [];

  for (const record of records.values()) {
    if (record.type !== "component") continue;
    const uses = record.relations?.uses ?? [];
    const specIds = uses.filter((id) => records.get(id)?.type === "spec");
    if (specIds.length === 0) continue;
    if (specIds.length > 1) {
      problems.push(
        problem({
          code: PROBLEM.SOURCE_CONFLICT,
          message: `${record.id} uses more than one spec`,
          recordId: record.id,
          path: "/relations/uses",
        }),
      );
      continue;
    }

    const spec = records.get(specIds[0]);
    if (!spec?.contract) {
      problems.push(
        problem({
          code: PROBLEM.SOURCE_CONFLICT,
          message: `${record.id} uses ${specIds[0]} which has no contract`,
          recordId: record.id,
          path: "/relations/uses",
        }),
      );
      continue;
    }

    record.contract = spec.contract;
  }

  return problems;
}

function checkBindingAgreement(records) {
  const problems = [];

  for (const record of records.values()) {
    if (record.type !== "binding") continue;
    const implementsIds = record.relations?.implements ?? [];
    if (implementsIds.length !== 1) {
      problems.push(
        problem({
          code: PROBLEM.SOURCE_CONFLICT,
          message: `${record.id} must implement exactly one component`,
          recordId: record.id,
          path: "/relations/implements",
        }),
      );
      continue;
    }

    const target = records.get(implementsIds[0]);
    if (!target || target.type !== "component" || !target.contract) {
      problems.push(
        problem({
          code: PROBLEM.SOURCE_CONFLICT,
          message: `${record.id} must implement a component that has a contract`,
          recordId: record.id,
          path: "/relations/implements",
        }),
      );
      continue;
    }

    const host = record.host ?? {};
    const contract = target.contract;
    problems.push(
      ...bijectionProblems(
        record.id,
        "anatomy",
        namesOfList(contract.anatomy),
        namesOfMap(host.anatomy),
      ),
    );
    problems.push(
      ...bijectionProblems(
        record.id,
        "parameters",
        namesOfMap(contract.parameters),
        namesOfMap(host.parameters),
      ),
    );
    problems.push(
      ...bijectionProblems(
        record.id,
        "events",
        namesOfMap(contract.events),
        namesOfMap(host.events),
      ),
    );

    for (const [name, portable] of Object.entries(contract.parameters ?? {})) {
      const mapped = host.parameters?.[name];
      if (!mapped?.values || portable.kind !== "enum") continue;
      for (const value of Object.keys(portable.values ?? {})) {
        if (!Object.hasOwn(mapped.values, value)) {
          problems.push(
            problem({
              code: PROBLEM.SOURCE_CONFLICT,
              message: `${record.id} host parameter ${name} is missing enum value ${value}`,
              recordId: record.id,
              path: `/host/parameters/${name}/values`,
            }),
          );
        }
      }
    }
  }

  return problems;
}

function namesOfList(items) {
  return new Set((items ?? []).map((item) => item.name));
}

function namesOfMap(object) {
  return new Set(Object.keys(object ?? {}));
}

function bijectionProblems(recordId, label, expected, actual) {
  const problems = [];
  for (const name of expected) {
    if (!actual.has(name)) {
      problems.push(
        problem({
          code: PROBLEM.SOURCE_CONFLICT,
          message: `${recordId} host ${label} is missing ${name}`,
          recordId,
          path: `/host/${label}`,
        }),
      );
    }
  }
  for (const name of actual) {
    if (!expected.has(name)) {
      problems.push(
        problem({
          code: PROBLEM.SOURCE_CONFLICT,
          message: `${recordId} host ${label} has unknown ${name}`,
          recordId,
          path: `/host/${label}`,
        }),
      );
    }
  }
  return problems;
}

function applyTokenGroups(record) {
  if (!record.tokens) return;
  const variants = new Set(Object.keys(record.contract?.parameters?.variant?.values ?? {}));
  record.tokens = {
    ...record.tokens,
    entries: record.tokens.entries.map((entry) => ({
      ...entry,
      group: assignGroup(entry.name, record.tokens.namespace, variants),
    })),
  };
}

function checkSourceAgreement(record) {
  const tokens = record.tokens;
  if (!tokens) return [];

  const problems = [];
  const namespace = tokens.namespace;
  const prefix = `${namespace}.`;
  const inNamespace = tokens.entries.filter(
    (entry) => entry.name === namespace || entry.name.startsWith(prefix),
  );

  if (inNamespace.length === 0) {
    problems.push(
      problem({
        code: PROBLEM.SOURCE_CONFLICT,
        message: `token namespace ${namespace} is missing from the token source`,
        recordId: record.id,
        path: "/tokens/namespace",
      }),
    );
  }

  const variantValues = record.contract?.parameters?.variant?.values ?? {};
  const variantNames = new Set(Object.keys(variantValues));

  if (tokens.tier === "component") {
    for (const variant of variantNames) {
      if (!tokens.entries.some((entry) => entry.group === variant)) {
        problems.push(
          problem({
            code: PROBLEM.SOURCE_CONFLICT,
            message: `component variant ${variant} has no token entries`,
            recordId: record.id,
            path: `/contract/parameters/variant/${variant}`,
          }),
        );
      }
    }

    const extraGroups = new Set(
      tokens.entries
        .map((entry) => entry.group)
        .filter((group) => group != null && !variantNames.has(group)),
    );
    for (const group of extraGroups) {
      problems.push(
        problem({
          code: PROBLEM.SOURCE_CONFLICT,
          message: `token group ${group} is not a spec variant`,
          recordId: record.id,
          path: "/tokens/entries",
        }),
      );
    }
  }

  const specSizes = Object.keys(record.contract?.parameters?.size?.values ?? {});
  for (const size of specSizes) {
    if (!Object.hasOwn(SIZE_BRIDGE, size)) {
      problems.push(
        problem({
          code: PROBLEM.SOURCE_CONFLICT,
          message: `spec size ${size} is not in SIZE_BRIDGE`,
          recordId: record.id,
          path: `/contract/parameters/size/${size}`,
        }),
      );
    }
  }

  const sizePrefix = `${namespace}.size.`;
  const tokenSizeKeys = new Set();
  for (const entry of tokens.entries) {
    if (!entry.name.startsWith(sizePrefix)) continue;
    const key = entry.name.slice(sizePrefix.length).split(".")[0];
    if (key) tokenSizeKeys.add(key);
  }
  const bridged = new Set(Object.values(SIZE_BRIDGE));
  for (const key of tokenSizeKeys) {
    if (!bridged.has(key)) {
      problems.push(
        problem({
          code: PROBLEM.SOURCE_CONFLICT,
          message: `token size key ${key} is not in SIZE_BRIDGE`,
          recordId: record.id,
          path: "/tokens/entries",
        }),
      );
    }
  }

  return problems;
}

function completenessProblems(record) {
  const problems = [];

  if (record.type === "example") {
    const hasAssets = Array.isArray(record.assets) && record.assets.length > 0;
    const hasAnnotations = Array.isArray(record.annotations) && record.annotations.length > 0;
    if (!hasAssets || !hasAnnotations) {
      problems.push(
        problem({
          code: PROBLEM.CORPUS_INCOMPLETE_EXAMPLE,
          message: `${record.id} needs at least one asset and one annotation`,
          recordId: record.id,
        }),
      );
    }
  }

  if (record.type === "guideline" && record.jobs.includes("review")) {
    if (!Array.isArray(record.checks) || record.checks.length === 0) {
      problems.push(
        problem({
          code: PROBLEM.CORPUS_INCOMPLETE_CHECKS,
          message: `${record.id} review guideline needs at least one check`,
          recordId: record.id,
        }),
      );
    }
  }

  return problems;
}

function assignGroup(name, namespace, variantNames) {
  const prefix = `${namespace}.`;
  if (!name.startsWith(prefix)) return null;
  const parts = name.slice(prefix.length).split(".");
  const first = parts[0];
  if (!first || first === "size") return null;
  if (variantNames.has(first)) return first;
  if (
    parts.length >= 3 &&
    (parts[1] === "background" || parts[1] === "foreground" || parts[1] === "border")
  ) {
    return first;
  }
  return null;
}

function rewriteBodyLinks(body, context) {
  const tree = fromMarkdown(body);
  const replacements = [];
  const problems = [];

  visit(tree, (node) => {
    if (node.type !== "link" && node.type !== "image") return;
    const url = node.url ?? "";
    const resolved = resolveBodyUrl(url, context);
    if (resolved.kind === "leave") return;
    if (resolved.kind === "error") {
      problems.push(
        problem({
          code: PROBLEM.BODY_UNRESOLVED_LINK,
          message: `unresolved relative link ${url}`,
          recordId: context.recordId,
          path: context.authoredPath,
        }),
      );
      return;
    }
    if (resolved.url !== url && node.position) {
      replacements.push({
        start: node.position.start.offset,
        end: node.position.end.offset,
        oldUrl: url,
        newUrl: resolved.url,
      });
    }
  });

  let next = body;
  for (const replacement of replacements.sort((left, right) => right.start - left.start)) {
    const slice = next.slice(replacement.start, replacement.end);
    next =
      next.slice(0, replacement.start) +
      replaceDestination(slice, replacement.oldUrl, replacement.newUrl) +
      next.slice(replacement.end);
  }

  return { body: next, problems };
}

function resolveBodyUrl(url, context) {
  if (!url) {
    return { kind: "error" };
  }
  if (url.startsWith("#")) {
    return { kind: "leave" };
  }
  if (/^[a-z][a-z0-9+.-]*:/i.test(url)) {
    return { kind: "leave" };
  }

  const hashIndex = url.indexOf("#");
  const pathPart = hashIndex === -1 ? url : url.slice(0, hashIndex);
  const hash = hashIndex === -1 ? "" : url.slice(hashIndex);
  if (!pathPart) {
    return { kind: "leave" };
  }
  if (pathPart.startsWith("/")) {
    return { kind: "error" };
  }

  const resolved = posix.normalize(posix.join(posix.dirname(context.authoredPath), pathPart));
  const recordId = context.recordIdByPath.get(resolved);
  if (recordId) {
    return { kind: "ok", url: `markdown/${recordId}.md${hash}` };
  }
  const bundlePath = context.assetPathToBundlePath.get(resolved);
  if (bundlePath) {
    return { kind: "ok", url: `${bundlePath}${hash}` };
  }
  return { kind: "error" };
}

function replaceDestination(slice, oldUrl, newUrl) {
  const wrapped = `(${oldUrl})`;
  const at = slice.lastIndexOf(wrapped);
  if (at !== -1) {
    return slice.slice(0, at) + `(${newUrl})` + slice.slice(at + wrapped.length);
  }
  const titled = `(${oldUrl} `;
  const titledAt = slice.lastIndexOf(titled);
  if (titledAt !== -1) {
    return slice.slice(0, titledAt) + `(${newUrl} ` + slice.slice(titledAt + titled.length);
  }
  const angled = `(<${oldUrl}>)`;
  const angledAt = slice.lastIndexOf(angled);
  if (angledAt !== -1) {
    return slice.slice(0, angledAt) + `(<${newUrl}>)` + slice.slice(angledAt + angled.length);
  }
  return slice.replace(oldUrl, newUrl);
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
    const parts = viewBox[1].trim().split(/[\s,]+/).map(Number);
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

function compareEdges(left, right) {
  return (
    left.from.localeCompare(right.from) ||
    left.relation.localeCompare(right.relation) ||
    left.to.localeCompare(right.to)
  );
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
