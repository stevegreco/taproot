// Node-only token loading — reads built dist/ output (and, for staleness
// checks, the src/tokens/ source) from disk. Browser consumers (tokens-explorer)
// should import ./flatten.js directly and load token JSON via bundler imports
// instead, since this module touches fs.

import { readFileSync, readdirSync, statSync } from "fs";
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
  components: join(ROOT, "dist/tokens/components.json"),
};

// The files backing one theme. Primitives and component references are fixed;
// only semantic JSON resolves independently for each theme.
export function themeFiles(theme = "light") {
  return theme === "dark"
    ? [DIST.primitives, DIST.semanticDark, DIST.components]
    : [DIST.primitives, DIST.semanticLight, DIST.components];
}

export function sourceFiles() {
  const base = [
    join(ROOT, "src/tokens/primitives.tokens.json"),
    join(ROOT, "src/tokens/semantic/light.tokens.json"),
    join(ROOT, "src/tokens/semantic/dark.tokens.json"),
    join(ROOT, "src/tokens/semantic/shape.tokens.json"),
  ];
  try {
    const components = readdirSync(join(ROOT, "src/tokens/components"))
      .filter((file) => file.endsWith(".tokens.json"))
      .map((file) => join(ROOT, "src/tokens/components", file));
    return [...base, ...components];
  } catch {
    return base;
  }
}

export function isStale() {
  try {
    const srcMax = Math.max(
      ...sourceFiles().map((f) => {
        try {
          return statSync(f).mtimeMs;
        } catch {
          return 0;
        }
      }),
    );
    const distMin = Math.min(
      ...Object.values(DIST).map((f) => {
        try {
          return statSync(f).mtimeMs;
        } catch {
          return 0;
        }
      }),
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
