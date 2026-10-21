import { expect } from "vitest";

/**
 * Asserts that `element` upgraded and rendered each named part in its shadow
 * root. A test that checks for an absence (no live region, no focus, no events)
 * passes just as well for an element that never rendered, so a negative test
 * calls this first.
 * @param {Element} element
 * @param {...string} parts `part` names the component renders
 */
export function expectRendered(element, ...parts) {
  const tag = `<${element.localName}>`;
  expect(element.matches(":defined"), `${tag} is not defined`).toBe(true);
  expect(element.shadowRoot, `${tag} has no shadow root`).not.toBe(null);
  for (const part of parts) {
    expect(
      element.shadowRoot.querySelector(`[part~="${part}"]`),
      `${tag} did not render part "${part}"`,
    ).not.toBe(null);
  }
}
