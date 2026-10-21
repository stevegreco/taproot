/**
 * Component stylesheets take color only from semantic tokens, so a theme can
 * restyle every component. A raw color value or a palette variable skips the
 * theme and is not caught by any other check.
 */
import { expect, test } from "vitest";

const stylesheets = Object.entries(
  import.meta.glob("../src/*.css", { query: "?raw", import: "default", eager: true }),
).map(([file, css]) => [file.slice("../src/".length), css]);

const rawColor =
  /#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\(|--primitives-color-/gi;

test("finds the stylesheets in src/", () => {
  expect(stylesheets.length).toBeGreaterThan(0);
});

test.each(stylesheets)("%s uses no raw colors", (_file, css) => {
  const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, "");
  expect(withoutComments.match(rawColor) ?? []).toEqual([]);
});
