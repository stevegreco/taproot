// Ramp integrity — ADR 0002, "Numbered ramps preserve palette integrity".
//
// A numbered stop promises: same hue family, one step of lightness. This
// asserts the three bounds that promise reduces to, and it is what keeps a
// one-off surface fill from being given a ramp position it hasn't earned.

import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { lstar, rgb, isHex } from "./lib/color.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

// Saturation is the discriminator, and the failure mode is directional: a
// retrofitted surface fill *collapses* saturation (rust.900 dropped 45 points,
// robRoy.850 dropped 34). Among true adjacent stops the largest drop measured
// anywhere is 8.1, so 10 is a tight bound. A rise is not the surface
// signature — robRoy legitimately gains 10.9 points into its terminal stop —
// so rises get more room.
const MAX_SAT_DROP = 10;
const MAX_SAT_RISE = 15;

// Hue drifts monotonically as a ramp darkens — intentional, not a defect. Only
// a reversal is a problem, and 8-bit quantization makes small wobble
// unavoidable, so allow a couple of degrees.
const HUE_WOBBLE = 2;

// Below this saturation there is not enough chroma for hue to mean anything:
// blueSmoke sits at 9-13 throughout and its measured hue swings 35° between
// adjacent stops purely from rounding. Near-neutrals are exempt from the hue
// rule, not from the saturation or lightness ones.
const HUE_MEANINGFUL_SAT = 15;

function hsl(hex) {
  const [r, g, b] = rgb(hex).map((v) => v / 255);
  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
  const d = mx - mn;
  let h = 0;
  if (d) {
    h =
      mx === r
        ? 60 * (((g - b) / d) % 6)
        : mx === g
          ? 60 * ((b - r) / d + 2)
          : 60 * ((r - g) / d + 4);
  }
  if (h < 0) h += 360;
  const l = (mx + mn) / 2;
  return { h, s: (d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1))) * 100 };
}

// A ramp is a color group of more than two stops whose keys are all numeric.
// Single values (white, black) and two-stop groups (grayAlpha) are not ramps.
function ramps() {
  const colors = JSON.parse(readFileSync(join(ROOT, "dist/tokens/primitives.json"), "utf-8"))
    .primitives.color;

  return Object.entries(colors).filter(
    ([, group]) =>
      group !== null &&
      typeof group === "object" &&
      Object.keys(group).length > 2 &&
      Object.keys(group).every((k) => /^\d+$/.test(k)) &&
      Object.values(group).every(isHex),
  );
}

export function run() {
  const failures = [];
  console.log("\nRamp integrity — ADR 0002");
  console.log(`  ${"─".repeat(60)}`);

  const found = ramps();

  for (const [name, group] of found) {
    const stops = Object.keys(group)
      .map(Number)
      .sort((a, b) => a - b)
      .map((n) => ({
        stop: n,
        hex: group[String(n)],
        ...hsl(group[String(n)]),
        l: lstar(group[String(n)]),
      }));

    // Hue direction is whatever the ramp does overall; a stop may not fight
    // it. Taken as the median step so one unstable near-white stop cannot
    // invert the reading for the whole ramp.
    const steps = stops
      .slice(1)
      .map((s, i) => s.h - stops[i].h)
      .sort((a, b) => a - b);
    const drift = Math.sign(steps[Math.floor(steps.length / 2)]) || 1;

    for (let i = 1; i < stops.length; i++) {
      const a = stops[i - 1];
      const b = stops[i];

      if (b.l >= a.l) {
        failures.push(
          `${name}.${b.stop} — lightness not monotonic: ${a.stop} is L* ${a.l.toFixed(1)}, ${b.stop} is L* ${b.l.toFixed(1)}`,
        );
      }

      const ds = b.s - a.s;
      const bound = ds < 0 ? MAX_SAT_DROP : MAX_SAT_RISE;
      if (Math.abs(ds) > bound) {
        failures.push(
          `${name}.${b.stop} ${b.hex} — saturation ${ds < 0 ? "collapses" : "jumps"} ${Math.abs(ds).toFixed(1)} points ` +
            `from ${name}.${a.stop} (${a.s.toFixed(1)} → ${b.s.toFixed(1)}), over the ${bound}-point bound.` +
            (ds < 0 ? " This is the surface-fill signature." : ""),
        );
      }

      if (a.s < HUE_MEANINGFUL_SAT || b.s < HUE_MEANINGFUL_SAT) continue;

      const dh = (b.h - a.h) * drift;
      if (dh < -HUE_WOBBLE) {
        failures.push(
          `${name}.${b.stop} ${b.hex} — hue reverses ${Math.abs(dh).toFixed(1)}° against the ramp ` +
            `(${a.h.toFixed(1)}° → ${b.h.toFixed(1)}°, ramp drifts ${drift > 0 ? "up" : "down"})`,
        );
      }
    }
  }

  if (!failures.length) {
    console.log(`  ✔ ${found.length} ramps hold hue direction, saturation and lightness`);
  } else {
    console.log("");
    for (const f of failures) console.log(`  ✘ ${f}`);
  }
  return failures.length;
}
