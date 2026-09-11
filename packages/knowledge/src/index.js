import grayMatter from "gray-matter";
import { parseYamlMapping } from "./parse-yaml.js";
import { findSchemaIssues } from "./schema/validator.js";

export const YAML_SPEC_SUFFIX = ".spec.yaml";

const parseMatter = grayMatter.default ?? grayMatter;

export class KnowledgeRecordError extends Error {
  constructor(sourcePath, issues) {
    const details = issues
      .map(({ path, message }) => `  ${path || "<record>"} ${message}`)
      .join("\n");
    super(`${sourcePath}: invalid knowledge record\n${details}`);
    this.name = "KnowledgeRecordError";
    this.sourcePath = sourcePath;
    this.issues = Object.freeze(issues);
  }
}

function structuralError(sourcePath, keyword, message) {
  return new KnowledgeRecordError(sourcePath, [{ path: "", keyword, message }]);
}

function applyAuthoredDefaults(data, sourcePath) {
  const next = { ...data };
  if (!Object.hasOwn(next, "schemaVersion")) {
    next.schemaVersion = 1;
  }
  if (!Object.hasOwn(next, "relations")) {
    next.relations = {};
  }
  if (!Object.hasOwn(next, "sources")) {
    next.sources = [{ kind: "authored", path: sourcePath }];
    return next;
  }
  if (!Array.isArray(next.sources)) {
    return next;
  }
  next.sources = next.sources.map((source) => {
    if (source == null || typeof source !== "object" || Array.isArray(source)) {
      return source;
    }
    if (source.kind === "authored" && !Object.hasOwn(source, "path")) {
      return { ...source, path: sourcePath };
    }
    return source;
  });
  if (!next.sources.some((source) => source?.kind === "authored")) {
    next.sources = [...next.sources, { kind: "authored", path: sourcePath }];
  }
  return next;
}

function readAuthoredMarkdown(markdown, sourcePath) {
  if (!/^---(?:\r\n|\r|\n)/.test(markdown)) {
    throw structuralError(sourcePath, "frontmatter", "YAML frontmatter is missing");
  }

  let parsed;
  try {
    parsed = parseMatter(markdown);
  } catch (error) {
    throw structuralError(
      sourcePath,
      "yaml",
      error instanceof Error ? error.message : "YAML frontmatter is malformed",
    );
  }

  const data = parsed.data;
  if (data == null || typeof data !== "object" || Array.isArray(data)) {
    throw structuralError(sourcePath, "frontmatter", "YAML frontmatter must be a mapping");
  }

  return parsed;
}

export function parseRecord(markdown, options) {
  if (typeof markdown !== "string") {
    throw new TypeError("markdown must be a string");
  }

  if (typeof options?.sourcePath !== "string") {
    throw new TypeError("options.sourcePath must be a string");
  }

  const parsed = readAuthoredMarkdown(markdown, options.sourcePath);
  const data = parsed.data;

  if (Object.hasOwn(data, "body")) {
    throw new KnowledgeRecordError(options.sourcePath, [
      {
        path: "/body",
        keyword: "frontmatter",
        message: "body is owned by the Markdown document, not frontmatter",
      },
    ]);
  }

  const candidate = applyAuthoredDefaults(
    { ...data, body: parsed.content.trim() },
    options.sourcePath,
  );
  const issues = findSchemaIssues(candidate);

  if (issues.length > 0) {
    throw new KnowledgeRecordError(options.sourcePath, issues);
  }

  return candidate;
}

export function isYamlSpecPath(sourcePath) {
  return typeof sourcePath === "string" && sourcePath.endsWith(YAML_SPEC_SUFFIX);
}

/**
 * Parse an authored Markdown or YAML component record. Filename suffix selects
 * the parser. Identity still comes from the document, not the path (KNOW-005).
 */
export function parseAuthoredRecord(text, options) {
  if (typeof text !== "string") {
    throw new TypeError("text must be a string");
  }
  if (typeof options?.sourcePath !== "string") {
    throw new TypeError("options.sourcePath must be a string");
  }
  if (isYamlSpecPath(options.sourcePath)) {
    return parseYamlRecord(text, options);
  }
  return parseRecord(text, options);
}

export function parseYamlRecord(yamlText, options) {
  if (typeof yamlText !== "string") {
    throw new TypeError("yamlText must be a string");
  }
  if (typeof options?.sourcePath !== "string") {
    throw new TypeError("options.sourcePath must be a string");
  }
  if (!isYamlSpecPath(options.sourcePath)) {
    throw new KnowledgeRecordError(options.sourcePath, [
      {
        path: "",
        keyword: "sourcePath",
        message: "YAML component records must use a .spec.yaml source path",
      },
    ]);
  }

  const parsed = parseYamlMapping(yamlText);
  if (!parsed.ok) {
    throw new KnowledgeRecordError(options.sourcePath, parsed.issues);
  }

  const data = parsed.data;
  if (Object.hasOwn(data, "body")) {
    throw new KnowledgeRecordError(options.sourcePath, [
      {
        path: "/body",
        keyword: "yaml",
        message: "body is generated from the structured record, not authored in YAML",
      },
    ]);
  }

  const candidate = applyAuthoredDefaults(data, options.sourcePath);
  const issues = findSchemaIssues(candidate);
  if (candidate.type != null && candidate.type !== "component") {
    issues.push({
      path: "/type",
      keyword: "const",
      message: "YAML spec files must be type component",
    });
  }
  if (!Object.hasOwn(candidate, "contract") || candidate.contract == null) {
    issues.push({
      path: "/contract",
      keyword: "required",
      message: "is required",
    });
  }
  issues.sort((left, right) => {
    const byPath = left.path.localeCompare(right.path);
    return byPath === 0 ? left.keyword.localeCompare(right.keyword) : byPath;
  });
  if (issues.length > 0) {
    throw new KnowledgeRecordError(options.sourcePath, issues);
  }

  return candidate;
}
