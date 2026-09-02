import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { tokenize } from "../compile/search-index.js";
import authoredSchema from "../schema/index.js";

export class KnowledgeBundleError extends Error {
  /**
   * @param {string} code
   * @param {string} source
   * @param {readonly string[]} details
   */
  constructor(code, source, details) {
    super(`${source}: ${code}\n${details.map((line) => `  ${line}`).join("\n")}`);
    this.name = "KnowledgeBundleError";
    this.code = code;
    this.source = source;
    this.details = Object.freeze(details);
  }
}

export const DOTTED_ID = new RegExp(authoredSchema.$defs.dottedId.pattern);
export const SLUG = new RegExp(authoredSchema.$defs.slug.pattern);

export const VOCABULARY = Object.freeze({
  type: new Set(authoredSchema.properties.type.enum),
  status: new Set(authoredSchema.properties.status.enum),
  visibility: new Set(authoredSchema.properties.visibility.enum),
  jobs: new Set(authoredSchema.properties.jobs.items.enum),
  filterKeys: Object.freeze(["type", "status", "visibility", "jobs", "tags"]),
});

const DEFAULT_PUBLIC = new URL("../../dist/public/", import.meta.url);
const REQUIRED_FILES = Object.freeze(["records.json", "search-index.json", "manifest.json"]);

/**
 * @typedef {object} RecordFieldTerms
 * @property {ReadonlySet<string>} title
 * @property {ReadonlySet<string>} tags
 * @property {ReadonlySet<string>} summary
 *
 * @typedef {object} LoadedBundle
 * @property {readonly string[]} ids
 * @property {ReadonlyMap<string, object>} byId
 * @property {ReadonlyMap<string, readonly string[]>} postings
 * @property {ReadonlyMap<string, RecordFieldTerms>} fieldTerms
 * @property {import("./index.js").CatalogInfo} info
 *
 * @param {string|URL|object} [source]
 * @param {import("./index.js").OpenOptions} [options]
 * @returns {Promise<LoadedBundle>}
 */
export async function loadBundle(source, options = {}) {
  if (options != null && (typeof options !== "object" || Array.isArray(options))) {
    throw new TypeError("options must be an object");
  }

  const expectVisibility = options?.expectVisibility;
  if (
    expectVisibility !== undefined &&
    expectVisibility !== "public" &&
    expectVisibility !== "internal"
  ) {
    throw new TypeError('options.expectVisibility must be "public" or "internal"');
  }

  const resolved = await resolveSource(source);
  validateContract(resolved.records, resolved.searchIndex, resolved.manifest, resolved.label);
  const visibility = deriveVisibility(resolved.records, expectVisibility, resolved.label);
  return buildLoadedBundle(resolved.records, resolved.searchIndex, resolved.manifest, visibility);
}

/**
 * @param {string|URL|object} [source]
 */
async function resolveSource(source) {
  if (source === undefined) {
    const dir = fileURLToPath(DEFAULT_PUBLIC);
    return readDirectory(dir, dir, true);
  }
  if (typeof source === "string") {
    return readDirectory(source, source, false);
  }
  if (source instanceof URL) {
    return readDirectory(fileURLToPath(source), source.href, false);
  }
  if (source !== null && typeof source === "object" && !Array.isArray(source)) {
    return {
      label: "<in-memory bundle>",
      records: source.records,
      searchIndex: source.searchIndex,
      manifest: source.manifest,
    };
  }
  throw new TypeError("source must be a string, URL, bundle object, or undefined");
}

/**
 * @param {string} dir
 * @param {string} label
 * @param {boolean} isDefault
 */
async function readDirectory(dir, label, isDefault) {
  const bytesByName = {};
  for (const name of REQUIRED_FILES) {
    bytesByName[name] = await readBundleFile(join(dir, name), name, label, isDefault);
  }

  const records = parseJson(bytesByName["records.json"], "records.json", label);
  const searchIndex = parseJson(bytesByName["search-index.json"], "search-index.json", label);
  const manifest = parseJson(bytesByName["manifest.json"], "manifest.json", label);

  verifyFileIntegrity(manifest, "records.json", bytesByName["records.json"], label);
  verifyFileIntegrity(manifest, "search-index.json", bytesByName["search-index.json"], label);

  return { label, records, searchIndex, manifest };
}

/**
 * @param {string} path
 * @param {string} name
 * @param {string} label
 * @param {boolean} isDefault
 */
async function readBundleFile(path, name, label, isDefault) {
  try {
    return await readFile(path);
  } catch (error) {
    if (error && error.code === "ENOENT") {
      const hint = isDefault
        ? `${name} is missing; run pnpm --filter @stevegreco/design-system-knowledge build`
        : `${name} is missing`;
      throw fail("bundle-missing", label, [hint]);
    }
    const message = error instanceof Error ? error.message : "read failed";
    throw fail("bundle-unreadable", label, [`${name}: ${message}`]);
  }
}

/**
 * @param {Buffer} bytes
 * @param {string} name
 * @param {string} label
 */
function parseJson(bytes, name, label) {
  try {
    return JSON.parse(bytes.toString("utf8"));
  } catch (error) {
    const message = error instanceof Error ? error.message : "JSON.parse failed";
    throw fail("bundle-unreadable", label, [`${name} is not JSON: ${message}`]);
  }
}

/**
 * @param {object} manifest
 * @param {string} path
 * @param {Buffer} bytes
 * @param {string} label
 */
function verifyFileIntegrity(manifest, path, bytes, label) {
  const files = manifest?.content?.files;
  if (!Array.isArray(files)) {
    throw fail("bundle-invalid", label, ["manifest.content.files must be an array"]);
  }
  const listed = files.find((entry) => entry && entry.path === path);
  if (!listed) {
    throw fail("bundle-inconsistent", label, [`manifest.content.files has no entry for ${path}`]);
  }
  const sha256 = sha256Hex(bytes);
  const details = [];
  if (listed.sha256 !== sha256) {
    details.push(`${path} sha256 ${sha256} does not match manifest ${listed.sha256}`);
  }
  if (listed.bytes !== bytes.byteLength) {
    details.push(`${path} byte length ${bytes.byteLength} does not match manifest ${listed.bytes}`);
  }
  if (details.length > 0) {
    throw fail("bundle-inconsistent", label, details);
  }
}

/**
 * @param {unknown} records
 * @param {unknown} searchIndex
 * @param {unknown} manifest
 * @param {string} label
 */
function validateContract(records, searchIndex, manifest, label) {
  const invalid = [];
  if (!Array.isArray(records)) invalid.push("records must be an array");
  if (searchIndex == null || typeof searchIndex !== "object" || Array.isArray(searchIndex)) {
    invalid.push("searchIndex must be an object");
  }
  if (manifest == null || typeof manifest !== "object" || Array.isArray(manifest)) {
    invalid.push("manifest must be an object");
  }
  if (invalid.length > 0) throw fail("bundle-invalid", label, invalid);

  const index = /** @type {object} */ (searchIndex);
  const man = /** @type {object} */ (manifest);
  const content = man.content;
  if (content == null || typeof content !== "object" || Array.isArray(content)) {
    throw fail("bundle-invalid", label, ["manifest.content must be an object"]);
  }

  const ids = [];
  const byId = new Map();
  for (const [offset, record] of records.entries()) {
    if (record == null || typeof record !== "object" || Array.isArray(record)) {
      invalid.push(`records[${offset}] must be an object`);
      continue;
    }
    const id = record.id;
    if (typeof id !== "string" || !DOTTED_ID.test(id)) {
      invalid.push(`records[${offset}].id is not a dotted record id`);
      continue;
    }
    if (byId.has(id)) {
      invalid.push(`duplicate record id ${id}`);
      continue;
    }
    byId.set(id, record);
    ids.push(id);
  }
  if (invalid.length > 0) throw fail("bundle-invalid", label, invalid);

  if (!Object.hasOwn(index, "version")) {
    throw fail("bundle-invalid", label, ["searchIndex.version is missing"]);
  }
  if (index.version !== 1) {
    throw fail("unsupported-index-version", label, [`search index version ${index.version} is not 1`]);
  }
  if (!Object.hasOwn(content, "schemaVersion") || !Object.hasOwn(content, "compiledSchemaVersion")) {
    throw fail("bundle-invalid", label, ["manifest.content schema versions are missing"]);
  }
  if (content.schemaVersion !== 1 || content.compiledSchemaVersion !== 1) {
    throw fail("unsupported-schema-version", label, [
      `schemaVersion ${content.schemaVersion} compiledSchemaVersion ${content.compiledSchemaVersion} are not 1`,
    ]);
  }

  const inconsistent = [];
  if (content.recordCount !== records.length) {
    inconsistent.push(`manifest.content.recordCount ${content.recordCount} !== ${records.length}`);
  }
  if (!Array.isArray(index.records)) {
    inconsistent.push("searchIndex.records must be an array");
  } else {
    index.records.forEach((id, offset) => {
      if (typeof id !== "string" || !byId.has(id)) {
        inconsistent.push(`searchIndex.records[${offset}] ${id} is not in records`);
      }
    });
  }

  const terms = index.terms;
  if (terms == null || typeof terms !== "object" || Array.isArray(terms)) {
    inconsistent.push("searchIndex.terms must be an object");
  } else {
    const recordCount = Array.isArray(index.records) ? index.records.length : 0;
    for (const [term, postings] of Object.entries(terms)) {
      if (!Array.isArray(postings)) {
        inconsistent.push(`searchIndex.terms[${term}] must be an array`);
        continue;
      }
      for (const posting of postings) {
        if (!Number.isInteger(posting) || posting < 0 || posting >= recordCount) {
          inconsistent.push(`searchIndex.terms[${term}] posting ${posting} is out of range`);
        }
      }
    }
  }

  for (const record of byId.values()) {
    for (const target of linkedIds(record)) {
      if (!byId.has(target)) {
        inconsistent.push(`${record.id} links to unknown ${target}`);
      }
    }
  }

  if (inconsistent.length > 0) throw fail("bundle-inconsistent", label, inconsistent);
}

/**
 * @param {object} record
 * @returns {string[]}
 */
function linkedIds(record) {
  const ids = [];
  for (const targets of Object.values(record.relations ?? {})) {
    if (Array.isArray(targets)) ids.push(...targets);
  }
  for (const sources of Object.values(record.backlinks ?? {})) {
    if (Array.isArray(sources)) ids.push(...sources);
  }
  return ids;
}

/**
 * @param {readonly object[]} records
 * @param {"public"|"internal"|undefined} expected
 * @param {string} label
 */
function deriveVisibility(records, expected, label) {
  const derived = records.some((record) => record.visibility === "internal") ? "internal" : "public";
  if (expected && expected !== derived) {
    const offenders = records
      .filter((record) => expected === "public" && record.visibility === "internal")
      .map((record) => record.id);
    const details =
      offenders.length > 0
        ? [`expected public, found internal ${offenders.join(", ")}`]
        : [`expected ${expected}, derived ${derived}`];
    throw fail("projection-mismatch", label, details);
  }
  return derived;
}

/**
 * @param {readonly object[]} records
 * @param {object} searchIndex
 * @param {object} manifest
 * @param {"public"|"internal"} visibility
 * @returns {LoadedBundle}
 */
function buildLoadedBundle(records, searchIndex, manifest, visibility) {
  const byId = new Map();
  for (const record of records) {
    byId.set(record.id, deepFreeze(record));
  }
  const ids = Object.freeze([...byId.keys()].sort(byCodeUnit));
  const postings = remapPostings(searchIndex);
  const fieldTerms = new Map();
  for (const id of ids) {
    const record = byId.get(id);
    fieldTerms.set(
      id,
      Object.freeze({
        title: tokenize(record.title ?? ""),
        tags: tokenize((record.tags ?? []).join(" ")),
        summary: tokenize(record.summary ?? ""),
      }),
    );
  }

  const build = manifest.build ?? {};
  const content = manifest.content;
  const info = Object.freeze({
    visibility,
    digest: manifest.digest,
    recordCount: ids.length,
    knowledgeVersion: content.knowledgeVersion,
    designSystemVersion: content.designSystemVersion,
    schemaVersion: content.schemaVersion,
    compiledSchemaVersion: content.compiledSchemaVersion,
    revision: build.revision ?? null,
    builtAt: build.time,
  });

  return Object.freeze({ ids, byId, postings, fieldTerms, info });
}

/**
 * Integer postings do not survive this step.
 * Do not index into records[i] even though load proved alignment.
 *
 * @param {object} searchIndex
 * @returns {Map<string, readonly string[]>}
 */
function remapPostings(searchIndex) {
  const postings = new Map();
  for (const [term, indexes] of Object.entries(searchIndex.terms ?? {})) {
    const ids = indexes.map((index) => searchIndex.records[index]);
    ids.sort(byCodeUnit);
    postings.set(term, Object.freeze(ids));
  }
  return postings;
}

/**
 * @param {unknown} value
 */
function deepFreeze(value) {
  if (value === null || typeof value !== "object") return value;
  if (Object.isFrozen(value)) return value;
  if (Array.isArray(value)) {
    for (const item of value) deepFreeze(item);
  } else {
    for (const nested of Object.values(value)) deepFreeze(nested);
  }
  return Object.freeze(value);
}

export function byCodeUnit(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function sha256Hex(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function fail(code, source, details) {
  return new KnowledgeBundleError(code, source, details);
}
