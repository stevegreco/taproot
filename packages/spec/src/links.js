import { RECORD_ID } from "./schema/info.js";
import { byCodeUnit, recordIdOf } from "./util.js";

export const INVERSE = {
  alternative: "alternative-to",
  "alternative-to": "alternative",
  composes: "used-in",
  "used-in": "composes",
  follows: "followed-by",
  "followed-by": "follows",
  "example-of": "examples",
  examples: "example-of",
  related: "related",
};

/**
 * Every link in the corpus: the ones authored or derived from fields, and their inverses.
 * A link derived from a parameter value's `guidance` carries `fromSection`, and its inverse points at
 * that section. Deduplicated on (from, fromSection, to, kind, situation), so two `usage.avoid` entries that name the same
 * alternative both survive, and sorted by kind, then `to`, then `from`.
 *
 * @param {Record<string, any>[]} records
 * @returns {import("./spec.js").Link[]}
 */
export function buildLinks(records) {
  const links = new Map();
  const add = (link) => {
    const key = `${link.from}\t${link.fromSection ?? ""}\t${link.to}\t${link.kind}\t${link.situation ?? ""}`;
    if (!links.has(key)) links.set(key, link);
  };

  for (const record of records) {
    for (const link of declaredLinks(record)) {
      if (recordIdOf(link.to) === link.from) continue;
      add(link);
      const back = link.fromSection ? `${link.from}#${link.fromSection}` : link.from;
      const { fromSection: _, ...inverse } = link;
      add({ ...inverse, from: recordIdOf(link.to), to: back, kind: INVERSE[link.kind] });
    }
  }
  return [...links.values()].sort(
    (a, b) => byCodeUnit(a.kind, b.kind) || byCodeUnit(a.to, b.to) || byCodeUnit(a.from, b.from),
  );
}

function* declaredLinks(record) {
  const from = record.id;
  for (const [kind, targets] of Object.entries(record.links ?? {})) {
    for (const to of targets) yield { from, to, kind, source: "links" };
  }
  for (const item of record.usage?.avoid ?? []) {
    if (typeof item.instead === "string" && RECORD_ID.test(item.instead)) {
      yield {
        from,
        to: item.instead,
        kind: "alternative",
        source: "usage",
        situation: item.situation,
        ...(item.why ? { why: item.why } : {}),
      };
    }
  }
  for (const [name, parameter] of Object.entries(record.parameters ?? {})) {
    for (const [value, to] of Object.entries(parameter.guidance ?? {})) {
      yield {
        from,
        fromSection: `parameters.${name}.${value}`,
        to,
        kind: "follows",
        source: "parameter",
      };
    }
  }
  for (const rule of record.rules ?? []) {
    for (const to of rule.references ?? []) {
      const prefix = to.split(".")[0];
      const kind = prefix === "pattern" || prefix === "guideline" ? "follows" : "related";
      yield { from, to, kind, source: "rule" };
    }
  }
}
