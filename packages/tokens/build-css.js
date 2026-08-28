import { readFile, writeFile, rm } from "node:fs/promises";
import { createCombinedCss } from "./build-css-utils.js";

const primitivesPath = "dist/css/primitives.css";
const semanticLightPath = "dist/css/semantic.light.css";
const semanticDarkSystemPath = "dist/css/semantic.dark.system.css";
const semanticDarkPath = "dist/css/semantic.dark.css";
const componentsPath = "dist/css/components.css";
const outputPath = "dist/css/tokens.css";

const [primitives, semanticLight, semanticDarkSystem, semanticDark, components] = await Promise.all(
  [
    readFile(primitivesPath, "utf8"),
    readFile(semanticLightPath, "utf8"),
    readFile(semanticDarkSystemPath, "utf8"),
    readFile(semanticDarkPath, "utf8"),
    readFile(componentsPath, "utf8"),
  ],
);

const combined = createCombinedCss({
  primitives,
  semanticLight,
  semanticDarkSystem,
  semanticDark,
  components,
});

await writeFile(outputPath, combined, "utf8");

await Promise.all([
  rm(primitivesPath),
  rm(semanticLightPath),
  rm(semanticDarkSystemPath),
  rm(semanticDarkPath),
  rm(componentsPath),
]);
