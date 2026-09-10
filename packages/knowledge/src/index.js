import grayMatter from "gray-matter";
import { findSchemaIssues } from "./schema/validator.js";

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
