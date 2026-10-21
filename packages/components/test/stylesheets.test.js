/**
 * Component stylesheets take shared decisions from semantic tokens. A raw color
 * value or a palette variable skips the theme, and a hand-written focus ring or
 * border width drifts from the rest. Nothing else catches either.
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

const withoutComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, "");

test.each(stylesheets)("%s uses no raw colors", (_file, css) => {
  expect(withoutComments(css).match(rawColor) ?? []).toEqual([]);
});

test.each(stylesheets)("%s takes radius and border width from semantic tokens", (_file, css) => {
  expect(withoutComments(css).match(/--primitives-(?:radius|border)-[\w-]+/g) ?? []).toEqual([]);
  expect(withoutComments(css).match(/border(?:-[\w-]+)?:\s*\d+px\b/g) ?? []).toEqual([]);
});

test.each(stylesheets)("%s draws focus rings with the shared focus tokens", (_file, css) => {
  const outlines = withoutComments(css).match(/outline(?:-offset)?:[^;]+/g) ?? [];
  const handWritten = outlines.filter(
    (declaration) => declaration !== "outline: none" && !declaration.includes("--semantic-focus-"),
  );
  expect(handWritten).toEqual([]);
});
