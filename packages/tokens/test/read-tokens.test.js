// Regression tests for TOK-06.
//
// The component tier is not a copy of the semantic tier — it is a set of
// aliases into it. A component token whose entire definition is "equals
// accent.default" must report the same value accent.default reports in the
// same response. Before the JSON platform was split per theme, asking for
// dark returned a payload that contradicted itself.

import { test } from "node:test";
import assert from "node:assert/strict";
import { loadTokens } from "../src/read-tokens.js";

const byPath = (tokens) => new Map(tokens.map((t) => [t.path, t.value]));

test("loadTokens returns tokens for both themes", () => {
  for (const theme of ["light", "dark"]) {
    const tokens = loadTokens(theme);
    assert.ok(tokens.length > 0, `${theme} loaded no tokens — is dist/ built?`);
    assert.ok(
      tokens.some((t) => t.tier === "component"),
      `${theme} loaded no component tokens`
    );
  }
});

test("component tokens agree with the semantic tokens they alias", () => {
  // button.primary.background is defined as {semantic.color.accent.default}.
  // If those two disagree, the payload is lying about one of them.
  for (const theme of ["light", "dark"]) {
    const t = byPath(loadTokens(theme));
    assert.equal(
      t.get("component.button.primary.background"),
      t.get("semantic.color.accent.default"),
      `${theme}: button.primary.background should equal accent.default`
    );
    assert.equal(
      t.get("component.button.primary.foreground"),
      t.get("semantic.color.accent.foreground"),
      `${theme}: button.primary.foreground should equal accent.foreground`
    );
  }
});

test("the theme argument actually changes component values", () => {
  // The assertion that failed before the split: both themes returned the
  // light-built components.json, so this came back equal.
  const light = byPath(loadTokens("light"));
  const dark = byPath(loadTokens("dark"));

  assert.notEqual(
    light.get("component.button.primary.background"),
    dark.get("component.button.primary.background"),
    "button.primary.background is identical across themes — components.json is not theme-aware"
  );
});

test("light is the default theme", () => {
  assert.deepEqual(loadTokens(), loadTokens("light"));
});
