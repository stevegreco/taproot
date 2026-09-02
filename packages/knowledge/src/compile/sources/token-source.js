import { PROBLEM, problem } from "../tables.js";

/**
 * @param {string} text
 * @param {{ path: string, recordId: string }} context
 */
export function readTokenSource(text, context) {
  let tree;
  try {
    tree = JSON.parse(text);
  } catch (error) {
    return {
      fields: {},
      problems: [
        problem({
          code: PROBLEM.SOURCE_UNREADABLE,
          message: `token source is unreadable: ${error instanceof Error ? error.message : "JSON parse failure"}`,
          recordId: context.recordId,
          path: context.path,
        }),
      ],
    };
  }

  if (tree == null || typeof tree !== "object" || Array.isArray(tree)) {
    return {
      fields: {},
      problems: [
        problem({
          code: PROBLEM.SOURCE_UNREADABLE,
          message: "token source root must be an object",
          recordId: context.recordId,
          path: context.path,
        }),
      ],
    };
  }

  const entries = [];
  flattenTokens(tree, [], entries);
  entries.sort((left, right) => left.name.localeCompare(right.name));

  return {
    fields: { tokens: { entries } },
    problems: [],
  };
}

function flattenTokens(node, pathParts, entries) {
  if (node == null || typeof node !== "object" || Array.isArray(node)) {
    return;
  }

  if (Object.hasOwn(node, "$value")) {
    entries.push({
      name: pathParts.join("."),
      alias: aliasOf(node.$value),
      valueType: typeof node.$type === "string" ? node.$type : "",
      group: null,
    });
    return;
  }

  for (const [key, child] of Object.entries(node)) {
    if (key.startsWith("$")) continue;
    flattenTokens(child, [...pathParts, key], entries);
  }
}

function aliasOf(value) {
  if (typeof value !== "string") return null;
  const match = /^\{([^{}]+)\}$/.exec(value.trim());
  return match ? match[1] : null;
}
