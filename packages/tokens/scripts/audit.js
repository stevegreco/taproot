// Token guardrails. Runs as the last step of `pnpm build`, after dist/ exists —
// the contrast and parity checks read resolved values, so they run after build.
//
// Contrast asks whether a pair is legible. Parity asks whether the two themes
// are the same system. Ramps ask whether each numbered primitive stop is honest.
// A theme can pass every contrast pair and still fail parity, which is why all
// three run.
//
// Blocking: any failure exits non-zero and fails `pnpm build`. Pass
// --report-only to see the full picture without failing, which is useful
// mid-change.

import { run as contrast } from "./audit-contrast.js";
import { run as parity } from "./audit-parity.js";
import { run as ramps } from "./audit-ramps.js";

const reportOnly = process.argv.includes("--report-only");

const failures = contrast() + parity() + ramps();

console.log("");
if (failures === 0) {
  console.log("  No failures.\n");
  process.exit(0);
}

console.log(`  ${failures} failure${failures === 1 ? "" : "s"}.`);
if (reportOnly) {
  console.log("  Report-only — omit --report-only to fail the build on these.\n");
  process.exit(0);
}
console.log("");
process.exit(1);
