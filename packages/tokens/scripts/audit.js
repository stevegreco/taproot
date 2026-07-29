// Token guardrails. Runs as the last step of `pnpm build`, after dist/ exists —
// both checks read resolved values, so neither can run against source (ADR-0001).
//
// Contrast asks whether a pair is legible. Parity asks whether the two themes
// are the same system. TOK-01 passed every contrast check it was subject to and
// was still wrong, which is why both run.
//
// Blocking: any failure exits non-zero and fails `pnpm build`. This ran
// report-only while the remediation landed; #8, #11 and #17 cleared the last
// of it, so the gate is now the thing that keeps it clear. Pass --report-only
// to see the full picture without failing, which is useful mid-change.

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
