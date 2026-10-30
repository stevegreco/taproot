/** Orders strings by UTF-16 code unit, so output never depends on the machine's locale. */
export function byCodeUnit(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

/** @param {unknown} value @returns {value is Record<string, any>} */
export function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/** Freeze an object and everything reachable from it. */
export function deepFreeze(value) {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}

/** Escape one JSON Pointer segment. */
export function pointerSegment(segment) {
  return String(segment).replaceAll("~", "~0").replaceAll("/", "~1");
}

/** The record ID of a link target, without its `#section`. */
export function recordIdOf(target) {
  const hash = target.indexOf("#");
  return hash === -1 ? target : target.slice(0, hash);
}

/** Levenshtein distance between two strings, counting an adjacent swap as one edit. */
export function editDistance(left, right) {
  const rows = left.length + 1;
  const cols = right.length + 1;
  const d = Array.from({ length: rows }, (_, i) => [i, ...Array(cols - 1).fill(0)]);
  for (let j = 1; j < cols; j++) d[0][j] = j;
  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = left[i - 1] === right[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && left[i - 1] === right[j - 2] && left[i - 2] === right[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }
  return d[rows - 1][cols - 1];
}

/**
 * The edits a word of this length may be off by and still count as a typo of another. Shorter
 * words get none, because one edit to a short word usually makes a different real word.
 */
export function typoAllowance(word) {
  return word.length >= 8 ? 2 : word.length >= 5 ? 1 : 0;
}

/**
 * Every parameter list in a component record with the section path that names it: the
 * component's own `parameters`, then each item's, such as `items.section.parameters`.
 *
 * @param {Record<string, any>} record
 * @returns {[path: string, parameters: Record<string, any>][]}
 */
export function parameterLists(record) {
  return [
    ["parameters", record.parameters ?? {}],
    ...Object.entries(record.items ?? {}).map(([part, item]) => [
      `items.${part}.parameters`,
      item?.parameters ?? {},
    ]),
  ];
}
