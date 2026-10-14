#!/usr/bin/env node
/**
 * Scaffold a component phase's files.
 *
 *   pnpm component:new <name> --phase spec
 *
 * The spec phase writes a draft record with `TODO:` placeholders for the fields the schema
 * requires. `pnpm spec validate` reports each placeholder until it is replaced. It never
 * overwrites: if the record exists, it stops.
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { draftComponent } from "../packages/spec/src/draft.js";

const SCAFFOLDED = ["spec"];
const usage = `Usage: pnpm component:new <name> --phase ${SCAFFOLDED.join("|")}   (for example: tooltip)`;

const { values, positionals } = parseArgs({
  options: { phase: { type: "string" } },
  allowPositionals: true,
});
const [name] = positionals;
if (!name || positionals.length > 1 || !values.phase) {
  console.error(usage);
  process.exit(2);
}
if (!SCAFFOLDED.includes(values.phase)) {
  console.error(`Only --phase ${SCAFFOLDED.join(", ")} is scaffolded so far.\n${usage}`);
  process.exit(2);
}

let source;
try {
  source = draftComponent(name, {
    header: "# yaml-language-server: $schema=../../../src/schema/spec-record.schema.json",
  });
} catch (error) {
  console.error(`${error.message}\n${usage}`);
  process.exit(2);
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const relative = `packages/spec/content/components/${name}/${name}.spec.yaml`;
const file = path.join(root, relative);
if (existsSync(file)) {
  console.error(`${relative} already exists. Edit it instead.`);
  process.exit(1);
}

mkdirSync(path.dirname(file), { recursive: true });
writeFileSync(file, source);
console.log(`Wrote ${relative}

Next:
  1. Replace every TODO: placeholder. \`pnpm spec validate\` lists the ones left.
  2. pnpm component:status ${name} --phase spec`);
