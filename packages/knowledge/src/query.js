import { scoreRecord, tokenize } from "./search.js";
import { byCodeUnit, recordIdOf } from "./util.js";

/**
 * @typedef {object} State
 * @property {string} contentDir
 * @property {Map<string, any>} records Frozen records by id.
 * @property {Map<string, Map<string, import("./sections.js").SectionEntry>>} sections
 * @property {import("./knowledge.js").Link[]} links
 * @property {Map<string, import("./search.js").IndexedRecord>} searchIndex
 * @property {((ref: string) => Record<string, string> | undefined) | undefined} resolveToken
 */

const LEVEL_ORDER = { must: 0, should: 1, may: 2 };
const DEFAULT_SEARCH_LIMIT = 10;

export function summarize(record) {
  const { id, type, title, summary, tags, status } = record;
  return { id, type, title, summary, tags: [...tags], status };
}

const byId = (left, right) => byCodeUnit(left.id, right.id);

export function list(state, filter = {}) {
  return [...state.records.values()]
    .filter((record) => !filter.type || record.type === filter.type)
    .filter((record) => !filter.tag || record.tags.includes(filter.tag))
    .filter((record) => !filter.status || record.status === filter.status)
    .sort(byId)
    .map(summarize);
}

export function section(state, target) {
  const hash = target.indexOf("#");
  if (hash === -1) return undefined;
  const recordId = target.slice(0, hash);
  const name = target.slice(hash + 1);
  const entry = state.sections.get(recordId)?.get(name);
  if (!entry) return undefined;
  return Object.freeze({
    target,
    recordId,
    section: name,
    title: entry.title,
    content: entry.content,
  });
}

export function search(state, query, options = {}) {
  const queryTokens = [...new Set(tokenize(query))];
  if (queryTokens.length === 0) return [];
  const hits = [];
  for (const record of state.records.values()) {
    if (options.type && record.type !== options.type) continue;
    if (options.tags && !options.tags.every((tag) => record.tags.includes(tag))) continue;
    const { score, matches } = scoreRecord(state.searchIndex.get(record.id), queryTokens);
    if (score > 0) hits.push({ ...summarize(record), score, matches });
  }
  hits.sort((a, b) => b.score - a.score || byId(a, b));
  return hits.slice(0, options.limit ?? DEFAULT_SEARCH_LIMIT);
}

export function links(state, id, options = {}) {
  const direction = options.direction ?? "out";
  const wanted = (link) => {
    if (options.kind && link.kind !== options.kind) return false;
    const out = link.from === id;
    const incoming = recordIdOf(link.to) === id;
    return (direction !== "in" && out) || (direction !== "out" && incoming);
  };
  // `state.links` is already sorted by kind, then `to`, then `from`.
  return state.links.filter(wanted).map((link) => ({ ...link }));
}

export function rules(state, filter = {}) {
  const [recordId, ruleId] = filter.id ? filter.id.split("#") : [];
  const queryTokens = filter.query ? [...new Set(tokenize(filter.query))] : [];
  const hits = [];
  for (const record of state.records.values()) {
    if (recordId && record.id !== recordId) continue;
    (record.rules ?? []).forEach((rule, order) => {
      if (ruleId && rule.id !== ruleId) return;
      if (filter.topic && rule.topic !== filter.topic) return;
      if (filter.level && rule.level !== filter.level) return;
      if (queryTokens.length > 0) {
        const words = new Set(tokenize(JSON.stringify(rule)));
        if (!queryTokens.every((token) => words.has(token))) return;
      }
      hits.push({
        order,
        hit: {
          address: `${record.id}#${rule.id}`,
          recordId: record.id,
          recordTitle: record.title,
          ...rule,
        },
      });
    });
  }
  hits.sort(
    (a, b) =>
      LEVEL_ORDER[a.hit.level] - LEVEL_ORDER[b.hit.level] ||
      byCodeUnit(a.hit.recordId, b.hit.recordId) ||
      a.order - b.order,
  );
  return hits.map(({ hit }) => hit);
}

export function tokens(state, id, filter = {}) {
  const rows = [];
  for (const [part, conditions] of Object.entries(state.records.get(id)?.tokens ?? {})) {
    if (filter.part && part !== filter.part) continue;
    for (const [condition, properties] of Object.entries(conditions)) {
      if (filter.condition && condition !== filter.condition) continue;
      for (const [property, token] of Object.entries(properties)) {
        if (filter.property && property !== filter.property) continue;
        const values = state.resolveToken?.(token);
        rows.push({
          part,
          condition,
          property,
          token,
          ...(values ? { values: { ...values } } : {}),
        });
      }
    }
  }
  return rows;
}
