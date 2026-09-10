// Structural parity between the light and dark semantic themes.
//
// Enforces the machine-checkable half of ADR-0002. Contrast says whether a
// single pair is legible; parity says whether the two themes are the same
// system. TOK-01 passed every contrast check it was subject to and was still
// wrong, because nothing compared the themes to each other.

import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { lstar, isHex, leaves } from "./lib/color.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

// A token whose L* moves less than this between themes is treated as static.
// Chosen to sit well below the smallest deliberate step in the palette
// (robRoy.400 -> 300 is 7 points) and well above float noise.
const STATIC_L = 5;

// Tokens that are the same in both themes on purpose. Each needs a reason —
// an empty exemption list is the goal, and every entry here is a claim that
// the token is theme-independent, not merely that it hasn't been fixed yet.
const MIRROR_EXEMPT = new Map([
  [
    "color.foreground.disabled",
    "disabled content intentionally uses the same neutral gray in both themes",
  ],
]);

function loadTheme(theme) {
  const tree = JSON.parse(
    readFileSync(join(ROOT, `dist/tokens/semantic.${theme}.json`), "utf-8"),
  ).semantic;
  return new Map(leaves(tree));
}

// --- 1. Key parity -----------------------------------------------------------

function checkKeys(light, dark, fail) {
  const onlyLight = [...light.keys()].filter((k) => !dark.has(k));
  const onlyDark = [...dark.keys()].filter((k) => !light.has(k));

  for (const k of onlyLight) fail(`${k} — defined in light, missing from dark`);
  for (const k of onlyDark) fail(`${k} — defined in dark, missing from light`);

  if (!onlyLight.length && !onlyDark.length) {
    console.log(`  ✔ both themes define the same ${light.size} tokens`);
  }
}

// --- 2. Mirrored ramps (ADR-0002 §1) -----------------------------------------
//
// Every color token must respond to the theme. Comparing the token against
// itself across themes is the only formulation that catches TOK-01: measured
// against the page instead, status.danger.default looks correct in both
// themes, because it is darker than the light page and lighter than the dark
// page — while never actually moving. The page moved past it.

function checkMirroring(light, dark, fail) {
  const statics = [];

  for (const [key, lv] of light) {
    const dv = dark.get(key);
    if (!isHex(lv) || !isHex(dv)) continue;
    if (MIRROR_EXEMPT.has(key)) continue;

    const delta = lstar(dv) - lstar(lv);
    if (Math.abs(delta) < STATIC_L) {
      statics.push({ key, lv, dv, l: lstar(lv), d: lstar(dv) });
    }
  }

  for (const s of statics) {
    fail(
      `${s.key} — static across themes\n` +
        `      light ${s.lv} L* ${s.l.toFixed(0)}   dark ${s.dv} L* ${s.d.toFixed(0)}   Δ ${(s.d - s.l).toFixed(1)}`,
    );
  }

  if (!statics.length) {
    console.log("  ✔ every color token responds to the theme");
  }
  for (const [key, why] of MIRROR_EXEMPT) {
    if (light.has(key)) console.log(`  · ${key} exempt — ${why}`);
  }
}

// --- 3. Interaction-state direction (ADR-0002 §2) ----------------------------
//
// Light themes step toward the darker end of the ramp on hover and pressed;
// dark themes step toward the lighter end. Pressed is further along than hover
// and may never resolve to the same value.

function interactiveGroups(theme) {
  const groups = new Map();
  for (const key of theme.keys()) {
    const m = key.match(/^(.*)\.(default|hover|pressed)$/);
    if (!m) continue;
    if (!isHex(theme.get(key))) continue;
    const [, group, state] = m;
    if (!groups.has(group)) groups.set(group, {});
    groups.get(group)[state] = theme.get(key);
  }
  return groups;
}

function checkDirection(theme, name, fail) {
  const expected = name === "light" ? -1 : 1;
  const word = name === "light" ? "darker" : "lighter";
  let checked = 0;

  for (const [group, states] of interactiveGroups(theme)) {
    if (!states.default) continue;
    const base = lstar(states.default);

    for (const state of ["hover", "pressed"]) {
      if (!states[state]) continue;
      checked++;
      const delta = lstar(states[state]) - base;

      if (Math.abs(delta) < 1) {
        fail(`${group}.${state} — indistinguishable from ${group}.default in ${name}`);
      } else if (Math.sign(delta) !== expected) {
        fail(
          `${group}.${state} — steps the wrong way in ${name}\n` +
            `      default ${states.default} L* ${base.toFixed(0)} → ${state} ${states[state]} L* ${lstar(states[state]).toFixed(0)}\n` +
            `      ADR-0002 §2: ${name} themes step ${word}`,
        );
      }
    }

    if (states.hover && states.pressed && states.hover === states.pressed) {
      fail(
        `${group}.pressed — identical to ${group}.hover in ${name}, so pressing has no feedback`,
      );
    } else if (states.hover && states.pressed) {
      const h = Math.abs(lstar(states.hover) - base);
      const p = Math.abs(lstar(states.pressed) - base);
      if (p < h) {
        fail(
          `${group}.pressed — closer to default than ${group}.hover is in ${name} (Δ ${p.toFixed(1)} vs ${h.toFixed(1)})`,
        );
      }
    }
  }

  return checked;
}

// --- entry point -------------------------------------------------------------

export function run() {
  const failures = [];
  const fail = (msg) => failures.push(msg);

  const light = loadTheme("light");
  const dark = loadTheme("dark");

  console.log("\nTheme parity — ADR-0002");
  console.log(`  ${"─".repeat(60)}`);

  checkKeys(light, dark, fail);
  checkMirroring(light, dark, fail);

  let checked = 0;
  checked += checkDirection(light, "light", fail);
  checked += checkDirection(dark, "dark", fail);
  console.log(`  · ${checked} interaction states checked for direction`);

  if (failures.length) {
    console.log("");
    for (const f of failures) console.log(`  ✘ ${f}`);
  }

  return failures.length;
}
