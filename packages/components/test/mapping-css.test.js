import { describe, expect, test } from "vitest";

import { styles as badgeStyles } from "../dist/badge.styles.js";
import { styles as buttonStyles } from "../dist/button.styles.js";
import {
  compiledMappings,
  cssVariableFromTokenName,
  declarationContains,
  stylesheetContains,
} from "./mapping-css.js";

describe("compiled mapping stylesheet coverage", () => {
  test("token names use flatten() CSS variables", () => {
    expect(cssVariableFromTokenName("component.button.size.medium.paddingInline")).toBe(
      "--component-button-size-medium-padding-inline",
    );
    expect(cssVariableFromTokenName("semantic.color.background.muted")).toBe(
      "--semantic-color-background-muted",
    );
  });

  test("literal needles are scoped to a declaration, not a bare token", () => {
    expect(
      stylesheetContains("--_background: transparent;\ntransition: none;", {
        channel: "background",
        token: { literal: "transparent" },
      }),
    ).toBe(true);
    expect(
      stylesheetContains("--_background: white;\n--_background-disabled: transparent;", {
        channel: "background",
        token: { literal: "transparent" },
      }),
    ).toBe(false);
    expect(
      stylesheetContains("transition: none;", {
        channel: "background",
        token: { literal: "transparent" },
      }),
    ).toBe(false);
    expect(declarationContains(".button { transition: none; }", "transition", "none")).toBe(true);
  });

  test("Button stylesheet assigns every compiled mapping in a matching declaration", async () => {
    const mappings = await compiledMappings("component.button");
    for (const mapping of mappings) {
      expect(
        stylesheetContains(buttonStyles, mapping),
        coverMessage("component.button", mapping),
      ).toBe(true);
    }
    expect(buttonStyles).not.toContain("var(--semantic-");
    expect(buttonStyles).not.toContain("var(--primitives-");
    expect(buttonStyles).not.toContain("state-layer");
    expect(buttonStyles).not.toContain(".button::before");
  });

  test("Badge stylesheet assigns every compiled mapping in a matching declaration", async () => {
    const mappings = await compiledMappings("component.badge");
    for (const mapping of mappings) {
      expect(
        stylesheetContains(badgeStyles, mapping),
        coverMessage("component.badge", mapping),
      ).toBe(true);
    }
    expect(badgeStyles).not.toContain("--component-");
  });
});

function coverMessage(recordId, mapping) {
  const config = mapping.configuration
    ? Object.entries(mapping.configuration)
        .map(([key, value]) => `${key}=${value}`)
        .join(",")
    : "shared";
  const state = mapping.state ?? "any";
  return `${recordId} ${mapping.part} ${mapping.channel} ${config} ${state}`;
}
