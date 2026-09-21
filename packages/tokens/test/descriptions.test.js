// Authored intent per semantic role.
//
// DTCG puts `$description` on the token itself, beside `$value`. A description
// on an object without `$value` describes a group. Style Dictionary drops group
// descriptions from CSS, so a color role's purpose stays on the leaf, where the
// comment can be emitted. A typography recipe's purpose stays on the group,
// and semantic.meta.json publishes it as `groupDescription` instead of copying
// the sentence onto every property.
//
// A semantic color role is declared in both theme files, so its description is
// written twice. Nothing in the build compares them. This is the same failure
// audit-parity.js exists for, applied to prose instead of lightness.

import { test } from "vitest";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import StyleDictionary from "style-dictionary";
import { THEMES, semanticConfig, semanticDescriptionSources } from "../style-dictionary.config.js";
import { flatten } from "../src/flatten.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const read = (path) => JSON.parse(readFileSync(join(ROOT, path), "utf-8"));

const kebabCase = (segment) => segment.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
const cssVariable = (path) => "--" + path.split(".").map(kebabCase).join("-");

/**
 * [dottedPath, description] for every TOKEN carrying a description — an object
 * with both `$value` and `$description`. A description on a group is reported
 * separately. Style Dictionary drops those from CSS, and the meta file publishes
 * them as groupDescription.
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

const sourcesFor = (theme) => semanticDescriptionSources(theme).map(read);

const forTheme = (theme) => {
  const described = sourcesFor(theme).map((sourceFile) => describedTokens(sourceFile));
  return {
    tokens: new Map(
      described.flatMap(({ tokens }) =>
        tokens.map(([path, description, type]) => [path, { description, type }]),
      ),
    ),
    groups: described.flatMap(({ groups }) => groups),
  };
};

test("recipe prose stays on the group", () => {
  for (const theme of THEMES) {
    const { tokens, groups } = forTheme(theme);
    for (const [groupPath, description] of groups) {
      const copied = [...tokens.keys()].filter(
        (path) => path.startsWith(`${groupPath}.`) && tokens.get(path).description === description,
      );
      assert.deepEqual(copied, [], `${groupPath} description is copied onto its leaves`);
    }
  }
});

test("a role's description is identical in both themes", () => {
  const [light, dark] = THEMES.map((theme) => forTheme(theme));

  const onlyIn = (a, b, name) =>
    [...a.keys()]
      .filter((path) => !b.has(path))
      .map((path) => `${path} (described only in ${name})`);

  assert.deepEqual(
    [...onlyIn(light.tokens, dark.tokens, "light"), ...onlyIn(dark.tokens, light.tokens, "dark")],
    [],
    "a semantic role is described in one theme but not the other",
  );

  const drifted = [...light.tokens]
    .filter(([path, entry]) => dark.tokens.get(path)?.description !== entry.description)
    .map(([path]) => path);
  assert.deepEqual(drifted, [], "description text differs between light and dark");

  const lightGroups = new Map(light.groups.map(([path, description]) => [path, description]));
  const darkGroups = new Map(dark.groups.map(([path, description]) => [path, description]));
  assert.deepEqual(
    [...onlyIn(lightGroups, darkGroups, "light"), ...onlyIn(darkGroups, lightGroups, "dark")],
    [],
    "a group is described in one theme but not the other",
  );
  const groupDrift = [...lightGroups]
    .filter(([path, description]) => darkGroups.get(path) !== description)
    .map(([path]) => path);
  assert.deepEqual(groupDrift, [], "group description text differs between light and dark");
});

test("every description is prose the path could not carry", () => {
  const { tokens, groups } = forTheme("light");
  const described = [...tokens, ...groups.map(([path, description]) => [path, { description }])];
  for (const [path, { description }] of described) {
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

test("leaf descriptions are comments on the light custom property", async () => {
  // tokens.css repeats every comment in the light, system-dark, and dark
  // blocks. Checking the light platform output leaves that file free to drop
  // comments, and a full declaration ties the comment to one variable.
  const dir = await mkdtemp(join(tmpdir(), "semantic-light-"));
  try {
    const config = semanticConfig("light");
    const sd = new StyleDictionary({
      source: config.source,
      platforms: {
        css: { ...config.platforms.css, buildPath: `${dir}/` },
      },
    });
    await sd.buildAllPlatforms();
    const css = await readFile(join(dir, "semantic.light.css"), "utf8");
    const values = new Map(
      flatten(read("dist/tokens/semantic.light.json")).map((token) => [token.path, token.value]),
    );

    for (const [path, { description }] of forTheme("light").tokens) {
      const line = `${cssVariable(path)}: ${values.get(path)}; /** ${description} */`;
      assert.ok(css.includes(line), `${path} is missing \`${line}\``);
    }
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

function semanticLeaves(node, parts = [], out = [], inherited = null) {
  for (const [key, value] of Object.entries(node)) {
    if (key.startsWith("$")) continue;
    if (value === null || typeof value !== "object") continue;

    const path = [...parts, key];
    if ("$value" in value) {
      out.push([
        path.join("."),
        {
          description: value.$description ?? null,
          type: value.$type,
          groupDescription: inherited,
        },
      ]);
    } else {
      const next = typeof value.$description === "string" ? value.$description : inherited;
      semanticLeaves(value, path, out, next);
    }
  }
  return out;
}

test("every semantic token is published in semantic.meta.json", () => {
  const meta = read("dist/tokens/semantic.meta.json");
  const source = new Map(sourcesFor("light").flatMap((sourceFile) => semanticLeaves(sourceFile)));

  assert.deepEqual(
    Object.keys(meta).sort(),
    [...source.keys()].sort(),
    "semantic.meta.json keys do not match the semantic source tokens",
  );

  for (const [path, entry] of source) {
    assert.deepEqual(meta[path], entry, path);
  }
});
