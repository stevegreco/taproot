import { describe, expect, test } from "vitest";

import { styles as badgeStyles } from "../dist/badge.styles.js";
import { styles as buttonStyles } from "../dist/button.styles.js";
import {
  compiledMappings,
  cssVariableFromTokenName,
  stylesheetNeedle,
} from "./mapping-css.js";

describe("compiled mapping stylesheet coverage", () => {
  test("token names kebab-case the same way published CSS variables do", () => {
    expect(cssVariableFromTokenName("component.button.size.medium.paddingInline")).toBe(
      "--component-button-size-medium-padding-inline",
    );
    expect(cssVariableFromTokenName("semantic.color.background.muted")).toBe(
      "--semantic-color-background-muted",
    );
  });

  test("Button stylesheet contains every compiled mapping token or literal", async () => {
    const mappings = await compiledMappings("component.button");
    for (const mapping of mappings) {
      expect(buttonStyles, coverMessage("component.button", mapping)).toContain(
        stylesheetNeedle(mapping),
      );
    }
    expect(buttonStyles).not.toContain("var(--semantic-");
    expect(buttonStyles).not.toContain("var(--primitives-");
    expect(buttonStyles).not.toContain("state-layer");
    expect(buttonStyles).not.toContain(".button::before");
  });

  test("Badge stylesheet contains every compiled mapping token or literal", async () => {
    const mappings = await compiledMappings("component.badge");
    for (const mapping of mappings) {
      expect(badgeStyles, coverMessage("component.badge", mapping)).toContain(
        stylesheetNeedle(mapping),
      );
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
  return `${recordId} ${mapping.part} ${mapping.channel} ${config} ${state} → ${stylesheetNeedle(mapping)}`;
}
