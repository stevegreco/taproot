import { test } from "vitest";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const base = readFileSync(new URL("../src/css/base.css", import.meta.url), "utf8");
const tokens = readFileSync(new URL("../dist/css/tokens.css", import.meta.url), "utf8");
const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));

const used = [...base.matchAll(/var\((--[a-z0-9-]+)\)/g)].map((match) => match[1]);
const published = new Set([...tokens.matchAll(/^\s*(--ds-[a-z0-9-]+):/gm)].map((m) => m[1]));

test("the base stylesheet reads only published semantic tokens", () => {
  assert.ok(used.length > 0);
  for (const name of used) {
    assert.ok(published.has(name), `${name} is not in tokens.css`);
    assert.match(name, /^--ds-semantic-/, `${name} is not a semantic token (tokens ADR 0003)`);
  }
});

test("every base rule has zero specificity, so product styles override it", () => {
  const selectors = [...base.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/^([^\s{}][^{]*)\{/gm)];
  assert.ok(selectors.length > 0);
  for (const [, selector] of selectors) {
    assert.match(
      selector.trim(),
      /^:where\([^)]*\)$/,
      `${selector.trim()} is not wrapped in :where()`,
    );
  }
});

test("each heading level and the body use a typography recipe", () => {
  for (const [selector, recipe] of [
    ["body", "body-md"],
    ["h1", "heading-lg"],
    ["h2", "heading-md"],
    ["h3", "heading-sm"],
  ]) {
    const block = base.match(new RegExp(`:where\\(${selector}\\) \\{([^}]*)\\}`))?.[1] ?? "";
    for (const property of [
      "font-family",
      "font-size",
      "font-weight",
      "line-height",
      "letter-spacing",
    ]) {
      assert.ok(
        block.includes(`${property}: var(--ds-semantic-typography-${recipe}-${property})`),
        `${selector} does not set ${property} from ${recipe}`,
      );
    }
  }
});

test("the package exports the base stylesheet", () => {
  assert.equal(pkg.exports["./base"], "./dist/css/base.css");
  assert.equal(pkg.exports["./base.css"], "./dist/css/base.css");
});
