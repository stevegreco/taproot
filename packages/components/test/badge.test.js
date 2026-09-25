import { afterEach, beforeAll, describe, expect, test } from "vitest";

import { defineBadge } from "../src/badge.js";

const tagName = "test-ds-badge";

beforeAll(() => {
  defineBadge(tagName);
});

afterEach(() => {
  document.body.replaceChildren();
});

describe("DsBadge", () => {
  test("renders slotted content inside its exposed part", () => {
    document.body.innerHTML = `<${tagName}>New</${tagName}>`;
    const badge = document.querySelector(tagName);
    const surface = badge.shadowRoot.querySelector('[part="badge"]');
    const slot = surface.querySelector("slot");

    expect(surface).toBeInstanceOf(HTMLSpanElement);
    expect(
      slot
        .assignedNodes()
        .map((node) => node.textContent)
        .join(""),
    ).toBe("New");
  });

  test("reflects its variant through the attribute API", () => {
    const badge = document.createElement(tagName);

    expect(badge.variant).toBe("default");
    badge.variant = "success";
    expect(badge.getAttribute("variant")).toBe("success");
    expect(badge.variant).toBe("success");
  });

  test("[non-interactive][a11y-not-a-control] takes no focus and exposes no control", () => {
    document.body.innerHTML = `<${tagName}>New</${tagName}>`;
    const badge = document.querySelector(tagName);

    badge.focus();
    expect(document.activeElement).not.toBe(badge);
    expect(badge.shadowRoot.activeElement).toBe(null);
    expect(
      badge.shadowRoot.querySelector("a[href], button, input, select, textarea, [tabindex]"),
    ).toBe(null);
  });

  test("[a11y-no-live-region] sets no role or live region", () => {
    document.body.innerHTML = `<${tagName} variant="success">Active</${tagName}>`;
    const badge = document.querySelector(tagName);

    expect(badge.hasAttribute("role")).toBe(false);
    expect(badge.hasAttribute("aria-live")).toBe(false);
    expect(badge.shadowRoot.querySelector("[role], [aria-live]")).toBe(null);
  });
});
