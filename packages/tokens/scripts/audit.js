// Token guardrails. Runs as the last step of `pnpm build`, after dist/ exists —
// both checks read resolved values, so neither can run against source (ADR-0001).
//
// Contrast asks whether a pair is legible. Parity asks whether the two themes
// are the same system. TOK-01 passed every contrast check it was subject to and
// was still wrong, which is why both run.
//
// Report-only by default: prints everything, exits 0, so the build stays green
// while the remediation lands. `--strict` exits non-zero. Issue #8 switches the
// build over to --strict once border.default is fixed.

import { run as contrast } from "./audit-contrast.js";
import { run as parity } from "./audit-parity.js";
import { run as ramps } from "./audit-ramps.js";

const strict = process.argv.includes("--strict");

const failures = contrast() + parity() + ramps();

console.log("");
if (failures === 0) {
  console.log("  No failures.\n");
  process.exit(0);
}

console.log(`  ${failures} failure${failures === 1 ? "" : "s"}.`);
if (strict) {
  process.exit(1);
}
console.log("  Report-only — see issue #8. Run with --strict to make this blocking.\n");
