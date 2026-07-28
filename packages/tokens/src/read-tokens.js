// Node-only token loading — reads built dist/ output (and, for staleness
// checks, the tokens/ source) from disk. Browser consumers (tokens-explorer)
// should import ./flatten.js directly and load token JSON via bundler imports
// instead, since this module touches fs.

import { readFileSync, statSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { flatten, inferType } from "./flatten.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

export { flatten, inferType };

export const DIST = {
  primitives: join(ROOT, "dist/tokens/primitives.json"),
  semanticLight: join(ROOT, "dist/tokens/semantic.light.json"),
  semanticDark: join(ROOT, "dist/tokens/semantic.dark.json"),
  componentsLight: join(ROOT, "dist/tokens/components.light.json"),
  componentsDark: join(ROOT, "dist/tokens/components.dark.json"),
};

// The files backing one theme. Both the semantic and the component tier are
// theme-specific: `json/nested` resolves aliases to literals, so a component
// file built against light semantics reports light values no matter what
// theme was asked for (TOK-06).
export function themeFiles(theme = "light") {
  return theme === "dark"
    ? [DIST.primitives, DIST.semanticDark, DIST.componentsDark]
    : [DIST.primitives, DIST.semanticLight, DIST.componentsLight];
}

export function sourceFiles() {
  const base = [
    join(ROOT, "tokens/primitives.tokens.json"),
    join(ROOT, "tokens/semantic/light.tokens.json"),
    join(ROOT, "tokens/semantic/dark.tokens.json"),
  ];
  try {
    const components = readdirSync(join(ROOT, "tokens/components"))
      .filter((f) => f.endsWith(".tokens.json"))
      .map((f) => join(ROOT, "tokens/components", f));
    return [...base, ...components];
  } catch {
    return base;
  }
}

export function isStale() {
  try {
    const srcMax = Math.max(
      ...sourceFiles().map((f) => {
        try { return statSync(f).mtimeMs; } catch { return 0; }
      })
    );
    const distMin = Math.min(
      ...Object.values(DIST).map((f) => {
        try { return statSync(f).mtimeMs; } catch { return 0; }
      })
    );
    return srcMax > distMin;
  } catch {
    return false;
  }
}

export function loadTokens(theme = "light") {
  const tokens = [];
  for (const file of themeFiles(theme)) {
    try {
      tokens.push(...flatten(JSON.parse(readFileSync(file, "utf-8"))));
    } catch {
      // dist not yet built
    }
  }
  return tokens;
}
