/**
 * Inlines each src/*.css file into an ES module exporting it as a string.
 *
 * Why this exists: the standards-track alternative,
 * `import sheet from "./button.css" with { type: "css" }`, is not shippable yet
 * (no Safari support, Firefox behind a flag, no native Vite support). Inlining
 * at build time keeps the authored source as real, lintable CSS while the
 * published package stays plain ES modules that any bundler understands.
 */

import { readdir, readFile, writeFile, mkdir, rm } from "node:fs/promises";

const SRC = "src";
const OUT = "dist";

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });

const stylesheets = (await readdir(SRC)).filter((file) => file.endsWith(".css"));

for (const file of stylesheets) {
  const css = await readFile(`${SRC}/${file}`, "utf8");
  const target = `${OUT}/${file.replace(/\.css$/, ".styles.js")}`;

  // JSON.stringify handles every escape a stylesheet can contain.
  await writeFile(
    target,
    `// Generated from src/${file}. Do not edit.\n` +
      `export const styles = ${JSON.stringify(css)};\n`,
    "utf8",
  );

  console.log(`src/${file} → ${target}`);
}

if (stylesheets.length === 0) {
  console.warn("No stylesheets found in src/.");
}
