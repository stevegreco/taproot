import { LineCounter, isMap, parseAllDocuments, parseDocument } from "yaml";

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
  const line = error.linePos?.[0]?.line;
  const at = line ? { line } : {};
  if (error.code === "DUPLICATE_KEY") {
    // The YAML error names the key but not its parents, so a pointer would be wrong.
    const key = duplicateKeyName(error);
    return {
      path: "",
      keyword: "uniqueKeys",
      message: key ? `duplicate YAML key ${key}` : "YAML mapping keys must be unique",
      ...at,
    };
  }
  return {
    path: "",
    keyword: "yaml",
    message: firstLine(error.message ?? "YAML is malformed"),
    ...at,
  };
}

/** The error's summary without the ` at line N, column M:` suffix and source excerpt. */
function firstLine(message) {
  return String(message)
    .split("\n")[0]
    .replace(/ at line \d+, column \d+:?$/, "");
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

/**
 * Map JSON Pointers into a YAML text to 1-based line numbers, so schema issues
 * can name the line. A pointer to a missing key resolves to its nearest
 * existing parent.
 *
 * @param {string} text
 * @returns {(pointer: string) => number | null}
 */
export function yamlLocator(text) {
  const lineCounter = new LineCounter();
  let document;
  try {
    document = parseDocument(text, { lineCounter });
  } catch {
    return () => null;
  }
  const lineAt = (offset) => lineCounter.linePos(offset).line;

  return (pointer) => {
    const segments = pointer
      .split("/")
      .slice(1)
      .map((segment) => segment.replaceAll("~1", "/").replaceAll("~0", "~"));
    while (segments.length > 0) {
      const parent =
        segments.length === 1 ? document.contents : document.getIn(segments.slice(0, -1), true);
      const key = segments.at(-1);
      if (isMap(parent)) {
        const pair = parent.items.find((item) => String(item.key?.value ?? item.key) === key);
        if (pair?.key?.range) return lineAt(pair.key.range[0]);
      } else {
        const node = document.getIn(segments, true);
        if (node?.range) return lineAt(node.range[0]);
      }
      segments.pop();
    }
    return document.contents?.range ? lineAt(document.contents.range[0]) : null;
  };
}
