import path from "node:path";
import { fileURLToPath } from "node:url";
import { collectKnownIssues } from "./known-issues.js";
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

async function check(options = {}) {
  const contentDir = path.resolve(options.contentDir ?? DEFAULT_CONTENT_DIR);
  const sources = await readSourceFiles(contentDir);
  const { issues, records } = await checkSources(sources);
  return { contentDir, sources, issues, records };
}

/**
 * Read, validate, and index every record. Throws a `SpecError` naming every issue.
 *
 * @param {LoadOptions} [options]
 * @returns {Promise<Spec>}
 */
export async function loadSpec(options = {}) {
  const { contentDir, issues, records } = await check(options);
  if (issues.length > 0) throw new SpecError(issues);
  return createSpec(contentDir, records, options.resolveToken);
}

/**
 * Do the same work as `loadSpec`, and return the issues instead of throwing.
 * `knownIssues` lists the `known-issues` entries of the records that passed their schema.
 *
 * @param {LoadOptions} [options]
 * @returns {Promise<{ issues: Issue[], recordCount: number, knownIssues: import("./known-issues.js").KnownIssue[] }>}
 */
export async function validateSpec(options = {}) {
  const { issues, sources, records } = await check(options);
  return { issues, recordCount: sources.length, knownIssues: collectKnownIssues(records) };
}

/**
 * @param {Spec} spec
 * @param {string} target A record ID, or `id#section`.
 */
export function renderRecord(spec, target) {
  return spec.render(target);
}
