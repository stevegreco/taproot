const STOPWORDS = Object.freeze(
  new Set([
    "a",
    "an",
    "and",
    "are",
    "as",
    "at",
    "be",
    "by",
    "for",
    "from",
    "if",
    "in",
    "into",
    "is",
    "it",
    "its",
    "not",
    "of",
    "on",
    "or",
    "that",
    "the",
    "this",
    "to",
    "was",
    "were",
    "with",
  ]),
);

export function buildSearchIndex(records) {
  /** @type {Map<string, Set<number>>} */
  const postings = new Map();

  records.forEach((record, index) => {
    const terms = tokenize(collectSearchText(record));
    for (const term of terms) {
      const ids = postings.get(term);
      if (ids) ids.add(index);
      else postings.set(term, new Set([index]));
    }
  });

  const terms = {};
  for (const term of [...postings.keys()].sort()) {
    terms[term] = Object.freeze([...postings.get(term)].sort((left, right) => left - right));
  }

  return {
    version: 1,
    records: records.map((record) => record.id),
    terms: Object.freeze(terms),
  };
}

/**
 * Title, summary, tags, and body, plus type-specific structured facts.
 * Does not include `id`, `type`, or `jobs`.
 *
 * @param {object} record
 */
export function collectSearchText(record) {
  return [
    record.title,
    record.summary,
    (record.tags ?? []).join(" "),
    record.body,
    ...collectContractTerms(record.contract),
    ...collectHostTerms(record.web),
  ]
    .filter((part) => typeof part === "string" && part.length > 0)
    .join(" ");
}

/**
 * Split on any run of characters outside `[a-z0-9]`. Accented and non-Latin
 * letters become separators, so `café` indexes as `caf`. That is an
 * English-only design-system choice, not an oversight.
 */
export function tokenize(text) {
  return new Set(
    text
      .toLowerCase()
      .split(/[^a-z0-9]+/u)
      .filter((term) => term.length >= 2 && !STOPWORDS.has(term)),
  );
}

/**
 * Usage situations, anatomy names, parameter names, enum values, event names,
 * states, and accessibility requirement text.
 *
 * @param {object|undefined} contract
 * @returns {string[]}
 */
function collectContractTerms(contract) {
  if (contract == null || typeof contract !== "object") return [];
  const parts = [];

  for (const item of contract.usage?.do ?? []) {
    pushString(parts, item?.situation);
  }
  for (const item of contract.usage?.avoid ?? []) {
    pushString(parts, item?.situation);
    pushString(parts, item?.instead);
    pushString(parts, item?.why);
  }

  collectRuleTerms(parts, contract.content);
  collectRuleTerms(parts, contract.behavior);

  for (const part of contract.anatomy ?? []) {
    pushString(parts, part?.name);
  }

  for (const [name, parameter] of sortedEntries(contract.parameters)) {
    parts.push(name);
    for (const value of Object.keys(parameter?.values ?? {}).sort()) {
      parts.push(value);
    }
  }

  for (const name of Object.keys(contract.events ?? {}).sort()) {
    parts.push(name);
  }

  for (const state of contract.states ?? []) {
    pushString(parts, state);
  }

  collectRuleTerms(parts, contract.accessibility?.requirements);

  return parts;
}

function collectRuleTerms(parts, rules) {
  for (const rule of rules ?? []) {
    if (typeof rule === "string") {
      pushString(parts, rule);
      continue;
    }
    pushString(parts, rule?.statement);
    pushString(parts, rule?.applicability);
    pushString(parts, rule?.rationale);
    for (const example of rule?.examples?.do ?? []) pushString(parts, example);
    for (const example of rule?.examples?.avoid ?? []) pushString(parts, example);
  }
}

/**
 * Default tag name, slot and part names, and attribute and property names.
 *
 * @param {object|undefined} host
 * @returns {string[]}
 */
function collectHostTerms(host) {
  if (host == null || typeof host !== "object") return [];
  const parts = [];
  pushString(parts, host.defaultTagName);

  for (const [, anatomy] of sortedEntries(host.anatomy)) {
    pushString(parts, anatomy?.slot);
    pushString(parts, anatomy?.part);
  }

  for (const name of Object.keys(host.parts ?? {}).sort()) {
    parts.push(name);
  }

  for (const [, parameter] of sortedEntries(host.parameters)) {
    pushString(parts, parameter?.attribute);
    pushString(parts, parameter?.property);
  }

  return parts;
}

/**
 * @param {object|undefined} object
 * @returns {[string, object][]}
 */
function sortedEntries(object) {
  if (object == null || typeof object !== "object") return [];
  return Object.keys(object)
    .sort()
    .map((key) => [key, object[key]]);
}

/**
 * @param {string[]} parts
 * @param {unknown} value
 */
function pushString(parts, value) {
  if (typeof value === "string" && value.length > 0) parts.push(value);
}
