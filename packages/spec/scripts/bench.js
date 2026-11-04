#!/usr/bin/env node
/**
 * Time how long `taproot get button` takes, the way an agent calls it: a fresh `node` process per
 * call, run from the repository root so it finds spec.config.json. Not part of `pnpm test`; a
 * looser 1 s limit in test/cli.test.js catches large regressions.
 *
 *   pnpm bench [--runs <n>]
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

/** The time a developer machine should beat, in milliseconds. */
const TARGET_MS = 300;

const here = path.dirname(fileURLToPath(import.meta.url));
const bin = path.resolve(here, "../bin/taproot.js");
const repoRoot = path.resolve(here, "../../..");
const args = ["get", "button"];

const { values } = parseArgs({ options: { runs: { type: "string", default: "10" } } });
const runs = Number(values.runs);
if (!Number.isInteger(runs) || runs < 1) {
  console.error("--runs must be a positive integer.");
  process.exit(2);
}

function once() {
  const started = performance.now();
  const result = spawnSync(process.execPath, [bin, ...args], { cwd: repoRoot, encoding: "utf8" });
  const ms = performance.now() - started;
  if (result.status !== 0) {
    console.error(`taproot ${args.join(" ")} exited ${result.status}:\n${result.stderr}`);
    process.exit(1);
  }
  return ms;
}

// The first call warms the file system cache, so it is left out.
once();
const times = Array.from({ length: runs }, once).sort((a, b) => a - b);
const median = times[Math.floor(times.length / 2)];
const fmt = (ms) => `${Math.round(ms)} ms`;

console.log(`taproot ${args.join(" ")}, ${runs} runs after one warm-up`);
console.log(`  min ${fmt(times[0])}, median ${fmt(median)}, max ${fmt(times.at(-1))}`);
console.log(
  median <= TARGET_MS
    ? `  Median is within the ${TARGET_MS} ms target.`
    : `  Median is over the ${TARGET_MS} ms target by ${fmt(median - TARGET_MS)}.`,
);
