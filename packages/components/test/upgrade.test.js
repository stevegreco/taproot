import { afterEach, describe, expect, test } from "vitest";

import { defineBadge } from "../src/badge.js";
import { defineButton } from "../src/button.js";
import { defineLink } from "../src/link.js";
import { defineTextField } from "../src/text-field.js";

afterEach(() => {
  document.body.replaceChildren();
});

/**
 * Create and connect the element while its tag is still undefined, set
 * properties on the plain HTMLElement, then register it. Each case uses its own
 * tag because a definition cannot be undone.
 */
function upgradeAfter(tagName, define, properties) {
  const element = document.createElement(tagName);
  Object.assign(element, properties);
  document.body.append(element);
  define(tagName);
  return element;
}

describe("properties set before registration", () => {
  test("reach Badge", () => {
    const badge = upgradeAfter("upgrade-ds-badge", defineBadge, { variant: "success" });

    expect(Object.hasOwn(badge, "variant")).toBe(false);
    expect(badge.getAttribute("variant")).toBe("success");
  });

  test("reach Button", () => {
    const button = upgradeAfter("upgrade-ds-button", defineButton, {
      disabled: true,
      variant: "secondary",
    });

    expect(button.shadowRoot.querySelector("button").disabled).toBe(true);
    expect(button.getAttribute("variant")).toBe("secondary");
  });

  test("reach Link", () => {
    const link = upgradeAfter("upgrade-ds-link", defineLink, { href: "#x" });

    expect(link.shadowRoot.querySelector("a").getAttribute("href")).toBe("#x");
  });

  test("reach Text field", () => {
    const field = upgradeAfter("upgrade-ds-text-field", defineTextField, {
      label: "Email",
      value: "a@example.com",
    });

    expect(field.shadowRoot.querySelector(".label-text").textContent).toBe("Email");
    expect(field.shadowRoot.querySelector("input").value).toBe("a@example.com");
    expect(field.value).toBe("a@example.com");
  });
});
