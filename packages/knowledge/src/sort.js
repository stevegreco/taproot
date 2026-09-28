/** Orders strings by UTF-16 code unit, so output never depends on the machine's locale. */
export function byCodeUnit(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}
