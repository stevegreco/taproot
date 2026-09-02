/** @typedef {"error"|"warning"} Severity */

/**
 * @typedef {object} Problem
 * @property {Severity} severity
 * @property {ProblemCode} code
 * @property {string} message
 * @property {string|null} recordId
 * @property {string|null} path
 */

export const PROBLEM = Object.freeze({
  RECORD_INVALID: "record/invalid",
  RECORD_PATH_MISMATCH: "record/path-mismatch",
  RECORD_SCHEMA_UNSUPPORTED: "record/schema-unsupported",
  CORPUS_DUPLICATE_ID: "corpus/duplicate-id",
  CORPUS_UNRESOLVED_RELATION: "corpus/unresolved-relation",
  CORPUS_UNRESOLVED_ANNOTATION: "corpus/unresolved-annotation-target",
  CORPUS_SELF_RELATION: "corpus/self-relation",
  CORPUS_INCOMPLETE_EXAMPLE: "corpus/incomplete-example",
  CORPUS_INCOMPLETE_CHECKS: "corpus/incomplete-checks",
  SOURCE_MISSING: "source/missing",
  SOURCE_UNREADABLE: "source/unreadable",
  SOURCE_CONFLICT: "source/conflict",
  ASSET_MISSING: "asset/missing",
  ASSET_DIMENSION_MISMATCH: "asset/dimension-mismatch",
  BODY_UNRESOLVED_LINK: "body/unresolved-link",
  VISIBILITY_LEAK: "visibility/leak",
  VISIBILITY_INTERNAL_PUBLIC: "visibility/internal-declares-public",
  PATH_OUTSIDE_ROOT: "path/outside-root",
  COMPILED_INVALID: "compiled/invalid",
});

/** @typedef {typeof PROBLEM[keyof typeof PROBLEM]} ProblemCode */

export const REVERSE_RELATION = Object.freeze({
  uses: "usedBy",
  demonstrates: "demonstratedBy",
  guides: "guidedBy",
  implements: "implementedBy",
  reviews: "reviewedBy",
  supersedes: "supersededBy",
  related: "related",
});

export const SIZE_BRIDGE = Object.freeze({ sm: "small", md: "medium" });

/**
 * @param {object} fields
 * @param {ProblemCode} fields.code
 * @param {string} fields.message
 * @param {string|null} [fields.recordId]
 * @param {string|null} [fields.path]
 * @param {Severity} [fields.severity]
 * @returns {Problem}
 */
export function problem({
  code,
  message,
  recordId = null,
  path = null,
  severity = "error",
}) {
  return { severity, code, message, recordId, path };
}
