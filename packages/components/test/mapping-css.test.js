import { readdirSync } from "node:fs";
import { describe, expect, test } from "vitest";

import { styles as buttonStyles } from "../dist/button.styles.js";
import {
  compiledMappings,
  componentRecords,
  cssVariableFromTokenName,
  declarationContains,
  stylesheetContains,
} from "./mapping-css.js";

const components = await componentRecords();
const srcFiles = readdirSync(new URL("../src/", import.meta.url));

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

  test.each(components.map((record) => [record.id, record]))(
    "%s stylesheet assigns every compiled mapping in a matching declaration",
    async (id, record) => {
      const { styles } = await import(`../dist/${slugOf(id)}.styles.js`);
      const mappings = await compiledMappings(id);
      for (const mapping of mappings) {
        expect(stylesheetContains(styles, mapping), coverMessage(id, mapping)).toBe(true);
      }

      // Token ADR 0003: a component that publishes a component-token namespace
      // consumes only that namespace; every other component consumes semantic
      // tokens and must not reach for a component tier it does not own.
      if (record.tokenRef?.tier === "component") {
        expect(styles).not.toContain("var(--semantic-");
        expect(styles).not.toContain("var(--primitives-");
      } else {
        expect(styles).not.toContain("--component-");
      }
    },
  );

  test("Button stylesheet has no state layer", () => {
    expect(buttonStyles).not.toContain("state-layer");
    expect(buttonStyles).not.toContain(".button::before");
  });
});

describe("component records and runtime files agree", () => {
  const cssSlugs = srcFiles
    .filter((file) => file.endsWith(".css"))
    .map((file) => file.slice(0, -4));
  const recordSlugs = components.map((record) => slugOf(record.id));

  test.each(recordSlugs)("component.%s has src/%s.js and src/%s.css", (slug) => {
    expect(srcFiles, `missing src/${slug}.js`).toContain(`${slug}.js`);
    expect(srcFiles, `missing src/${slug}.css`).toContain(`${slug}.css`);
  });

  test.each(cssSlugs)("src/%s.css has a component record", (slug) => {
    expect(recordSlugs, `src/${slug}.css has no component.${slug} record`).toContain(slug);
  });
});

function slugOf(id) {
  return id.slice("component.".length);
}

function coverMessage(recordId, mapping) {
  const config = mapping.configuration
    ? Object.entries(mapping.configuration)
        .map(([key, value]) => `${key}=${value}`)
        .join(",")
    : "shared";
  const state = mapping.state ?? "any";
  return `${recordId} ${mapping.part} ${mapping.channel} ${config} ${state}`;
}
