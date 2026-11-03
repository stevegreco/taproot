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

/**
 * Split a command line into words the way a shell would, without variables, globs, or other
 * expansion: whitespace separates words, single quotes keep everything literally, double quotes
 * group words and honor `\"` and `\\`, and a backslash outside quotes keeps the next character.
 *
 * @param {string} line
 * @returns {string[]}
 * @throws {Error} When a quote is not closed or the line ends in a backslash.
 */
export function splitWords(line) {
  const words = [];
  let word = "";
  let inWord = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === "'") {
      const end = line.indexOf("'", i + 1);
      if (end === -1) throw new Error("unclosed single quote");
      word += line.slice(i + 1, end);
      inWord = true;
      i = end;
    } else if (char === '"') {
      inWord = true;
      for (i++; ; i++) {
        if (i >= line.length) throw new Error("unclosed double quote");
        if (line[i] === '"') break;
        if (line[i] === "\\" && (line[i + 1] === '"' || line[i + 1] === "\\")) i++;
        word += line[i];
      }
    } else if (char === "\\") {
      if (i + 1 >= line.length) throw new Error("trailing backslash");
      word += line[++i];
      inWord = true;
    } else if (/\s/.test(char)) {
      if (inWord) words.push(word);
      word = "";
      inWord = false;
    } else {
      word += char;
      inWord = true;
    }
  }
  if (inWord) words.push(word);
  return words;
}
