/**
 * The computed value `property` takes when set to `value` (for example
 * `var(--semantic-color-border-focus)` or `transparent`) on a throwaway element
 * under `container`. Comparing it with a part's computed value proves the token
 * resolved, in the same serialization the browser reports for the part.
 * @param {string} property CSS longhand, e.g. "font-size"
 * @param {string} value
 * @param {Element} [container]
 */
export function resolvedValue(property, value, container = document.body) {
  const probe = document.createElement("div");
  probe.style.setProperty(property, value);
  container.append(probe);
  const resolved = getComputedStyle(probe).getPropertyValue(property);
  probe.remove();
  return resolved;
}
