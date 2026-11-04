import path from "node:path";
import { fileURLToPath } from "node:url";
import { createSpec } from "./spec.js";
import { readSourceFiles } from "./load.js";
import { schema } from "./schema/info.js";
import { checkSources } from "./validate.js";

export { schema };

/** Absolute path of the content folder shipped with this package. */
export const DEFAULT_CONTENT_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../content",
);

/**
 * @typedef {import("./validate.js").Issue} Issue
 * @typedef {import("./spec.js").Spec} Spec
 *
 * @typedef {object} LoadOptions
 * @property {string} [contentDir] Absolute, or relative to the working directory.
 * @property {(ref: string) => Record<string, string> | undefined} [resolveToken]
 *   Resolves a token reference to values keyed by set name, such as `{ light, dark }`.
 * @property {Map<string, Set<string>>} [tokenNames] The token names in each set. With them,
 *   validation checks that every token reference names a token in every set.
 * @property {boolean} [skipInvalid] Leave out each record file that has an issue, and list the
 *   issues in `spec.issues`, instead of throwing.
 */

export class SpecError extends Error {
  /** @param {Issue[]} issues */
  constructor(issues) {
    const lines = issues.map(
      (issue) =>
        `  ${issue.file}${issue.line ? `:${issue.line}` : ""} ${issue.path || "<record>"} ${issue.message}`,
    );
    super(
      `Invalid spec content (${issues.length} issue${issues.length === 1 ? "" : "s"}):\n${lines.join("\n")}`,
    );
    this.name = "SpecError";
    /** @type {Issue[]} */
    this.issues = issues;
  }
}

/**
 * Read and check every record without indexing it. A snapshot is built from these.
 *
 * @param {LoadOptions} [options]
 */
export async function check(options = {}) {
  const contentDir = path.resolve(options.contentDir ?? DEFAULT_CONTENT_DIR);
  const sources = await readSourceFiles(contentDir);
  const { issues, records } = await checkSources(sources, { tokenNames: options.tokenNames });
  return { contentDir, sources, issues, records };
}

/**
 * Read, validate, and index every record. Throws a `SpecError` naming every issue, unless
 * `skipInvalid` is set.
 *
 * @param {LoadOptions} [options]
 * @returns {Promise<Spec>}
 */
export async function loadSpec(options = {}) {
  const { contentDir, issues, records } = await check(options);
  if (issues.length > 0 && !options.skipInvalid) throw new SpecError(issues);
  const invalid = new Set(issues.map((issue) => issue.file));
  const valid = records.filter((record) => !invalid.has(record.source.file));
  return createSpec(contentDir, valid, options.resolveToken, issues);
}

/**
 * Do the same work as `loadSpec`, and return the issues instead of throwing.
 *
 * @param {LoadOptions} [options]
 * @returns {Promise<{ issues: Issue[], recordCount: number }>}
 */
export async function validateSpec(options = {}) {
  const { issues, sources } = await check(options);
  return { issues, recordCount: sources.length };
}

/**
 * @param {Spec} spec
 * @param {string} target A record ID, or `id#section`.
 */
export function renderRecord(spec, target) {
  return spec.render(target);
}
