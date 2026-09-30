import path from "node:path";
import { fileURLToPath } from "node:url";
import { createKnowledge } from "./knowledge.js";
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
 * @typedef {import("./knowledge.js").Knowledge} Knowledge
 *
 * @typedef {object} LoadOptions
 * @property {string} [contentDir] Absolute, or relative to the working directory.
 * @property {(ref: string) => Record<string, string> | undefined} [resolveToken]
 *   Resolves a token reference to values keyed by set name, such as `{ light, dark }`.
 */

export class KnowledgeError extends Error {
  /** @param {Issue[]} issues */
  constructor(issues) {
    const lines = issues.map(
      (issue) =>
        `  ${issue.file}${issue.line ? `:${issue.line}` : ""} ${issue.path || "<record>"} ${issue.message}`,
    );
    super(
      `Invalid knowledge content (${issues.length} issue${issues.length === 1 ? "" : "s"}):\n${lines.join("\n")}`,
    );
    this.name = "KnowledgeError";
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
 * Read, validate, and index every record. Throws a `KnowledgeError` naming every issue.
 *
 * @param {LoadOptions} [options]
 * @returns {Promise<Knowledge>}
 */
export async function loadKnowledge(options = {}) {
  const { contentDir, issues, records } = await check(options);
  if (issues.length > 0) throw new KnowledgeError(issues);
  return createKnowledge(contentDir, records, options.resolveToken);
}

/**
 * Do the same work as `loadKnowledge`, and return the issues instead of throwing.
 *
 * @param {LoadOptions} [options]
 * @returns {Promise<{ issues: Issue[], recordCount: number }>}
 */
export async function validateKnowledge(options = {}) {
  const { issues, sources } = await check(options);
  return { issues, recordCount: sources.length };
}

/**
 * @param {Knowledge} knowledge
 * @param {string} target A record ID, or `id#section`.
 */
export function renderRecord(knowledge, target) {
  return knowledge.render(target);
}
