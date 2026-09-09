import { afterEach, beforeAll, describe, expect, test } from "vitest";

import { DsBadge, defineBadge } from "../src/badge.js";

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

  test("can be registered under more than one tag name", () => {
    const alias = "test-ds-badge-alias";

    expect(() => defineBadge(alias)).not.toThrow();
    expect(document.createElement(alias)).toBeInstanceOf(DsBadge);
    expect(() => defineBadge(alias)).not.toThrow();
  });

  test("honors the native hidden attribute", () => {
    document.body.innerHTML = `<${tagName} hidden>Hidden</${tagName}>`;
    const badge = document.querySelector(tagName);

    expect(getComputedStyle(badge).display).toBe("none");
  });
});
