/**
 * Retrieval over one compiled bundle (KNOW-015).
 *
 * | Question | Answer |
 * |---|---|
 * | Entry | `openCatalog(source?, options?)`. Omitted source → this package's `dist/public`. String or `URL` → bundle directory. Object → `{ records, searchIndex, manifest }` already parsed. Always returns `Promise<Catalog>`. |
 * | Missing `get(id)` | `undefined`. Malformed id → `KnowledgeQueryError` `malformed-id`. Non-string → `TypeError`. |
 * | `list` | Filters `type`, `status`, `visibility`, `jobs`, `tags`. String means one-element array. AND across keys, OR within a key. Always id order (UTF-16 code unit). No paging. Unknown key/enum → `KnowledgeQueryError`. |
 * | `search` | Shared `tokenize`. Index membership only. OR across query terms. Rank: term coverage desc, field weight desc (title 8, tags 4, summary 2, body 1), id asc. Return `SearchHit[]` `{ record, terms }`. No public `score`. Empty/stopword query → `[]`. No scan of `id`/`type`/`jobs`. Structured facts from `contract`, `host`, and `checks` are indexed with body weight. |
 * | `related(id)` | Full neighborhood, grouped by neighbor. `{ record, via: [{ relation, direction }] }`. `relation` is always the forward name. `direction` is `"outbound"` \| `"inbound"` \| `"symmetric"`. Missing seed → `KnowledgeQueryError` `unknown-record`. Isolated record → `[]`. |
 * | Export | `./retrieve` only. `.` stays `parseRecord`. |
 * | Tokenizer | `export function tokenize` from `src/compile/search-index.js`. In-package import only. Not on the package `exports` map. |
 *
 * Directory opens verify SHA-256 and byte length for `records.json` and `search-index.json`
 * against `manifest.content.files`. In-memory `{ records, searchIndex, manifest }` skips that check.
 * Bundle visibility comes from `manifest.content.visibility`. `expectVisibility` compares against
 * that declared projection, not a guess from record contents.
 */

import { tokenize } from "../compile/search-index.js";
import { REVERSE_RELATION } from "../compile/tables.js";
import {
  DOTTED_ID,
  KnowledgeBundleError,
  SLUG,
  VOCABULARY,
  byCodeUnit,
  loadBundle,
} from "./load.js";

export { KnowledgeBundleError };

const EMPTY = Object.freeze([]);
const FIELD_WEIGHT = Object.freeze({ title: 8, tags: 4, summary: 2, body: 1 });

const FORWARD_RELATION = Object.freeze(
  Object.fromEntries(
    Object.entries(REVERSE_RELATION).map(([forward, reverse]) => [reverse, forward]),
  ),
);

const SYMMETRIC = new Set(
  Object.keys(REVERSE_RELATION).filter((relation) => REVERSE_RELATION[relation] === relation),
);

/**
 * @typedef {object} SearchHit
 * @property {object} record
 * @property {readonly string[]} terms
 *
 * @typedef {object} Neighbor
 * @property {object} record
 * @property {readonly { relation: string, direction: "outbound"|"inbound"|"symmetric" }[]} via
 *
 * @typedef {object} CatalogInfo
 * @property {"public"|"internal"} visibility
 * @property {string} digest
 * @property {number} recordCount
 * @property {string} knowledgeVersion
 * @property {string} designSystemVersion
 * @property {number} schemaVersion
 * @property {number} compiledSchemaVersion
 * @property {string|null} revision
 * @property {string} builtAt
 *
 * @typedef {object} Catalog
 * @property {CatalogInfo} info
 * @property {(id: string) => object|undefined} get
 * @property {(filters?: object) => readonly object[]} list
 * @property {(query: string) => readonly SearchHit[]} search
 * @property {(id: string) => readonly Neighbor[]} related
 *
 * @typedef {object} OpenOptions
 * @property {"public"|"internal"} [expectVisibility]
 *
 * @typedef {object} BundleInput
 * @property {unknown} records
 * @property {unknown} searchIndex
 * @property {unknown} manifest
 */

export class KnowledgeQueryError extends Error {
  /**
   * @param {string} code
   * @param {string} message
   */
  constructor(code, message) {
    super(message);
    this.name = "KnowledgeQueryError";
    this.code = code;
  }
}

/**
 * @param {string|URL|BundleInput} [source]
 * @param {OpenOptions} [options]
 * @returns {Promise<Catalog>}
 */
export async function openCatalog(source, options) {
  const bundle = await loadBundle(source, options);
  return createCatalog(bundle);
}

/**
 * @param {import("./load.js").LoadedBundle} bundle
 * @returns {Catalog}
 */
function createCatalog(bundle) {
  function get(id) {
    assertId(id);
    return bundle.byId.get(id);
  }

  function list(filters) {
    const predicate = compileFilters(filters);
    return Object.freeze(bundle.ids.map((id) => bundle.byId.get(id)).filter(predicate));
  }

  function search(query) {
    if (typeof query !== "string") throw new TypeError("query must be a string");
    const queryTerms = [...tokenize(query)].sort(byCodeUnit);
    if (queryTerms.length === 0) return EMPTY;

    const matched = new Map();
    for (const term of queryTerms) {
      for (const id of bundle.postings.get(term) ?? EMPTY) {
        const hitTerms = matched.get(id);
        if (hitTerms) hitTerms.push(term);
        else matched.set(id, [term]);
      }
    }

    const ranked = [];
    for (const [id, terms] of matched) {
      let weight = 0;
      for (const term of terms) weight += fieldWeight(bundle, id, term);
      ranked.push({ id, terms, coverage: terms.length, weight });
    }
    ranked.sort((left, right) => {
      if (right.coverage !== left.coverage) return right.coverage - left.coverage;
      if (right.weight !== left.weight) return right.weight - left.weight;
      return byCodeUnit(left.id, right.id);
    });

    return Object.freeze(
      ranked.map((item) =>
        Object.freeze({
          record: bundle.byId.get(item.id),
          terms: Object.freeze(item.terms),
        }),
      ),
    );
  }

  function related(id) {
    assertId(id);
    const record = bundle.byId.get(id);
    if (!record) {
      throw new KnowledgeQueryError("unknown-record", `${id} is not in this catalog`);
    }

    /** @type {Map<string, { relation: string, direction: string }[]>} */
    const viaByNeighbor = new Map();
    emitRelations(record.relations, viaByNeighbor, "outbound");
    emitBacklinks(record.backlinks, viaByNeighbor);

    return Object.freeze(
      [...viaByNeighbor.keys()].sort(byCodeUnit).map((neighborId) => {
        const via = viaByNeighbor.get(neighborId).sort((left, right) => {
          const relationOrder = byCodeUnit(left.relation, right.relation);
          if (relationOrder !== 0) return relationOrder;
          return byCodeUnit(left.direction, right.direction);
        });
        return Object.freeze({
          record: bundle.byId.get(neighborId),
          via: Object.freeze(via.map((edge) => Object.freeze(edge))),
        });
      }),
    );
  }

  return Object.freeze({ info: bundle.info, get, list, search, related });
}

/**
 * @param {object|undefined} relations
 * @param {Map<string, { relation: string, direction: string }[]>} viaByNeighbor
 * @param {"outbound"} direction
 */
function emitRelations(relations, viaByNeighbor, direction) {
  for (const [relation, targets] of Object.entries(relations ?? {})) {
    const edgeDirection = SYMMETRIC.has(relation) ? "symmetric" : direction;
    for (const target of targets ?? []) pushEdge(viaByNeighbor, target, relation, edgeDirection);
  }
}

/**
 * @param {object|undefined} backlinks
 * @param {Map<string, { relation: string, direction: string }[]>} viaByNeighbor
 */
function emitBacklinks(backlinks, viaByNeighbor) {
  for (const [key, sources] of Object.entries(backlinks ?? {})) {
    const relation = FORWARD_RELATION[key];
    if (!relation) continue;
    const edgeDirection = SYMMETRIC.has(relation) ? "symmetric" : "inbound";
    for (const source of sources ?? []) pushEdge(viaByNeighbor, source, relation, edgeDirection);
  }
}

/**
 * @param {Map<string, { relation: string, direction: string }[]>} viaByNeighbor
 * @param {string} neighborId
 * @param {string} relation
 * @param {string} direction
 */
function pushEdge(viaByNeighbor, neighborId, relation, direction) {
  let via = viaByNeighbor.get(neighborId);
  if (!via) {
    via = [];
    viaByNeighbor.set(neighborId, via);
  }
  if (via.some((edge) => edge.relation === relation && edge.direction === direction)) return;
  via.push({ relation, direction });
}

/**
 * @param {import("./load.js").LoadedBundle} bundle
 * @param {string} id
 * @param {string} term
 */
function fieldWeight(bundle, id, term) {
  const fields = bundle.fieldTerms.get(id);
  if (fields.title.has(term)) return FIELD_WEIGHT.title;
  if (fields.tags.has(term)) return FIELD_WEIGHT.tags;
  if (fields.summary.has(term)) return FIELD_WEIGHT.summary;
  return FIELD_WEIGHT.body;
}

/**
 * @param {unknown} id
 */
function assertId(id) {
  if (typeof id !== "string") throw new TypeError("id must be a string");
  if (!DOTTED_ID.test(id)) {
    throw new KnowledgeQueryError("malformed-id", `${id} is not a dotted record id`);
  }
}

/**
 * @param {object} [filters]
 * @returns {(record: object) => boolean}
 */
function compileFilters(filters) {
  if (filters === undefined) return () => true;
  if (filters === null || typeof filters !== "object" || Array.isArray(filters)) {
    throw new TypeError("filters must be an object");
  }

  const unknown = Object.keys(filters).filter((key) => !VOCABULARY.filterKeys.includes(key));
  if (unknown.length > 0) {
    throw new KnowledgeQueryError(
      "unknown-filter",
      `${unknown[0]} is not a list filter (${VOCABULARY.filterKeys.join(", ")})`,
    );
  }

  /** @type {Record<string, Set<string>>} */
  const required = {};
  for (const key of VOCABULARY.filterKeys) {
    if (!Object.hasOwn(filters, key) || filters[key] === undefined) continue;
    const values = Array.isArray(filters[key]) ? filters[key] : [filters[key]];
    const allowed = new Set();
    for (const value of values) {
      if (typeof value !== "string") {
        throw new TypeError(`${key} filter values must be strings`);
      }
      if (key === "tags") {
        if (!SLUG.test(value)) {
          throw new KnowledgeQueryError("unknown-filter-value", `${value} is not a tag slug`);
        }
      } else if (!VOCABULARY[key].has(value)) {
        throw new KnowledgeQueryError("unknown-filter-value", `${value} is not a valid ${key}`);
      }
      allowed.add(value);
    }
    required[key] = allowed;
  }

  return (record) => {
    if (required.type && !required.type.has(record.type)) return false;
    if (required.status && !required.status.has(record.status)) return false;
    if (required.visibility && !required.visibility.has(record.visibility)) return false;
    if (required.jobs && !record.jobs.some((job) => required.jobs.has(job))) return false;
    if (required.tags && !record.tags.some((tag) => required.tags.has(tag))) return false;
    return true;
  };
}
