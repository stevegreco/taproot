import { buildLinks } from "./links.js";
import * as query from "./query.js";
import { render } from "./render.js";
import { indexRecord } from "./search.js";
import { byCodeUnit, deepFreeze } from "./util.js";

/**
 * @typedef {"component" | "pattern" | "guideline" | "example"} RecordType
 * @typedef {"draft" | "stable" | "deprecated"} Status
 * @typedef {"content" | "behavior" | "accessibility"} Topic
 * @typedef {"must" | "should" | "may"} Level
 * @typedef {"alternative" | "alternative-to" | "composes" | "used-in" | "follows" | "followed-by" | "example-of" | "examples" | "related"} LinkKind
 *
 * @typedef {{ id: string, type: RecordType, title: string, summary: string, tags: string[], status: Status }} Summary
 * @typedef {Summary & { score: number, matches: string[] }} Hit
 * @typedef {{ from: string, to: string, kind: LinkKind, source: "links" | "usage" | "rule" | "parameter", fromSection?: string, situation?: string, why?: string }} Link
 * @typedef {{ target: string, recordId: string, section: string, title: string, content: unknown }} Section
 * @typedef {{ part: string, condition: string, property: string, token: string, values?: Record<string, string> }} TokenRow
 * @typedef {{ address: string, recordId: string, recordTitle: string, id: string, level: Level, topic: Topic, statement: string, applicability?: string, rationale?: string, references?: string[], examples?: { do?: string[], avoid?: string[] } }} RuleHit
 *
 * @typedef {object} Spec
 * @property {string} contentDir
 * @property {import("./validate.js").Issue[]} issues Issues in the files left out of the index;
 *   empty unless the spec was loaded with `skipInvalid`.
 * @property {(filter?: { type?: RecordType, tag?: string, status?: Status }) => Summary[]} list
 * @property {(id: string) => any} get
 * @property {(target: string) => Section | undefined} section
 * @property {(query: string, options?: { type?: RecordType, tags?: string[], limit?: number }) => Hit[]} search
 * @property {(id: string, options?: { kind?: LinkKind, direction?: "out" | "in" | "both" }) => Link[]} links
 * @property {(filter?: { id?: string, topic?: Topic, level?: Level, query?: string }) => RuleHit[]} rules
 * @property {(id: string, filter?: { part?: string, condition?: string, property?: string }) => TokenRow[]} tokens
 * @property {(target: string, options?: { omit?: string[] }) => string} render
 * @property {(id: string) => Gaps | undefined} gaps What a record refers to that is not loaded,
 *   because it had issues; undefined when nothing is missing.
 *
 * @typedef {object} Gaps
 * @property {string[]} records Records this one links to that were left out.
 * @property {string[]} follows The followed records among them, whose rules are absent.
 * @property {import("./inherit.js").UnresolvedRule[]} rules This record's rules that narrow a rule
 *   of a left-out record, and are left out with it.
 */

/**
 * Build the in-memory index from records that already passed every check.
 *
 * @param {string} contentDir
 * @param {import("./validate.js").CheckedRecord[]} checked
 * @param {((ref: string) => Record<string, string> | undefined) | undefined} resolveToken
 * @param {import("./validate.js").Issue[]} [issues]
 * @returns {Spec}
 */
export function createSpec(contentDir, checked, resolveToken, issues = []) {
  const ordered = [...checked].sort((a, b) => byCodeUnit(a.data.id, b.data.id));

  /** @type {query.State} */
  const state = {
    contentDir,
    records: new Map(),
    sections: new Map(),
    links: [],
    searchIndex: new Map(),
    resolveToken,
  };
  for (const { source, data, sections, unfinished } of ordered) {
    const record = {
      ...data,
      status: data.status ?? "stable",
      tags: data.tags ?? [],
      file: source.file,
      ...(unfinished ? { unfinished } : {}),
      ...(source.body === undefined ? {} : { body: source.body }),
      sections: [...sections.keys()],
    };
    state.records.set(data.id, deepFreeze(record));
    state.sections.set(data.id, sections);
    state.searchIndex.set(data.id, indexRecord(record));
  }
  state.links = deepFreeze(buildLinks([...state.records.values()]));

  return Object.freeze({
    contentDir,
    issues: deepFreeze(issues),
    list: (filter) => query.list(state, filter),
    get: (id) => state.records.get(id),
    section: (target) => query.section(state, target),
    search: (text, options) => query.search(state, text, options),
    links: (id, options) => query.links(state, id, options),
    rules: (filter) => query.rules(state, filter),
    tokens: (id, filter) => query.tokens(state, id, filter),
    render: (target, options) => render(state, target, options),
    gaps: (id) => query.gaps(state, id),
  });
}
