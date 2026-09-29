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
  assert.deepEqual(names, ["compiled-knowledge-record.json", "knowledge-record.json"]);

  // Each schema is self-contained, so it compiles on its own.
  const load = async (name) =>
    new Ajv({ allErrors: true, strict: true }).compile(
      JSON.parse(await readFile(join(schemaDir, name), "utf8")),
    );
  const authored = await load("knowledge-record.json");
  const compiled = await load("compiled-knowledge-record.json");
  assert.equal(typeof authored, "function");
  assert.equal(typeof compiled, "function");

  const records = JSON.parse(await readFile(join(isolated, "records.json"), "utf8"));
  const button = records.find((record) => record.id === "component.button");
  assert.equal(compiled(button), true, JSON.stringify(compiled.errors, null, 2));
  assert.ok(button.web, "the web section compiles onto the component");
});
