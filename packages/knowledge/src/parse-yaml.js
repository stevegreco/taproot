import { parseAllDocuments } from "yaml";

/**
 * Parse a single YAML mapping and fail on duplicate keys, aliases, and
 * multi-document sources. Paths are JSON Pointers when the YAML error names a
 * key; otherwise the issue is record-level.
 *
 * @param {string} text
 * @returns {{ ok: true, data: object } | { ok: false, issues: { path: string, keyword: string, message: string }[] }}
 */
export function parseYamlMapping(text) {
  let documents;
  try {
    documents = parseAllDocuments(text, {
      uniqueKeys: true,
      strict: true,
      prettyErrors: true,
    });
  } catch (error) {
    return {
      ok: false,
      issues: [
        {
          path: "",
          keyword: "yaml",
          message: error instanceof Error ? error.message : "YAML is malformed",
        },
      ],
    };
  }

  const issues = [];
  for (const document of documents) {
    for (const error of document.errors) {
      issues.push(yamlErrorIssue(error));
    }
  }
  if (issues.length > 0) {
    return { ok: false, issues };
  }
  if (documents.length === 0) {
    return {
      ok: false,
      issues: [{ path: "", keyword: "yaml", message: "YAML document is missing" }],
    };
  }
  if (documents.length !== 1) {
    return {
      ok: false,
      issues: [
        {
          path: "",
          keyword: "yaml",
          message: "YAML source must contain exactly one document",
        },
      ],
    };
  }

  let data;
  try {
    data = documents[0].toJS({ maxAliasCount: 0 });
  } catch (error) {
    return {
      ok: false,
      issues: [
        {
          path: "",
          keyword: "yaml",
          message: error instanceof Error ? error.message : "YAML aliases are not allowed",
        },
      ],
    };
  }
  if (data == null || typeof data !== "object" || Array.isArray(data)) {
    return {
      ok: false,
      issues: [{ path: "", keyword: "yaml", message: "YAML document must be a mapping" }],
    };
  }
  return { ok: true, data };
}

function yamlErrorIssue(error) {
  if (error.code === "DUPLICATE_KEY") {
    const key = duplicateKeyName(error);
    return {
      path: key ? `/${key}` : "",
      keyword: "uniqueKeys",
      message: key ? `duplicate YAML key ${key}` : "YAML mapping keys must be unique",
    };
  }
  return {
    path: "",
    keyword: "yaml",
    message: error.message ?? "YAML is malformed",
  };
}

function duplicateKeyName(error) {
  const message = String(error.message ?? "");
  const repeated = message.match(/"([^"]+)" is repeated/);
  if (repeated) return repeated[1];
  const lines = message.split("\n");
  const caret = lines.findIndex((line) => /^\s*\^/.test(line));
  if (caret > 0) {
    const source = lines[caret - 1];
    const match = source.match(/^([^:#]+):/);
    if (match) return match[1].trim().replace(/^["']|["']$/g, "");
  }
  return null;
}
