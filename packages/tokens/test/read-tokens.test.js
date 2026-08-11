// Public token-loading contracts for the fixed primitive tier and the
// theme-specific semantic tier and theme-independent component references.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { loadTokens } from "../src/read-tokens.js";

const byPath = (tokens) => new Map(tokens.map((t) => [t.path, t.value]));

const readJson = (url) => JSON.parse(readFileSync(url, "utf-8"));

function sourceLeaves(object, parts = []) {
  const leaves = [];
  for (const [key, value] of Object.entries(object)) {
    const path = [...parts, key];
    if (value && typeof value === "object" && "$value" in value) {
      leaves.push([path.join("."), value.$value]);
    } else if (value && typeof value === "object") {
      leaves.push(...sourceLeaves(value, path));
    }
  }
  return leaves;
}

test("loadTokens returns tokens for both themes", () => {
  for (const theme of ["light", "dark"]) {
    const tokens = loadTokens(theme);
    assert.ok(tokens.length > 0, `${theme} loaded no tokens — is dist/ built?`);
    assert.ok(
      tokens.some((t) => t.tier === "primitive"),
      `${theme} loaded no primitive tokens`,
    );
    assert.ok(
      tokens.some((t) => t.tier === "semantic"),
      `${theme} loaded no semantic tokens`,
    );
    assert.ok(
      tokens.some((t) => t.tier === "component"),
      `${theme} loaded no component tokens`,
    );
    assert.ok(
      tokens
        .filter((t) => t.tier === "component")
        .every((t) => t.path.startsWith("component.button.")),
      `${theme} exposed a component contract other than Button`,
    );
  }
});

test("Button component tokens preserve their shared-token references", () => {
  const light = byPath(loadTokens("light"));
  const dark = byPath(loadTokens("dark"));

  for (const [component, reference] of [
    [
      "component.button.primary.background.default",
      "{semantic.color.background.action.primary.default}",
    ],
    [
      "component.button.primary.foreground.default",
      "{semantic.color.foreground.on.action.primary}",
    ],
    ["component.button.primary.border.default", "{semantic.color.border.action.primary.default}"],
    ["component.button.primary.border.hover", "{semantic.color.border.action.primary.hover}"],
    ["component.button.primary.border.pressed", "{semantic.color.border.action.primary.pressed}"],
    ["component.button.secondary.border.default", "{semantic.color.border.default}"],
    [
      "component.button.danger.background.default",
      "{semantic.color.background.status.danger.default}",
    ],
    ["component.button.font.lineHeight", "{semantic.typography.label.default.lineHeight}"],
    ["component.button.font.letterSpacing", "{semantic.typography.label.default.letterSpacing}"],
  ]) {
    assert.equal(light.get(component), reference, `${component} should preserve ${reference}`);
    assert.equal(dark.get(component), reference, `${component} should be theme-independent`);
  }
});

test("every component token aliases a current shared token in both themes", () => {
  const primitives = readJson(new URL("../src/tokens/primitives.tokens.json", import.meta.url));
  const shape = readJson(new URL("../src/tokens/semantic/shape.tokens.json", import.meta.url));
  const typography = readJson(
    new URL("../src/tokens/semantic/typography.tokens.json", import.meta.url),
  );
  const componentDirectory = new URL("../src/tokens/components/", import.meta.url);
  const componentFiles = readdirSync(componentDirectory).filter((file) =>
    file.endsWith(".tokens.json"),
  );

  assert.ok(componentFiles.length > 0, "no component token files found");

  for (const theme of ["light", "dark"]) {
    const semantic = readJson(
      new URL(`../src/tokens/semantic/${theme}.tokens.json`, import.meta.url),
    );
    const sharedPaths = new Set([
      ...sourceLeaves(primitives).map(([path]) => path),
      ...sourceLeaves(shape).map(([path]) => path),
      ...sourceLeaves(typography).map(([path]) => path),
      ...sourceLeaves(semantic).map(([path]) => path),
    ]);

    for (const file of componentFiles) {
      const component = readJson(new URL(file, componentDirectory));
      for (const [path, value] of sourceLeaves(component)) {
        const match = /^\{(primitives|semantic)\.[^}]+\}$/.exec(value);
        assert.ok(match, `${file}: ${path} must alias a primitive or semantic token`);

        const target = value.slice(1, -1);
        assert.ok(
          sharedPaths.has(target),
          `${file}: ${path} references missing ${target} in ${theme}`,
        );
      }
    }
  }
});

test("the theme argument changes semantic values", () => {
  const light = byPath(loadTokens("light"));
  const dark = byPath(loadTokens("dark"));

  for (const path of [
    "semantic.color.background.default",
    "semantic.color.background.action.primary.default",
    "semantic.color.foreground.default",
  ]) {
    assert.ok(light.has(path), `light: missing ${path}`);
    assert.ok(dark.has(path), `dark: missing ${path}`);
    assert.notEqual(light.get(path), dark.get(path), `${path} is identical across themes`);
  }
});

test("primary action borders track their background in every interaction state", () => {
  for (const theme of ["light", "dark"]) {
    const semantic = readJson(
      new URL(`../src/tokens/semantic/${theme}.tokens.json`, import.meta.url),
    );
    const values = new Map(sourceLeaves(semantic));

    for (const state of ["default", "hover", "pressed"]) {
      assert.equal(
        values.get(`semantic.color.border.action.primary.${state}`),
        values.get(`semantic.color.background.action.primary.${state}`),
        `${theme}: primary ${state} border should match its background`,
      );
    }
  }
});

test("light is the default theme", () => {
  assert.deepEqual(loadTokens(), loadTokens("light"));
});

test("status colors expose only the accepted application contracts", () => {
  for (const theme of ["light", "dark"]) {
    const tokens = byPath(loadTokens(theme));

    for (const status of ["success", "warning", "info", "danger"]) {
      for (const application of ["background", "foreground", "border"]) {
        const path = `semantic.color.${application}.status.${status}.default`;
        assert.ok(tokens.has(path), `${theme}: missing ${path}`);
      }
    }

    const interactiveStatusPaths = [...tokens.keys()].filter(
      (path) =>
        path.startsWith("semantic.color.") &&
        path.includes(".status.") &&
        /\.(hover|pressed)$/.test(path),
    );
    assert.deepEqual(
      interactiveStatusPaths,
      [],
      `${theme}: status colors must not expose unaccepted interaction states`,
    );
  }
});

// ─── Secondary action background contracts ──────────────────────────────────

test("secondary action background semantic contracts exist in both themes", () => {
  for (const theme of ["light", "dark"]) {
    const tokens = byPath(loadTokens(theme));
    for (const state of ["default", "hover", "pressed"]) {
      const path = `semantic.color.background.action.secondary.${state}`;
      assert.ok(tokens.has(path), `${theme}: missing ${path}`);
    }
  }
});

test("light theme secondary action backgrounds alias gray.25 / gray.50 / gray.100", () => {
  const semantic = readJson(new URL("../src/tokens/semantic/light.tokens.json", import.meta.url));
  const values = new Map(sourceLeaves(semantic));

  assert.equal(
    values.get("semantic.color.background.action.secondary.default"),
    "{primitives.color.gray.25}",
    "light default must alias gray.25",
  );
  assert.equal(
    values.get("semantic.color.background.action.secondary.hover"),
    "{primitives.color.gray.50}",
    "light hover must alias gray.50",
  );
  assert.equal(
    values.get("semantic.color.background.action.secondary.pressed"),
    "{primitives.color.gray.100}",
    "light pressed must alias gray.100",
  );
});

test("dark theme secondary action backgrounds alias gray.900 / gray.800 / gray.700", () => {
  const semantic = readJson(new URL("../src/tokens/semantic/dark.tokens.json", import.meta.url));
  const values = new Map(sourceLeaves(semantic));

  assert.equal(
    values.get("semantic.color.background.action.secondary.default"),
    "{primitives.color.gray.900}",
    "dark default must alias gray.900",
  );
  assert.equal(
    values.get("semantic.color.background.action.secondary.hover"),
    "{primitives.color.gray.800}",
    "dark hover must alias gray.800",
  );
  assert.equal(
    values.get("semantic.color.background.action.secondary.pressed"),
    "{primitives.color.gray.700}",
    "dark pressed must alias gray.700",
  );
});

test("secondary action background aliases differ between light and dark themes", () => {
  for (const state of ["default", "hover", "pressed"]) {
    const light = readJson(new URL("../src/tokens/semantic/light.tokens.json", import.meta.url));
    const dark = readJson(new URL("../src/tokens/semantic/dark.tokens.json", import.meta.url));
    const lightValues = new Map(sourceLeaves(light));
    const darkValues = new Map(sourceLeaves(dark));
    const path = `semantic.color.background.action.secondary.${state}`;
    assert.notEqual(
      lightValues.get(path),
      darkValues.get(path),
      `${path} must resolve to different primitives across themes`,
    );
  }
});

test("tertiary action backgrounds publish only hover and pressed alpha overlays", () => {
  const expected = {
    light: {
      hover: "{primitives.color.grayAlpha.950.5}",
      pressed: "{primitives.color.grayAlpha.950.9}",
    },
    dark: {
      hover: "{primitives.color.grayAlpha.25.6}",
      pressed: "{primitives.color.grayAlpha.25.10}",
    },
  };

  for (const theme of ["light", "dark"]) {
    const semantic = readJson(
      new URL(`../src/tokens/semantic/${theme}.tokens.json`, import.meta.url),
    );
    const values = new Map(sourceLeaves(semantic));
    const tokens = byPath(loadTokens(theme));
    const base = "semantic.color.background.action.tertiary";

    assert.equal(values.get(`${base}.hover`), expected[theme].hover);
    assert.equal(values.get(`${base}.pressed`), expected[theme].pressed);
    assert.equal(
      values.has(`${base}.default`),
      false,
      `${theme}: tertiary default is literal transparent`,
    );
    assert.ok(tokens.has(`${base}.hover`), `${theme}: missing published tertiary hover token`);
    assert.ok(tokens.has(`${base}.pressed`), `${theme}: missing published tertiary pressed token`);
    assert.equal(tokens.has(`${base}.default`), false);
  }
});

test("Button secondary background component tokens alias the semantic action.secondary contracts", () => {
  const light = byPath(loadTokens("light"));
  const dark = byPath(loadTokens("dark"));

  for (const [component, reference] of [
    [
      "component.button.secondary.background.default",
      "{semantic.color.background.action.secondary.default}",
    ],
    [
      "component.button.secondary.background.hover",
      "{semantic.color.background.action.secondary.hover}",
    ],
    [
      "component.button.secondary.background.pressed",
      "{semantic.color.background.action.secondary.pressed}",
    ],
  ]) {
    assert.equal(light.get(component), reference, `${component} must alias ${reference}`);
    assert.equal(dark.get(component), reference, `${component} must be theme-independent`);
  }
});

// ────────────────────────────────────────────────────────────────────────────

test("semantic typography publishes ten complete, theme-independent recipes", () => {
  const recipes = [
    "heading.large",
    "heading.default",
    "heading.small",
    "body.default",
    "body.small",
    "label.default",
    "label.small",
    "eyebrow",
    "code.default",
    "code.small",
  ];
  const properties = ["fontFamily", "fontSize", "fontWeight", "lineHeight", "letterSpacing"];
  const light = byPath(loadTokens("light"));
  const dark = byPath(loadTokens("dark"));
  const typographyPaths = [...light.keys()].filter((path) =>
    path.startsWith("semantic.typography."),
  );

  assert.equal(typographyPaths.length, recipes.length * properties.length);

  for (const recipe of recipes) {
    for (const property of properties) {
      const path = `semantic.typography.${recipe}.${property}`;
      assert.ok(light.has(path), `light: missing ${path}`);
      assert.ok(dark.has(path), `dark: missing ${path}`);
      assert.equal(light.get(path), dark.get(path), `${path} should be theme-independent`);
    }
  }

  assert.equal(light.get("semantic.typography.heading.large.fontSize"), "30px");
  assert.equal(light.get("semantic.typography.heading.small.fontSize"), "20px");
  assert.equal(light.get("semantic.typography.eyebrow.letterSpacing"), "0.08em");
});
