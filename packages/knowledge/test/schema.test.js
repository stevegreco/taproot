import assert from "node:assert/strict";
import { test } from "vitest";
import schema from "../src/schema/index.js";
import { createKnowledgeAjv } from "../src/schema/ajv.js";

test("exported schema compiles as JSON Schema draft 2020-12", () => {
  const validate = createKnowledgeAjv({ allErrors: false }).compile(schema);

  assert.equal(typeof validate, "function");
  assert.equal(schema.$schema, "https://json-schema.org/draft/2020-12/schema");
  assert.equal(schema.$id, "urn:stevegreco:design-system:knowledge-record:1");
});

test("package exports the language-neutral schema artifact", async () => {
  const exported = await import(
    "@stevegreco/design-system-knowledge/schema/knowledge-record.json",
    { with: { type: "json" } }
  );

  assert.deepEqual(exported.default, schema);
});

test("package exports the portable contract and host binding schemas", async () => {
  const portable = await import(
    "@stevegreco/design-system-knowledge/schema/portable-contract.json",
    { with: { type: "json" } }
  );
  const host = await import("@stevegreco/design-system-knowledge/schema/host-binding.json", {
    with: { type: "json" },
  });

  assert.equal(portable.default.$id, "urn:stevegreco:design-system:portable-contract:5");
  assert.equal(host.default.$id, "urn:stevegreco:design-system:host-binding:1");
});
