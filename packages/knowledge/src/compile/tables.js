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
  RECORD_UNREADABLE: "record/unreadable",
  CORPUS_DUPLICATE_ID: "corpus/duplicate-id",
  CORPUS_DUPLICATE_ASSET_ID: "corpus/duplicate-asset-id",
  CORPUS_ROOT_UNREADABLE: "corpus/root-unreadable",
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

export const COMPILED_FIELD_VIEW = Object.freeze({
  id: "frontmatter",
  jobs: "frontmatter",
  status: "frontmatter",
  summary: "frontmatter",
  tags: "frontmatter",
  title: "frontmatter",
  type: "frontmatter",
  visibility: "frontmatter",
  body: "body",

  annotations: "record",
  assets: "record",
  backlinks: "record",
  checks: "record",
  compiledSchemaVersion: "record",
  contract: "record",
  decisions: "record",
  host: "record",
  relations: "record",
  schemaVersion: "record",
  sources: "record",
  tokenRef: "record",
  tokens: "record",
});

export const NARRATIVE_FRONTMATTER_KEYS = Object.freeze(
  Object.keys(COMPILED_FIELD_VIEW)
    .filter((key) => COMPILED_FIELD_VIEW[key] === "frontmatter")
    .sort(),
);

export const RECORD_ONLY_FIELDS = Object.freeze(
  Object.keys(COMPILED_FIELD_VIEW)
    .filter((key) => COMPILED_FIELD_VIEW[key] === "record")
    .sort(),
);

const FIELD_NAME = String.raw`\b(?:contract|host|checks)\b`;
const MARKDOWN_PATH = String.raw`markdown\/[a-z0-9][a-z0-9.-]*\.md`;
const SPEC_ID = String.raw`\bspec\.[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*\b`;
const NEAR = String.raw`[\s\S]{0,80}`;

const MARKDOWN_FIELD_CLAIM_RULES = Object.freeze([
  Object.freeze({
    id: "markdown-path-field-owner",
    source: `${MARKDOWN_PATH}${NEAR}${FIELD_NAME}|${FIELD_NAME}${NEAR}${MARKDOWN_PATH}`,
    flags: "gi",
  }),
  Object.freeze({
    id: "authoritative-field-with-markdown",
    source: String.raw`\bauthoritative\b${NEAR}${FIELD_NAME}|${FIELD_NAME}${NEAR}\bauthoritative\b`,
    flags: "gi",
    needsMarkdownPath: true,
  }),
  Object.freeze({
    id: "spec-id-contract-home",
    source: SPEC_ID,
    flags: "gi",
  }),
]);

export function isNarrativeFrontmatterKeys(keys) {
  if (!Array.isArray(keys) || keys.length !== NARRATIVE_FRONTMATTER_KEYS.length) {
    return false;
  }
  return [...keys]
    .sort()
    .every((key, index) => key === NARRATIVE_FRONTMATTER_KEYS[index]);
}

export function findMarkdownFieldClaims(body) {
  if (typeof body !== "string" || body.length === 0) {
    return [];
  }
  const hasMarkdownPath = new RegExp(MARKDOWN_PATH, "i").test(body) || /\.md\b/i.test(body);
  const claims = [];
  for (const rule of MARKDOWN_FIELD_CLAIM_RULES) {
    if (rule.needsMarkdownPath && !hasMarkdownPath) continue;
    for (const match of body.matchAll(new RegExp(rule.source, rule.flags))) {
      claims.push({ pattern: rule.id, excerpt: match[0] });
    }
  }
  return claims;
}

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
