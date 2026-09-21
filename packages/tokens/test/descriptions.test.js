// Authored intent per semantic role.
//
// DTCG puts `$description` on the token itself, beside `$value`: "An object with
// a $value property is a token", and a description on an object without one
// describes a *group*, not the token. So descriptions live in the theme files
// next to the values they explain.
//
// The cost of that is the one thing worth guarding. A semantic role is declared
// in both light.tokens.json and dark.tokens.json, so its description is written
// twice, and nothing in the build compares them. This is the same failure
// audit-parity.js exists for — two themes drifting out of being one system —
// applied to prose instead of lightness.

import { test } from "vitest";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { THEMES } from "../style-dictionary.config.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const read = (path) => JSON.parse(readFileSync(join(ROOT, path), "utf-8"));

/**
 * [dottedPath, description] for every TOKEN carrying a description — an object
 * with both `$value` and `$description`. A description on a group is reported
 * separately, because Style Dictionary drops those silently.
 */
function describedTokens(node, parts = [], out = { tokens: [], groups: [] }) {
  for (const [key, value] of Object.entries(node)) {
    if (key.startsWith("$")) continue;
    if (value === null || typeof value !== "object") continue;

    const path = [...parts, key];
    if ("$description" in value) {
      ("$value" in value ? out.tokens : out.groups).push([
        path.join("."),
        value.$description,
        value.$type,
      ]);
    }
    if (!("$value" in value)) describedTokens(value, path, out);
  }
  return out;
}

const themeSource = (theme) => read(`src/tokens/semantic/${theme}.tokens.json`);
const typography = read("src/tokens/semantic/typography.tokens.json");
const shape = read("src/tokens/semantic/shape.tokens.json");

const forTheme = (theme) => {
  const colour = describedTokens(themeSource(theme));
  const recipes = describedTokens(typography);
  const radii = describedTokens(shape);
  return {
    tokens: new Map(
      [...colour.tokens, ...recipes.tokens, ...radii.tokens].map(([path, description, type]) => [
        path,
        { description, type },
      ]),
    ),
    groups: [...colour.groups, ...recipes.groups, ...radii.groups],
  };
};

test("descriptions sit on tokens, never on groups", () => {
  for (const theme of THEMES) {
    // A group description is valid DTCG but says nothing about the token, and
    // Style Dictionary emits it nowhere. Almost always a mistake.
    assert.deepEqual(
      forTheme(theme).groups.map(([path]) => path),
      [],
      `${theme}: $description on an object with no $value — that describes a group`,
    );
  }
});

test("a role's description is identical in both themes", () => {
  const [light, dark] = THEMES.map((theme) => forTheme(theme).tokens);

  const onlyIn = (a, b, name) =>
    [...a.keys()]
      .filter((path) => !b.has(path))
      .map((path) => `${path} (described only in ${name})`);

  assert.deepEqual(
    [...onlyIn(light, dark, "light"), ...onlyIn(dark, light, "dark")],
    [],
    "a semantic role is described in one theme but not the other",
  );

  const drifted = [...light]
    .filter(([path, entry]) => dark.get(path)?.description !== entry.description)
    .map(([path]) => path);
  assert.deepEqual(drifted, [], "description text differs between light and dark");
});

test("every description is prose the path could not carry", () => {
  for (const [path, { description }] of forTheme("light").tokens) {
    assert.equal(typeof description, "string", `${path} description is not a string`);
    assert.ok(description.trim().length > 0, `${path} has an empty description`);
    // "Muted background" on background.muted is the failure mode: a description
    // exists to say what the name cannot.
    assert.notEqual(
      description
        .trim()
        .toLowerCase()
        .replace(/[.\s]+$/, ""),
      path.split(".").at(-1).toLowerCase(),
      `${path} description only restates its own name`,
    );
  }
});

test("descriptions reach the published stylesheet as comments", () => {
  const css = readFileSync(join(ROOT, "dist/css/tokens.css"), "utf-8");
  for (const [path, { description }] of forTheme("light").tokens) {
    assert.ok(css.includes(description), `tokens.css is missing ${path}: ${description}`);
  }
});

function semanticLeaves(node, parts = [], out = []) {
  for (const [key, value] of Object.entries(node)) {
    if (key.startsWith("$")) continue;
    if (value === null || typeof value !== "object") continue;

    const path = [...parts, key];
    if ("$value" in value) out.push([path.join("."), value.$description ?? null, value.$type]);
    else semanticLeaves(value, path, out);
  }
  return out;
}

test("every semantic token is published in semantic.meta.json", () => {
  const meta = read("dist/tokens/semantic.meta.json");
  const source = new Map(
    [
      ...semanticLeaves(themeSource("light")),
      ...semanticLeaves(typography),
      ...semanticLeaves(shape),
    ].map(([path, description, type]) => [path, { description, type }]),
  );

  assert.deepEqual(
    Object.keys(meta).sort(),
    [...source.keys()].sort(),
    "semantic.meta.json keys do not match the semantic source tokens",
  );

  for (const [path, entry] of source) {
    assert.deepEqual(meta[path], entry, path);
  }
});
