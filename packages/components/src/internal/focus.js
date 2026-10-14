/**
 * Focus helpers shared by components that move focus themselves. Not public
 * API: the package `exports` map blocks `./internal/*`.
 */

/** The focused element, looking through open shadow roots to the innermost one. */
export function deepestFocus(document) {
  let active = document.activeElement;
  while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
  return active;
}

/**
 * Elements reachable with Tab inside `root`, in sequential focus order. Walks
 * into shadow roots and through slots, so controls inside components count.
 * @param {Element} root
 */
export function tabbables(root) {
  const controls = [];
  for (const child of root.children) {
    walk(child, (element) => {
      if (isTabbable(element)) controls.push(element);
      return true;
    });
  }
  return controls.sort((a, b) => (a.tabIndex || Infinity) - (b.tabIndex || Infinity));
}

/**
 * The tabbable elements before and after `element` in document order, as they
 * would be with `element` gone. Positive tabindex is ignored: what matters is
 * what sits next to the element, not the page's tab order.
 * @param {Element} element
 */
export function tabbablesAround(element) {
  const before = [];
  const after = [];
  let list = before;
  walk(element.ownerDocument.documentElement, (current) => {
    if (current === element) {
      list = after;
      return false;
    }
    if (isTabbable(current)) list.push(current);
    return true;
  });
  return { before, after };
}

function isTabbable(element) {
  return (
    element.tabIndex >= 0 &&
    !element.matches(":disabled") &&
    !element.closest("[inert]") &&
    element.getClientRects().length > 0
  );
}

/** Visit `element` and its flattened descendants. `visit` returns false to skip a subtree. */
function walk(element, visit) {
  if (element instanceof HTMLSlotElement) {
    for (const child of element.assignedElements({ flatten: true })) walk(child, visit);
    return;
  }
  if (!visit(element)) return;
  const children = element.shadowRoot?.children ?? element.children;
  for (const child of children) walk(child, visit);
}

/** Whether `node` is `host` or inside it, crossing shadow boundaries. */
export function containsComposed(host, node) {
  for (let current = node; current;) {
    if (current === host) return true;
    current = current.parentNode ?? current.host;
  }
  return false;
}
