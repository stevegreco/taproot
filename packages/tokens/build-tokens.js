import StyleDictionary from "style-dictionary";
import { readFileSync } from "node:fs";
import { copyFile, mkdir } from "node:fs/promises";
import { getAllConfigs, semanticDescriptionSources } from "./style-dictionary.config.js";

// Style Dictionary drops a $description that sits on a group, so the format
// cannot read recipe prose off the token. Walk the same semantic sources the
// light build uses and remember the nearest described ancestor for each leaf.
function groupDescriptionByLeaf() {
  const map = new Map();
  const files = semanticDescriptionSources("light");

  const walk = (node, parts, inherited) => {
    for (const [key, value] of Object.entries(node)) {
      if (key.startsWith("$") || value === null || typeof value !== "object") continue;
      const path = [...parts, key];
      if ("$value" in value) {
        if (inherited != null) map.set(path.join("."), inherited);
        continue;
      }
      const next = typeof value.$description === "string" ? value.$description : inherited;
      walk(value, path, next);
    }
  };

  for (const file of files) walk(JSON.parse(readFileSync(file, "utf8")), [], null);
  return map;
}

// json/nested drops $description and $type. This file publishes both for every
// semantic leaf. description is the leaf's own purpose, or null. groupDescription
// is recipe prose from a parent group, or null. The map is theme-independent,
// so only the light semantic build writes it.
StyleDictionary.registerFormat({
  name: "json/semantic-meta",
  format: ({ dictionary }) => {
    const output = {};
    const groups = groupDescriptionByLeaf();
    const semanticTokens = dictionary.allTokens
      .filter((token) => token.path[0] === "semantic")
      .sort((a, b) => a.path.join(".").localeCompare(b.path.join(".")));

    for (const token of semanticTokens) {
      const path = token.path.join(".");
      output[path] = {
        description: token.$description ?? token.original?.$description ?? null,
        type: token.$type ?? token.original?.$type,
        groupDescription: groups.get(path) ?? null,
      };
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
