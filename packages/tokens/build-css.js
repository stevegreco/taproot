import { copyFile, readFile, writeFile, rm } from "node:fs/promises";
import { createCombinedCss } from "./build-css-utils.js";

const primitivesPath = "dist/css/primitives.css";
const semanticLightPath = "dist/css/semantic.light.css";
const semanticDarkSystemPath = "dist/css/semantic.dark.system.css";
const semanticDarkPath = "dist/css/semantic.dark.css";
const outputPath = "dist/css/tokens.css";

const [primitives, semanticLight, semanticDarkSystem, semanticDark] = await Promise.all([
  readFile(primitivesPath, "utf8"),
  readFile(semanticLightPath, "utf8"),
  readFile(semanticDarkSystemPath, "utf8"),
  readFile(semanticDarkPath, "utf8"),
]);

const combined = createCombinedCss({
  primitives,
  semanticLight,
  semanticDarkSystem,
  semanticDark,
});

await writeFile(outputPath, combined, "utf8");

await Promise.all([
  rm(primitivesPath),
  rm(semanticLightPath),
  rm(semanticDarkSystemPath),
  rm(semanticDarkPath),
]);

// The optional page defaults (guideline.page-setup), published as `@taproot-ds/tokens/base`.
await copyFile("src/css/base.css", "dist/css/base.css");
