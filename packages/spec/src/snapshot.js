import { createSpec } from "./spec.js";

/**
 * Everything the read-only tools need, as plain JSON, for a host with no file system. See ADR 0006.
 *
 * @typedef {object} Snapshot
 * @property {{ file: string, data: Record<string, any>, body?: string, sections: [string, import("./sections.js").SectionEntry][] }[]} records
 * @property {Record<string, { technology: import("./implementation.js").Technology, items: import("./implementation.js").Implementation[], setup?: string }>} implementations
 * @property {Record<string, string>} constants
 * @property {Record<string, Record<string, string>>} tokens Token reference to value in each set.
 */

/**
 * Open a snapshot. This module and what it imports use no Node APIs. `resolveTokens` adds token
 * values to every `spec.tokens` row, as a spec loaded with a token resolver does.
 *
 * @param {Snapshot} snapshot
 * @param {{ resolveTokens?: boolean }} [options]
 */
export function openSnapshot(snapshot, { resolveTokens = false } = {}) {
  const resolveToken = (ref) =>
    Object.hasOwn(snapshot.tokens, ref) ? snapshot.tokens[ref] : undefined;
  const checked = snapshot.records.map(({ file, data, body, sections }) => ({
    source: { file, body },
    data,
    sections: new Map(sections),
  }));
  return {
    spec: createSpec("", checked, resolveTokens ? resolveToken : undefined),
    resolveToken,
    constants: snapshot.constants,
    implementations: Object.fromEntries(
      Object.entries(snapshot.implementations).map(([name, { technology, items, setup }]) => [
        name,
        { technology, load: () => items, setup: () => setup },
      ]),
    ),
  };
}
