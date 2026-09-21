import StyleDictionary from "style-dictionary";
import { copyFile, mkdir } from "node:fs/promises";
import { getAllConfigs } from "./style-dictionary.config.js";

// json/nested drops $description and $type. This file publishes both for every
// semantic leaf. description is null when no purpose has been written. The map
// is theme-independent, so only the light semantic build writes it.
StyleDictionary.registerFormat({
  name: "json/semantic-meta",
  format: ({ dictionary }) => {
    const output = {};
    const semanticTokens = dictionary.allTokens
      .filter((token) => token.path[0] === "semantic")
      .sort((a, b) => a.path.join(".").localeCompare(b.path.join(".")));

    for (const token of semanticTokens) {
      output[token.path.join(".")] = {
        description: token.$description ?? token.original?.$description ?? null,
        type: token.$type ?? token.original?.$type,
      };
    }

    return `${JSON.stringify(output, null, 2)}\n`;
  },
});

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
