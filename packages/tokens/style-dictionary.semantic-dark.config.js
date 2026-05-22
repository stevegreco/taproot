export default {
  source: ["tokens/primitives.tokens.json", "tokens/semantic/dark.tokens.json"],
  platforms: {
    semanticDarkCss: {
      transformGroup: "css",
      buildPath: "dist/css/",
      files: [
        {
          destination: "semantic.dark.css",
          format: "css/variables",
          filter: (token) => token.path[0] === "semantic",
          options: {
            selector: ":root[data-theme=\"dark\"]"
          }
        }
      ]
    },
    tokensJson: {
      transformGroup: "js",
      buildPath: "dist/tokens/",
      files: [
        {
          destination: "semantic.dark.json",
          format: "json/nested",
          filter: (token) => token.path[0] === "semantic"
        }
      ]
    }
  }
};
