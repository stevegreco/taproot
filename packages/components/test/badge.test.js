import { afterEach, beforeAll, describe, expect, test } from "vitest";
import { cdp } from "vitest/browser";

import { defineBadge } from "../src/badge.js";
import { defineIcon } from "../src/icon.js";
import { expectRendered } from "./helpers/rendered.js";
import { resolvedValue } from "./helpers/tokens.js";

const tagName = "test-ds-badge";
const iconTag = "test-ds-badge-icon";

beforeAll(() => {
  defineBadge(tagName);
  defineIcon(iconTag);
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

  test("[not-a-control] takes no focus and exposes no control", () => {
    document.body.innerHTML = `<${tagName}>New</${tagName}>`;
    const badge = document.querySelector(tagName);
    expectRendered(badge, "badge");

    badge.focus();
    expect(document.activeElement).not.toBe(badge);
    expect(badge.shadowRoot.activeElement).toBe(null);
    expect(
      badge.shadowRoot.querySelector("a[href], button, input, select, textarea, [tabindex]"),
    ).toBe(null);
  });

  test("[no-live-region] sets no role or live region", () => {
    document.body.innerHTML = `<${tagName} variant="success">Active</${tagName}>`;
    const badge = document.querySelector(tagName);
    expectRendered(badge, "badge");

    expect(badge.hasAttribute("role")).toBe(false);
    expect(badge.hasAttribute("aria-live")).toBe(false);
    expect(badge.shadowRoot.querySelector("[role], [aria-live]")).toBe(null);
  });

  test("spaces a leading icon from the label with the mapped gap token", () => {
    document.body.innerHTML = `<${tagName} variant="warning"><${iconTag}><svg viewBox="0 0 24 24"></svg></${iconTag}>Pending</${tagName}>`;
    const badge = document.querySelector(tagName);
    const surface = badge.shadowRoot.querySelector('[part="badge"]');
    const icon = badge.querySelector(iconTag).getBoundingClientRect();
    const range = document.createRange();
    range.selectNodeContents(badge.lastChild);
    const label = range.getBoundingClientRect();
    const gap = resolvedValue("column-gap", "var(--ds-primitives-space-1)");

    expect(getComputedStyle(surface).columnGap).toBe(gap);
    expect(label.left - icon.right).toBeCloseTo(parseFloat(gap), 0);
  });
});

async function withForcedColors(check) {
  await cdp().send("Emulation.setEmulatedMedia", {
    features: [{ name: "forced-colors", value: "active" }],
  });
  try {
    expect(matchMedia("(forced-colors: active)").matches).toBe(true);
    await check();
  } finally {
    await cdp().send("Emulation.setEmulatedMedia", { features: [] });
  }
}

test.each(["default", "danger", "success"])(
  "[forced-colors] a %s badge keeps a visible boundary under forced colors",
  (variant) =>
    withForcedColors(() => {
      document.body.innerHTML = `<${tagName} variant="${variant}">Paid</${tagName}>`;
      const surface = document.querySelector(tagName).shadowRoot.querySelector('[part="badge"]');
      const style = getComputedStyle(surface);
      expect(parseFloat(style.borderTopWidth)).toBeGreaterThan(0);
      expect(style.borderTopColor).toBe(resolvedValue("color", "CanvasText"));
    }),
);
