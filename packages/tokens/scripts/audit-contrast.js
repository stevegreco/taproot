// WCAG 2.1 contrast audit over the semantic tier, both themes.
//
// Reads resolved values from dist/tokens/semantic.*.json — source files hold
// unresolved aliases, so this must run after the build (see ADR-0001 for the
// same reasoning applied to the MCP server).
//
// Report-only by default: prints failures and exits 0, so `pnpm build` stays
// green while the remediation lands. Pass --strict to exit non-zero instead.
// Issue #8 flips the build over to --strict once border.default is fixed.

import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

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
  // Body text on each surface
  ["color.foreground.default", "color.background.default", TEXT, "body text on page"],
  ["color.foreground.default", "color.background.raised", TEXT, "body text on raised"],
  ["color.foreground.default", "color.background.sunken", TEXT, "body text on sunken"],
  ["color.foreground.default", "color.background.muted", TEXT, "body text on muted"],
  ["color.foreground.muted", "color.background.default", TEXT, "muted text on page"],
  ["color.foreground.muted", "color.background.raised", TEXT, "muted text on raised"],
  ["color.foreground.subtle", "color.background.default", TEXT, "subtle text on page"],
  ["color.foreground.subtle", "color.background.raised", TEXT, "subtle text on raised"],
  ["color.foreground.faint", "color.background.default", TEXT, "faint text on page"],
  ["color.foreground.faint", "color.background.raised", TEXT, "faint text on raised"],

  // Accent as a solid surface carrying its own label
  ["color.accent.foreground", "color.accent.default", TEXT, "label on accent"],
  ["color.accent.foreground", "color.accent.hover", TEXT, "label on accent hover"],
  ["color.accent.foreground", "color.accent.press", TEXT, "label on accent press"],
  ["color.accent.default", "color.background.default", NON_TEXT, "accent surface vs page"],

  // Secondary reads as text and as a border, never as a solid fill
  ["color.secondary.default", "color.background.default", TEXT, "secondary text on page"],

  // UI boundaries — the 1.4.11 cases
  ["color.border.default", "color.background.default", NON_TEXT, "border vs page"],
  ["color.border.default", "color.background.raised", NON_TEXT, "border vs raised"],
  ["color.border.strong", "color.background.default", NON_TEXT, "strong border vs page"],
  ["color.focus.ring", "color.background.default", NON_TEXT, "focus ring vs page"],

  // Status: solid surface, its label, and the tinted callout variant
  ...["success", "danger", "warning", "info"].flatMap((s) => [
    [`color.status.${s}.default`, "color.background.default", NON_TEXT, `${s} surface vs page`],
    [`color.status.${s}.onDefault`, `color.status.${s}.default`, TEXT, `label on ${s}`],
    [`color.status.${s}.foreground`, `color.status.${s}.background`, TEXT, `${s} callout text`],
  ]),

  // Disabled — reported, never blocking
  ["color.disabled.foreground", "color.disabled.background", TEXT, "disabled label", "exempt"],
  ["color.disabled.border", "color.background.default", NON_TEXT, "disabled border vs page", "exempt"],
];

function get(tree, path) {
  return path.split(".").reduce((node, key) => node?.[key], tree);
}

function channel(v) {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminance(hex) {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? [...h].map((c) => c + c).join("") : h;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function ratio(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

function auditTheme(theme) {
  const tree = JSON.parse(
    readFileSync(join(ROOT, `dist/tokens/semantic.${theme}.json`), "utf-8")
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
        `      ${r.value.toFixed(2)}:1 — needs ${r.required}:1`
    );
  }

  for (const r of missing) {
    console.log(`  · ${r.label} — not defined in ${theme} (${r.fgPath} or ${r.bgPath})`);
  }

  for (const r of exempt) {
    console.log(
      `  ~ ${r.label} — ${r.value.toFixed(2)}:1, below ${r.required}:1 but exempt (disabled state)`
    );
  }

  return failures.length;
}

const strict = process.argv.includes("--strict");

console.log("\nContrast audit — WCAG 2.1");

let total = 0;
for (const theme of ["light", "dark"]) {
  total += report(theme, auditTheme(theme));
}

console.log("");
if (total === 0) {
  console.log("  No contrast failures.\n");
  process.exit(0);
}

console.log(`  ${total} contrast failure${total === 1 ? "" : "s"} across both themes.`);
if (strict) {
  process.exit(1);
}
console.log("  Report-only — see issue #8. Run with --strict to make this blocking.\n");
