// WCAG 2.1 contrast audit over the semantic tier, both themes.
//
// Reads resolved values from dist/tokens/semantic.*.json because source files
// contain unresolved aliases. Run it after the token build.
//
// Failures, including pairs whose tokens are missing, fail `pnpm build`; see
// scripts/audit.js for the --report-only escape hatch.

import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { ratio } from "./lib/color.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const TEXT = 4.5; // WCAG 1.4.3 Contrast (Minimum), normal-weight body text
const NON_TEXT = 3.0; // WCAG 1.4.11 Non-text Contrast, UI boundaries and states

// Every pair worth asserting, with the requirement that applies to it.
//
// `exempt` pairs are computed and printed but never fail: WCAG explicitly
// exempts disabled controls from contrast minimums. They are here because a
// disabled state that is *too* faint in one theme and not the other is still
// a bug worth seeing, just not one that blocks a release.
const PAIRS = [
  // Foundation content on supported surfaces
  ["color.foreground.default", "color.background.default", TEXT, "body text on page"],
  ["color.foreground.default", "color.background.surface", TEXT, "body text on surface"],
  ["color.foreground.default", "color.background.sunken", TEXT, "body text on sunken"],
  ["color.foreground.default", "color.background.muted", TEXT, "body text on muted"],
  ["color.foreground.muted", "color.background.default", TEXT, "muted text on page"],
  ["color.foreground.muted", "color.background.surface", TEXT, "muted text on surface"],

  // Explicit solid-fill pairings
  ["color.foreground.on.brand.default", "color.background.brand.default", TEXT, "content on brand"],
  ...["default", "hover", "pressed"].map((state) => [
    "color.foreground.on.action.primary",
    `color.background.action.primary.${state}`,
    TEXT,
    `content on primary action ${state}`,
  ]),
  ...["default", "hover", "pressed"].map((state) => [
    "color.foreground.on.action.destructive",
    `color.background.action.destructive.${state}`,
    TEXT,
    `content on destructive action ${state}`,
  ]),
  [
    "color.foreground.default",
    "color.background.action.secondary.default",
    TEXT,
    "content on secondary action base",
  ],

  // Brand content on a foundation background
  ["color.foreground.brand.default", "color.background.default", TEXT, "brand content on page"],

  // Functional UI boundaries
  ["color.border.default", "color.background.default", NON_TEXT, "border vs page"],
  ["color.border.default", "color.background.surface", NON_TEXT, "border vs surface"],
  ["color.border.strong", "color.background.default", NON_TEXT, "strong border vs page"],
  ["color.border.focus", "color.background.default", NON_TEXT, "focus border vs page"],
  ...["default", "hover", "pressed"].flatMap((state) => [
    [
      `color.border.action.primary.${state}`,
      "color.background.default",
      NON_TEXT,
      `primary action ${state} border vs page`,
    ],
    [
      `color.border.action.primary.${state}`,
      "color.background.surface",
      NON_TEXT,
      `primary action ${state} border vs surface`,
    ],
  ]),
  ...["default", "hover", "pressed"].flatMap((state) => [
    [
      `color.border.action.destructive.${state}`,
      "color.background.default",
      NON_TEXT,
      `destructive action ${state} border vs page`,
    ],
    [
      `color.border.action.destructive.${state}`,
      "color.background.surface",
      NON_TEXT,
      `destructive action ${state} border vs surface`,
    ],
  ]),

  // Quiet status surfaces. foreground.default's description says it is
  // supported here, so that pairing is part of the contract, alongside the
  // explicit status content and border roles.
  ...["success", "danger", "warning", "info"].flatMap((s) => [
    [
      "color.foreground.default",
      `color.background.status.${s}.default`,
      TEXT,
      `body text on quiet ${s} status`,
    ],
    [
      `color.foreground.status.${s}.default`,
      `color.background.status.${s}.default`,
      TEXT,
      `${s} content on quiet status surface`,
    ],
    [
      `color.border.status.${s}.default`,
      `color.background.status.${s}.default`,
      NON_TEXT,
      `${s} border on quiet status surface`,
    ],
    // Controls inside a status message, such as Alert's dismiss control.
    [
      "color.border.focus",
      `color.background.status.${s}.default`,
      NON_TEXT,
      `focus border on quiet ${s} status`,
    ],
  ]),

  // Disabled — reported, never blocking
  ["color.foreground.disabled", "color.background.disabled", TEXT, "disabled label", "exempt"],
  [
    "color.border.disabled",
    "color.background.default",
    NON_TEXT,
    "disabled border vs page",
    "exempt",
  ],
];

function get(tree, path) {
  return path.split(".").reduce((node, key) => node?.[key], tree);
}

function auditTheme(theme) {
  const tree = JSON.parse(
    readFileSync(join(ROOT, `dist/tokens/semantic.${theme}.json`), "utf-8"),
  ).semantic;

  const results = [];
  for (const [fgPath, bgPath, required, label, flag] of PAIRS) {
    const fg = get(tree, fgPath);
    const bg = get(tree, bgPath);

    if (typeof fg !== "string" || typeof bg !== "string") {
      results.push({ label, fgPath, bgPath, status: "missing" });
      continue;
    }

    const value = ratio(fg, bg);
    const passes = value >= required;
    results.push({
      label,
      fgPath,
      bgPath,
      fg,
      bg,
      required,
      value,
      status: flag === "exempt" ? "exempt" : passes ? "pass" : "fail",
    });
  }
  return results;
}

function report(theme, results) {
  const failures = results.filter((r) => r.status === "fail");
  const missing = results.filter((r) => r.status === "missing");
  const exempt = results.filter((r) => r.status === "exempt" && r.value < r.required);

  console.log(`\n  ${theme}`);
  console.log(`  ${"─".repeat(60)}`);

  if (!failures.length && !missing.length) {
    console.log(`  ✔ all ${results.length} pairs meet their requirement`);
  }

  for (const r of failures) {
    console.log(
      `  ✘ ${r.label}\n` +
        `      ${r.fgPath} ${r.fg}  on  ${r.bgPath} ${r.bg}\n` +
        `      ${r.value.toFixed(2)}:1 — needs ${r.required}:1`,
    );
  }

  for (const r of missing) {
    console.log(`  ✘ ${r.label} — not defined in ${theme} (${r.fgPath} or ${r.bgPath})`);
  }

  for (const r of exempt) {
    console.log(
      `  ~ ${r.label} — ${r.value.toFixed(2)}:1, below ${r.required}:1 but exempt (disabled state)`,
    );
  }

  // A missing token drops its check, so it counts as a failure: renaming or
  // deleting a pair token in both themes would otherwise pass parity and here.
  return failures.length + missing.length;
}

export function run() {
  console.log("\nContrast audit — WCAG 2.1");

  let total = 0;
  for (const theme of ["light", "dark"]) {
    total += report(theme, auditTheme(theme));
  }
  return total;
}
