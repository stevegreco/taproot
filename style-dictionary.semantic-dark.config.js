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
    }
  }
};
