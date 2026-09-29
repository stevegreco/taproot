import fs from "node:fs";

const isObject = (value) => typeof value === "object" && value !== null && !Array.isArray(value);

function deepMerge(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (
      isObject(value) &&
      !("$value" in value) &&
      isObject(target[key]) &&
      !("$value" in target[key])
    ) {
      deepMerge(target[key], value);
    } else {
      target[key] = isObject(value) ? structuredClone(value) : value;
    }
  }
  return target;
}

/** Index tokens (objects with `$value`) by dotted path. */
function indexTokens(node, prefix, out) {
  for (const [key, value] of Object.entries(node)) {
    if (key.startsWith("$") || !isObject(value)) continue;
    const dotted = prefix ? `${prefix}.${key}` : key;
    if ("$value" in value) out.set(dotted, value.$value);
    else indexTokens(value, dotted, out);
  }
  return out;
}

const ALIAS = /^\{([^{}]+)\}$/;

function stringify(value) {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (isObject(value) && "value" in value && "unit" in value && Object.keys(value).length === 2) {
    return `${value.value}${value.unit}`;
  }
  return JSON.stringify(value);
}

function resolveValue(value, index, trail) {
  if (typeof value === "string") {
    const alias = ALIAS.exec(value);
    if (alias) return resolveAlias(alias[1], index, trail);
    // Aliases embedded in a longer string.
    return value.replace(/\{([^{}]+)\}/g, (whole, name) =>
      index.has(name) ? stringify(resolveAlias(name, index, trail)) : whole,
    );
  }
  if (Array.isArray(value)) return value.map((item) => resolveValue(item, index, trail));
  if (isObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, resolveValue(item, index, trail)]),
    );
  }
  return value;
}

function resolveAlias(name, index, trail) {
  if (trail.includes(name)) {
    throw new Error(`Circular token alias: ${[...trail, name].join(" -> ")}`);
  }
  if (!index.has(name))
    throw new Error(`Token alias {${name}} does not exist (from ${trail.at(-1)})`);
  return resolveValue(index.get(name), index, [...trail, name]);
}

/**
 * Create a token resolver over DTCG files. Files are read on first use, and each set is indexed
 * once.
 *
 * @param {Record<string, string[]>} sets Set name to file paths; later files win.
 * @returns {(ref: string) => Record<string, string> | undefined}
 */
export function createDtcgResolver(sets) {
  /** @type {Map<string, Map<string, unknown>> | undefined} */
  let indexes;
  const load = () => {
    indexes = new Map();
    for (const [name, files] of Object.entries(sets)) {
      const merged = {};
      for (const file of files) {
        let parsed;
        try {
          parsed = JSON.parse(fs.readFileSync(file, "utf8"));
        } catch (error) {
          throw new Error(`Cannot read token file ${file}: ${error.message}`);
        }
        deepMerge(merged, parsed);
      }
      indexes.set(name, indexTokens(merged, "", new Map()));
    }
    return indexes;
  };
  return (ref) => {
    const all = indexes ?? load();
    /** @type {Record<string, string>} */
    const values = {};
    for (const [name, index] of all) {
      if (!index.has(ref)) continue;
      values[name] = stringify(resolveValue(index.get(ref), index, [ref]));
    }
    return Object.keys(values).length > 0 ? values : undefined;
  };
}
