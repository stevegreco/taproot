#!/usr/bin/env node
/**
 * Scaffold a draft spec for the spec phase.
 *
 *   pnpm component:new <name> --phase spec
 *
 * Writes a draft record with a `TODO:` placeholder for each field a draft needs.
 * `pnpm spec validate` reports each placeholder until it is replaced. It never overwrites.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

const usage = "Usage: pnpm component:new <name> --phase spec   (for example: tooltip)";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const schema = JSON.parse(
  readFileSync(path.join(root, "packages/spec/src/schema/spec-record.schema.json"), "utf8"),
);

const { values, positionals } = parseArgs({
  options: { phase: { type: "string" } },
  allowPositionals: true,
});
const [name] = positionals;
if (
  positionals.length !== 1 ||
  values.phase !== "spec" ||
  !new RegExp(schema.$defs.name.pattern).test(name)
) {
  console.error(usage);
  process.exit(2);
}

// A record's identity is its id, not its path, so look for the id in every spec file.
const contentDir = path.join(root, "packages/spec/content");
const idLine = new RegExp(`^id:\\s*["']?component\\.${name}["']?\\s*$`, "m");
const existing = readdirSync(contentDir, { recursive: true }).find(
  (entry) =>
    entry.endsWith(".spec.yaml") && idLine.test(readFileSync(path.join(contentDir, entry), "utf8")),
);
if (existing) {
  console.error(
    `component.${name} already exists in packages/spec/content/${existing}. Edit it instead.`,
  );
  process.exit(1);
}

const relative = `packages/spec/content/components/${name}/${name}.spec.yaml`;
const file = path.join(root, relative);
if (existsSync(file)) {
  console.error(`${relative} already exists. Edit it instead.`);
  process.exit(1);
}

// `radio-group` → `Radio group`, the way component titles are written.
const title = name[0].toUpperCase() + name.slice(1).replaceAll("-", " ");

mkdirSync(path.dirname(file), { recursive: true });
writeFileSync(
  file,
  `# yaml-language-server: $schema=../../../src/schema/spec-record.schema.json
id: component.${name}
type: component
title: ${title}
summary: "TODO: Use ${title} to … (one sentence that says when to use it)"
status: draft
description: "TODO: What it shows or does, in a sentence or two."
usage:
  do:
    - "TODO: A concrete situation it is for."
  avoid:
    - situation: "TODO: A situation ${title} looks right for but isn't."
      instead: "TODO: A record ID, such as component.button, or plain text when none exists."
      why: "TODO: Why the other choice fits better."
anatomy:
  container:
    role: container
    description: "TODO: What this part is. Name each part in reading order."
`,
);
console.log(
  `Wrote ${relative}. Replace every TODO: placeholder; \`pnpm spec validate\` lists the ones left.`,
);
