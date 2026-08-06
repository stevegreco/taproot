import StyleDictionary from "style-dictionary";
import { copyFile, mkdir } from "node:fs/promises";
import { getAllConfigs } from "./style-dictionary.config.js";

StyleDictionary.registerFormat({
  name: "json/nested-references",
  format: ({ dictionary }) => {
    const output = {};

    for (const token of dictionary.allTokens) {
      if (token.path[0] !== "component") continue;

      let target = output;
      for (const segment of token.path.slice(0, -1)) {
        target[segment] ??= {};
        target = target[segment];
      }
      target[token.path.at(-1)] = token.original.$value;
    }

    return `${JSON.stringify(output, null, 2)}\n`;
  },
});

for (const config of getAllConfigs()) {
  const sd = new StyleDictionary(config);
  await sd.buildAllPlatforms();
}

await mkdir("dist", { recursive: true });
await Promise.all([
  copyFile("src/flatten.js", "dist/flatten.js"),
  copyFile("src/read-tokens.js", "dist/read-tokens.js"),
]);
