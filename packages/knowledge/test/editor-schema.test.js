import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "vitest";
import Ajv2020 from "ajv/dist/2020.js";
import { parse } from "yaml";

const Ajv = Ajv2020.default ?? Ajv2020;
const components = join(dirname(fileURLToPath(import.meta.url)), "../content/components");
const specs = readdirSync(components).map((name) => join(components, name, `${name}.spec.yaml`));
const HEADER = /^# yaml-language-server: \$schema=(\S+)\n/;

test.each(specs)("%s validates against the schema its header names, as an editor does", (path) => {
  const text = readFileSync(path, "utf8");
  const header = HEADER.exec(text);
  assert.ok(header, "the spec starts with a yaml-language-server schema header");
  const schemaPath = resolve(dirname(path), header[1]);
  const validate = new Ajv({ allErrors: true, strict: false }).compile(
    JSON.parse(readFileSync(schemaPath, "utf8")),
  );
  assert.equal(validate(parse(text)), true, JSON.stringify(validate.errors, null, 2));
});
