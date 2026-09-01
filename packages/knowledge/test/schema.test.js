import assert from "node:assert/strict";
import { test } from "node:test";
import Ajv2020 from "ajv/dist/2020.js";
import schema from "../src/schema/index.js";

test("exported schema compiles as JSON Schema draft 2020-12", () => {
  const Ajv = Ajv2020.default ?? Ajv2020;
  const validate = new Ajv({ strict: true }).compile(schema);

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
