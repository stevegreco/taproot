import assert from "node:assert/strict";
import { cp, mkdtemp, readdir, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "vitest";
import Ajv2020 from "ajv/dist/2020.js";

const Ajv = Ajv2020.default ?? Ajv2020;
const publicDir = join(dirname(fileURLToPath(import.meta.url)), "../dist/public");

test("a copied dist/public compiles authored and compiled schemas without repository schemas", async () => {
  const isolated = await mkdtemp(join(tmpdir(), "knowledge-public-schemas-"));
  await cp(publicDir, isolated, { recursive: true });

  const schemaDir = join(isolated, "schema");
  const names = (await readdir(schemaDir)).filter((name) => name.endsWith(".json")).sort();
  assert.deepEqual(names, [
    "compiled-knowledge-record.json",
    "host-binding.json",
    "knowledge-record.json",
    "portable-contract.json",
  ]);

  const ajv = new Ajv({ allErrors: true, strict: true });
  for (const name of names) {
    const schema = JSON.parse(await readFile(join(schemaDir, name), "utf8"));
    ajv.addSchema(schema);
  }

  const authored = ajv.getSchema("urn:stevegreco:design-system:knowledge-record:1");
  const compiled = ajv.getSchema("urn:stevegreco:design-system:compiled-knowledge-record:3");
  assert.equal(typeof authored, "function");
  assert.equal(typeof compiled, "function");

  const records = JSON.parse(await readFile(join(isolated, "records.json"), "utf8"));
  const button = records.find((record) => record.id === "component.button");
  const binding = records.find((record) => record.id === "binding.button.web-component");
  assert.equal(compiled(button), true, JSON.stringify(compiled.errors, null, 2));
  assert.equal(compiled(binding), true, JSON.stringify(compiled.errors, null, 2));
});
