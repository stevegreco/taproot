import { parseYamlMapping, yamlLocator } from "./parse-yaml.js";
import { findSchemaIssues } from "./schema/validator.js";
import { byCodeUnit } from "./sort.js";

export const YAML_SPEC_SUFFIX = ".spec.yaml";

export class KnowledgeRecordError extends Error {
  /**
   * @param {string} sourcePath
   * @param {readonly { path: string, keyword: string, message: string, line?: number }[]} issues
   * @param {{ recordId?: string }} [options] The id the invalid record declared, when it had one.
   */
  constructor(sourcePath, issues, options = {}) {
    const details = issues
      .map(
        ({ path, message, line }) =>
          `  ${line ? `line ${line} ` : ""}${path || "<record>"} ${message}`,
      )
      .join("\n");
    super(`${sourcePath}: invalid knowledge record\n${details}`);
    this.name = "KnowledgeRecordError";
    this.sourcePath = sourcePath;
    this.recordId = typeof options.recordId === "string" ? options.recordId : null;
    this.issues = Object.freeze(issues);
  }
}

/** Attach the source line to each issue the locator can place. */
function withLines(issues, locate) {
  return issues.map((issue) => {
    const line = issue.path ? locate(issue.path) : null;
    return line ? { ...issue, line } : issue;
  });
}

function structuralError(sourcePath, keyword, message) {
  return new KnowledgeRecordError(sourcePath, [{ path: "", keyword, message }]);
}

function applyAuthoredDefaults(data, sourcePath) {
  const next = { ...data };
  if (!Object.hasOwn(next, "schemaVersion")) {
    next.schemaVersion = 1;
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
    next.sources = [{ kind: "authored", path: sourcePath }, ...next.sources];
  }
  return next;
}

/**
 * Split a Markdown record into frontmatter and body. The frontmatter goes through the same
 * strict YAML parser as `.spec.yaml` files. A leading newline stands in for the opening `---`,
 * so YAML line numbers match file lines.
 */
function readAuthoredMarkdown(markdown, sourcePath) {
  const match = /^\uFEFF?---[ \t]*\r?\n(?:([\s\S]*?)\r?\n)?---[ \t]*(?:\r?\n|$)/.exec(markdown);
  if (!match) {
    throw structuralError(sourcePath, "frontmatter", "YAML frontmatter is missing");
  }
  const matter = `\n${match[1] ?? ""}`;
  const parsed = parseYamlMapping(matter);
  if (!parsed.ok) {
    throw new KnowledgeRecordError(sourcePath, parsed.issues, {
      recordId: recoverTopLevelId(matter),
    });
  }
  return { data: parsed.data, matter, content: markdown.slice(match[0].length) };
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
    throw new KnowledgeRecordError(
      options.sourcePath,
      withLines(issues, yamlLocator(parsed.matter)),
      { recordId: data.id },
    );
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
    throw new KnowledgeRecordError(options.sourcePath, parsed.issues, {
      recordId: recoverTopLevelId(yamlText),
    });
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
    const byPath = byCodeUnit(left.path, right.path);
    return byPath === 0 ? byCodeUnit(left.keyword, right.keyword) : byPath;
  });
  if (issues.length > 0) {
    throw new KnowledgeRecordError(options.sourcePath, withLines(issues, yamlLocator(yamlText)), {
      recordId: data.id,
    });
  }

  return candidate;
}

/**
 * The top-level `id` of text that failed to parse, so other records' references to it are not
 * reported as unresolved on top of the parse error.
 */
function recoverTopLevelId(text) {
  return /^id:[ \t]*["']?([a-z0-9][a-z0-9.-]*)["']?[ \t]*(?:#.*)?$/m.exec(text)?.[1];
}

/**
 * Map JSON Pointers into an authored record to file line numbers, for problems found after
 * parsing. Returns null for every pointer when the text cannot be read as a record.
 *
 * @param {string} text
 * @param {string} sourcePath
 * @returns {(pointer: string) => number | null}
 */
export function recordLocator(text, sourcePath) {
  if (isYamlSpecPath(sourcePath)) return yamlLocator(text);
  try {
    return yamlLocator(readAuthoredMarkdown(text, sourcePath).matter);
  } catch {
    return () => null;
  }
}
