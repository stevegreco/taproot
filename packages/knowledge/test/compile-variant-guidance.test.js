import assert from "node:assert/strict";
import { test } from "vitest";
import { assembleRecord, checkVariantGuidance } from "../src/compile/records.js";

const component = {
  id: "component.scratch",
  type: "component",
  contract: { parameters: { variant: { kind: "enum", values: { primary: "Scratch." } } } },
};

function pattern(overrides = {}) {
  return {
    id: "pattern.scratch",
    type: "pattern",
    relations: { guides: ["component.scratch"] },
    body: "## Assign emphasis\n\n### Primary\n\nScratch primary guidance.\n\n### Empty\n\n## Avoid\n",
    variantGuidance: { "component.scratch": { primary: "primary" } },
    ...overrides,
  };
}

function messages(...patterns) {
  const records = new Map([component, ...patterns].map((record) => [record.id, record]));
  return checkVariantGuidance(records).map((item) => item.message);
}

test("variant guidance that names a guided variant and a heading with text passes", () => {
  assert.deepEqual(messages(pattern()), []);
});

test("variant guidance fails on anchors, variants, or components the records do not have", () => {
  assert.match(
    messages(pattern({ variantGuidance: { "component.scratch": { primary: "missing" } } }))[0],
    /names #missing, but no ### heading/,
  );
  assert.match(
    messages(pattern({ variantGuidance: { "component.scratch": { primary: "empty" } } }))[0],
    /names #empty, but no ### heading with text/,
  );
  assert.match(
    messages(pattern({ variantGuidance: { "component.scratch": { ghost: "primary" } } }))[0],
    /variant ghost, which its contract does not have/,
  );
  assert.match(messages(pattern({ relations: {} }))[0], /which the pattern does not guide/);
  assert.match(
    messages(pattern(), pattern({ id: "pattern.again" }))[0],
    /pattern\.again variantGuidance guides component\.scratch variant primary, which pattern\.scratch already guides/,
  );
});

test("a list of variants compiles to anchors named after each variant", () => {
  const record = assembleRecord(
    pattern({ variantGuidance: { "component.scratch": ["primary"] } }),
    { sources: [], fields: {} },
    [],
  );
  assert.deepEqual(record.variantGuidance, { "component.scratch": { primary: "primary" } });
});
