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
