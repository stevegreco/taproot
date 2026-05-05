import { readFile, writeFile, rm } from "node:fs/promises";

const primitivesPath = "dist/css/primitives.css";
const semanticLightPath = "dist/css/semantic.light.css";
const semanticDarkPath = "dist/css/semantic.dark.css";
const outputPath = "dist/css/tokens.css";

const [primitives, semanticLight, semanticDark] = await Promise.all([
  readFile(primitivesPath, "utf8"),
  readFile(semanticLightPath, "utf8"),
  readFile(semanticDarkPath, "utf8")
]);

const combined = `${primitives.trim()}\n\n${semanticLight.trim()}\n\n${semanticDark.trim()}\n`;

await writeFile(outputPath, combined, "utf8");

await Promise.all([
  rm(primitivesPath),
  rm(semanticLightPath),
  rm(semanticDarkPath)
]);
