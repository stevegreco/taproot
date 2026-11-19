#!/usr/bin/env node
// Runs a whole suite in one command: builds the packages, rebuilds the eval project so the agents
// see the current packages, runs every setup, and prints the build suite's summary. From the
// repository root:
//   pnpm eval build [--model ID] [--flow DIR] [--reps N] [--concurrency N] [--approve-harness]
//   pnpm eval answer [same options]
// Options after the suite go to run-eval.mjs. Without --flow, results go to a folder named for the
// suite and today's date, so a second run on the same day resumes the first.

import { spawnSync } from "node:child_process";

const SUITES = { answer: "answer-runs", build: "build-runs" };
const VARIANTS = ["baseline", "v1", "v2"];

const [suite, ...options] = process.argv.slice(2);
if (!SUITES[suite]) {
  console.error("usage: pnpm eval <build|answer> [run-eval.mjs options]");
  process.exit(2);
}
if (!options.includes("--flow")) {
  const today = new Date().toISOString().slice(0, 10);
  options.push("--flow", `evals/taproot-usage/${SUITES[suite]}-${today}`);
}
const flow = options[options.indexOf("--flow") + 1];
const env = { ...process.env, TAPROOT_EVAL_SUITE: suite };

function run(command, args) {
  console.error(`\n> ${command} ${args.join(" ")}`);
  return spawnSync(command, args, { stdio: "inherit", env }).status ?? 1;
}

if (run("pnpm", ["build"]) !== 0) process.exit(1);
const project = process.env.TAPROOT_EVAL_PROJECT;
if (run("node", ["evals/taproot-usage/setup-project.mjs", ...(project ? [project] : [])]) !== 0)
  process.exit(1);

let failed = false;
for (const variant of VARIANTS) {
  const status = run("node", [
    "evals/taproot-usage/run-eval.mjs",
    "--variant",
    variant,
    ...options,
  ]);
  // 2 is a refusal before any model call, such as an unapproved harness. The next setups would
  // refuse the same way, so stop here.
  if (status === 2) process.exit(2);
  if (status !== 0) failed = true;
}

if (suite === "build") run("node", ["evals/taproot-usage/summarize-build.mjs", flow]);
console.error(`\nResults and transcripts: ${flow}`);
process.exit(failed ? 1 : 0);
