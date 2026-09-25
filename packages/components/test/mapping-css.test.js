import { readdirSync } from "node:fs";
import { describe, expect, test } from "vitest";

import { styles as buttonStyles } from "../dist/button.styles.js";
import {
  compiledMappings,
  componentRecords,
  cssVariableFromTokenName,
  tokenVariables,
} from "./mapping-css.js";

/**
 * Token variables a stylesheet may read without a contract mapping, keyed by
 * component id, each with the reason. test/contract-mappings.test.js checks
 * that every mapping applies; this list keeps the other direction honest.
 */
const UNMAPPED_TOKENS = Object.freeze({});

const components = await componentRecords();
const srcFiles = readdirSync(new URL("../src/", import.meta.url));

describe("stylesheets read only the tokens their contract maps", () => {
  test("token names use flatten() CSS variables", () => {
    expect(cssVariableFromTokenName("component.button.size.medium.paddingInline")).toBe(
      "--component-button-size-medium-padding-inline",
    );
    expect(cssVariableFromTokenName("semantic.color.background.muted")).toBe(
      "--semantic-color-background-muted",
    );
  });

  test.each(components.map((record) => [record.id, record]))(
    "%s stylesheet reads no token outside its compiled mappings",
    async (id, record) => {
      const { styles } = await import(`../dist/${slugOf(id)}.styles.js`);
      const mapped = new Set(
        (await compiledMappings(id))
          .filter((mapping) => mapping.token?.name)
          .map((mapping) => cssVariableFromTokenName(mapping.token.name)),
      );
      const allowed = Object.keys(UNMAPPED_TOKENS[id] ?? {});
      const unmapped = [...tokenVariables(styles)].filter(
        (variable) => !mapped.has(variable) && !allowed.includes(variable),
      );
      expect(
        unmapped,
        `${id}: map these in the spec's visuals or list them in UNMAPPED_TOKENS`,
      ).toEqual([]);

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
