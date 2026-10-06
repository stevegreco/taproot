import { LineCounter, isMap, parseDocument } from "yaml";

/**
 * @typedef {{ path: string, message: string, line?: number }} RawIssue
 */

/**
 * Parse one YAML mapping. Duplicate keys, aliases, and non-mapping documents are errors.
 * The locator maps JSON Pointers to 1-based lines; a pointer to a missing key resolves to its
 * nearest existing parent.
 *
 * @param {string} text
 * @returns {{ data?: Record<string, any>, issues: RawIssue[], locate: (pointer: string) => number | undefined }}
 */
export function parseYamlMapping(text) {
  const lineCounter = new LineCounter();
  const document = parseDocument(text, { uniqueKeys: true, strict: true, lineCounter });
  const locate = createLocator(document, lineCounter);

  if (document.errors.length > 0) {
    return { issues: document.errors.map(yamlErrorIssue), locate };
  }
  let data;
  try {
    data = document.toJS({ maxAliasCount: 0 });
  } catch {
    return { issues: [{ path: "", message: "YAML aliases are not allowed" }], locate };
  }
  if (data === null || typeof data !== "object" || Array.isArray(data)) {
    return { issues: [{ path: "", message: "YAML must be a mapping" }], locate };
  }
  return { data, issues: [], locate };
}

function yamlErrorIssue(error) {
  const line = error.linePos?.[0]?.line;
  const message = String(error.message ?? "YAML is malformed")
    .split("\n")[0]
    .replace(/ at line \d+, column \d+:?$/, "");
  return line ? { path: "", message, line } : { path: "", message };
}

function createLocator(document, lineCounter) {
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
    return document.contents?.range ? lineAt(document.contents.range[0]) : undefined;
  };
}
