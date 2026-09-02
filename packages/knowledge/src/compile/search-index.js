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
    const terms = tokenize([record.title, record.summary, record.tags.join(" "), record.body].join(" "));
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

function tokenize(text) {
  return new Set(
    text
      .toLowerCase()
      .split(/[^a-z0-9]+/u)
      .filter((term) => term.length >= 2 && !STOPWORDS.has(term)),
  );
}
