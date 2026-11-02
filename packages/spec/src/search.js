import { byCodeUnit, parameterLists } from "./util.js";

const STOP_WORDS = new Set(
  "a an and as at be by do for from how in is it of on or the to with".split(" "),
);
const SUFFIXES = [
  "ations",
  "ation",
  "ions",
  "ion",
  "ings",
  "ing",
  "ates",
  "ate",
  "ives",
  "ive",
  "ed",
  "es",
  "s",
  "e",
  "ly",
];

const FIELD_WEIGHTS = {
  title: 10,
  tags: 8,
  id: 6,
  summary: 4,
  description: 2,
  usage: 2,
  parameters: 1,
  body: 1,
};
const RULE_WEIGHT = 2;

/** Lowercase word stems, without stop words. Deterministic, no dictionary. */
export function tokenize(text) {
  return String(text)
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((word) => word && !STOP_WORDS.has(word))
    .map(stem);
}

function stem(word) {
  for (const suffix of SUFFIXES) {
    if (word.endsWith(suffix) && word.length - suffix.length >= 3)
      return word.slice(0, -suffix.length);
  }
  return word;
}

function collectText(value, out = []) {
  if (typeof value === "string") out.push(value);
  else if (Array.isArray(value)) for (const item of value) collectText(item, out);
  else if (value && typeof value === "object")
    for (const item of Object.values(value)) collectText(item, out);
  return out;
}

/**
 * `names` holds the title's and id's words plus each run together ("textfield"), for matching the
 * start of a name.
 *
 * @typedef {{ fields: Record<string, string[]>, rules: { id: string, tokens: string[] }[], names: string[] }} IndexedRecord
 */

const runTogether = (text) =>
  String(text)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "");

/**
 * @param {Record<string, any>} record
 * @returns {IndexedRecord}
 */
export function indexRecord(record) {
  const parameters = parameterLists(record)
    .flatMap(([, list]) => Object.values(list))
    .flatMap((parameter) => [
      ...collectText(parameter.description),
      ...collectText(parameter.values),
      ...collectText(parameter.examples),
    ]);
  const fields = {
    title: tokenize(record.title),
    tags: tokenize(record.tags.join(" ")),
    id: tokenize(record.id),
    summary: tokenize(record.summary),
    description: tokenize(record.description ?? ""),
    usage: tokenize(collectText(record.usage).join(" ")),
    parameters: tokenize(parameters.join(" ")),
    body: tokenize(record.body ?? ""),
  };
  const rules = (record.rules ?? []).map((rule) => ({
    id: rule.id,
    tokens: tokenize(collectText(rule).join(" ")),
  }));
  const shortId = record.id.slice(record.id.indexOf(".") + 1);
  const names = [
    ...new Set([...fields.title, ...fields.id, runTogether(record.title), runTogether(shortId)]),
  ];
  return { fields, rules, names };
}

/** A name prefix scores as a title match at this fraction of the title weight. */
const PREFIX_FRACTION = 0.6;
const MIN_PREFIX_LENGTH = 4;

/**
 * Whether `token` starts a word of a name and covers at least half of it, so "chec" finds Checkbox
 * and "textfi" finds Text field, but "comp" does not find every component.
 */
function startsAName(names, token) {
  if (token.length < MIN_PREFIX_LENGTH) return false;
  return names.some(
    (name) => name !== token && name.startsWith(token) && token.length * 2 >= name.length,
  );
}

/**
 * Score one indexed record. Each query word counts once per field, and a record that matches more
 * of the query words scores higher than one that matches a few of them strongly.
 *
 * @returns {{ score: number, matches: string[] }}
 */
export function scoreRecord(index, queryTokens) {
  let raw = 0;
  const matched = new Set();
  const matches = new Set();
  for (const token of queryTokens) {
    for (const [field, weight] of Object.entries(FIELD_WEIGHTS)) {
      const count = index.fields[field].filter((word) => word === token).length;
      if (count === 0) continue;
      raw += weight * (1 + 0.25 * Math.min(count - 1, 4));
      matched.add(token);
      matches.add(field);
    }
    const inName = index.fields.title.includes(token) || index.fields.id.includes(token);
    if (!inName && startsAName(index.names, token)) {
      raw += FIELD_WEIGHTS.title * PREFIX_FRACTION;
      matched.add(token);
      matches.add("name-prefix");
    }
    for (const rule of index.rules) {
      if (!rule.tokens.includes(token)) continue;
      raw += RULE_WEIGHT;
      matched.add(token);
      matches.add(`rule:${rule.id}`);
    }
  }
  const coverage = matched.size / queryTokens.length;
  const score = Math.round(raw * coverage * coverage * 1000) / 1000;
  return { score, matches: [...matches].sort(byCodeUnit) };
}
