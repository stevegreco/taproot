import { scoreRecord, tokenize } from "./search.js";
import { INVERSE } from "./links.js";
import { byCodeUnit, editDistance, recordIdOf, typoAllowance } from "./util.js";

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
/** Hits scoring below this fraction of the top hit are dropped. */
const RELEVANCE_FLOOR = 0.25;

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

/** Every word in the search index, built once per state. */
const vocabularies = new WeakMap();
function vocabulary(state) {
  let words = vocabularies.get(state);
  if (!words) {
    words = new Set();
    for (const { fields, rules } of state.searchIndex.values()) {
      for (const tokens of Object.values(fields)) for (const token of tokens) words.add(token);
      for (const rule of rules) for (const token of rule.tokens) words.add(token);
    }
    vocabularies.set(state, words);
  }
  return words;
}

/**
 * Replace each query word the index does not contain with the indexed words it is a likely typo
 * of, so "buton" finds Button. A word with no close match is kept and simply matches nothing.
 */
function correctTypos(state, tokens) {
  const words = vocabulary(state);
  return tokens.flatMap((token) => {
    if (words.has(token)) return [token];
    const allowance = typoAllowance(token);
    if (allowance === 0) return [token];
    let best = allowance + 1;
    let found = [];
    for (const word of words) {
      if (Math.abs(word.length - token.length) > allowance) continue;
      const distance = editDistance(token, word);
      if (distance < best) [best, found] = [distance, [word]];
      else if (distance === best) found.push(word);
    }
    return found.length ? found.sort(byCodeUnit) : [token];
  });
}

export function search(state, query, options = {}) {
  const queryTokens = [...new Set(correctTypos(state, [...new Set(tokenize(query))]))];
  if (queryTokens.length === 0) return [];
  const hits = [];
  for (const record of state.records.values()) {
    if (options.type && record.type !== options.type) continue;
    if (options.tags && !options.tags.every((tag) => record.tags.includes(tag))) continue;
    const { score, matches } = scoreRecord(state.searchIndex.get(record.id), queryTokens);
    if (score > 0) hits.push({ ...summarize(record), score, matches });
  }
  hits.sort((a, b) => b.score - a.score || byId(a, b));
  // A record that shares one common word with the query is noise next to a strong match.
  const floor = (hits[0]?.score ?? 0) * RELEVANCE_FLOOR;
  return hits.filter((hit) => hit.score >= floor).slice(0, options.limit ?? DEFAULT_SEARCH_LIMIT);
}

export function links(state, id, options = {}) {
  const direction = options.direction ?? "out";
  const ofKind = (link) => !options.kind || link.kind === options.kind;
  // `state.links` is already sorted by kind, then `to`, then `from`.
  const out = state.links.filter((link) => link.from === id);
  const incoming = state.links.filter((link) => recordIdOf(link.to) === id);
  let found;
  if (direction === "out") found = out;
  else if (direction === "in") found = incoming;
  else {
    // Every incoming link is stored again as its inverse going out, so "both" keeps only the
    // incoming links whose inverse is missing. Otherwise each relationship would appear twice.
    const outKeys = new Set(out.map(mirrorKey));
    const extra = incoming.filter(
      (link) =>
        !outKeys.has(mirrorKey({ ...link, from: id, to: link.from, kind: INVERSE[link.kind] })),
    );
    found = [...out, ...extra].sort(
      (a, b) => byCodeUnit(a.kind, b.kind) || byCodeUnit(a.to, b.to) || byCodeUnit(a.from, b.from),
    );
  }
  return found.filter(ofKind).map((link) => ({ ...link }));
}

// An inverse drops the `#section` of the link it mirrors, so compare record ids only.
const mirrorKey = (link) =>
  `${link.from}\t${recordIdOf(link.to)}\t${link.kind}\t${link.situation ?? ""}`;

export function rules(state, filter = {}) {
  const [recordId, ruleId] = filter.id ? filter.id.split("#") : [];
  const queryTokens = filter.query ? [...new Set(tokenize(filter.query))] : [];
  const hits = [];
  for (const record of state.records.values()) {
    if (recordId && record.id !== recordId) continue;
    const indexed = state.searchIndex.get(record.id).rules;
    (record.rules ?? []).forEach((rule, order) => {
      if (ruleId && rule.id !== ruleId) return;
      if (filter.topic && rule.topic !== filter.topic) return;
      if (filter.level && rule.level !== filter.level) return;
      if (queryTokens.length > 0) {
        // The rule's text values only, so field names such as `topic` never match.
        const words = new Set(indexed[order].tokens);
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
