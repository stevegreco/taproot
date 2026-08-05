// Example integrity.
//
// Every var() reference in a shipped example must resolve to either a token
// from the freshly built CSS or an app-level custom property declared by that
// example. This keeps demos from silently drifting when tokens are renamed or
// removed.

import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PROPERTY = /(--[a-z0-9-]+)\s*:/gi;
const REFERENCE = /var\((--[a-z0-9-]+)/gi;

const EXAMPLES = new Map([
  ["dashboard", ["examples/dashboard.css", "examples/dashboard.html"]],
  ["food-order", ["examples/food-order.html"]],
  ["token-showcase", ["examples/token-showcase.html"]]
]);

function matches(source, pattern) {
  return new Set([...source.matchAll(pattern)].map((match) => match[1]));
}

export function run() {
  const failures = [];
  const builtCss = readFileSync(join(ROOT, "dist/css/tokens.css"), "utf8");
  const published = matches(builtCss, PROPERTY);

  console.log("\nExample references");
  console.log(`  ${"─".repeat(60)}`);

  for (const [name, paths] of EXAMPLES) {
    const source = paths
      .map((path) => readFileSync(join(ROOT, path), "utf8"))
      .join("\n");
    const local = matches(source, PROPERTY);
    const references = matches(source, REFERENCE);
    const missing = [...references]
      .filter((property) => !published.has(property) && !local.has(property))
      .sort();

    if (missing.length) {
      for (const property of missing) {
        failures.push(`${name} — ${property} is not defined`);
      }
    } else {
      console.log(`  ✔ ${name}: ${references.size} references resolve`);
    }
  }

  if (failures.length) {
    console.log("");
    for (const failure of failures) console.log(`  ✘ ${failure}`);
  }

  return failures.length;
}
