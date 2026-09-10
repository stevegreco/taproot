import { test } from "vitest";
import assert from "node:assert/strict";
import { createCombinedCss, SYSTEM_DARK_QUERY } from "../build-css-utils.js";
import { semanticConfig } from "../style-dictionary.config.js";

const cssFilesFor = (theme) => semanticConfig(theme).platforms.css.files;

test("semantic CSS publishes light, explicit dark, and system dark selectors", () => {
  const lightFiles = cssFilesFor("light");
  const darkFiles = cssFilesFor("dark");

  assert.equal(lightFiles.length, 1);
  assert.equal(lightFiles[0].options.selector, ":root");
  assert.equal(darkFiles.length, 2);
  assert.equal(darkFiles[0].options.selector, ':root[data-theme="dark"]');
  assert.equal(darkFiles[1].options.selector, ":root:not([data-theme])");
});

test("combined CSS uses the system dark theme only when data-theme is absent", () => {
  const css = createCombinedCss({
    primitives: ":root { --primitive: value; }",
    semanticLight: ":root { --semantic: light; }",
    semanticDarkSystem: ":root:not([data-theme]) { --semantic: dark; }",
    semanticDark: ':root[data-theme="dark"] { --semantic: dark; }',
    components: ":root { --component: var(--semantic); }",
  });

  assert.match(
    css,
    new RegExp(`@media \\(${SYSTEM_DARK_QUERY}\\) \\{[\\s\\S]*:root:not\\(\\[data-theme\\]\\)`),
  );
  assert.match(css, /:root\[data-theme="dark"\] \{ --semantic: dark; \}/);
  assert.doesNotMatch(css, /:root:not\(\[data-theme="light"\]\)/);
});

test("combined CSS keeps native browser UI in sync with the selected theme", () => {
  const css = createCombinedCss({
    primitives: "",
    semanticLight: "",
    semanticDarkSystem: "",
    semanticDark: "",
    components: "",
  });

  assert.match(css, /:root \{\n  color-scheme: light;/);
  assert.match(css, /:root:not\(\[data-theme\]\) \{\n    color-scheme: dark;/);
  assert.match(css, /:root\[data-theme="dark"\] \{\n  color-scheme: dark;/);
});
