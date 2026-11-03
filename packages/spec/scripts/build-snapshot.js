#!/usr/bin/env node
/** Write a spec snapshot for a hosted deploy: build-snapshot.js --out <file> [--impl <name> ...] */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { buildSnapshot } from "../src/build-snapshot.js";

const { values } = parseArgs({
  options: {
    out: { type: "string" },
    impl: { type: "string", multiple: true },
    config: { type: "string" },
  },
});
if (!values.out) throw new Error("build-snapshot needs --out <file>.");

const snapshot = await buildSnapshot({ implementations: values.impl, configPath: values.config });
const text = JSON.stringify(snapshot);
mkdirSync(path.dirname(path.resolve(values.out)), { recursive: true });
writeFileSync(values.out, text);
const implementations = Object.keys(snapshot.implementations).join(", ") || "no implementations";
process.stdout.write(
  `${values.out}: ${snapshot.records.length} records, ${implementations}, ${Object.keys(snapshot.tokens).length} tokens, ${Math.round(text.length / 1024)} KB\n`,
);
