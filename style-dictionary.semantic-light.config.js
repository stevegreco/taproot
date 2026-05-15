export default {
  source: ["tokens/primitives.tokens.json", "tokens/semantic/light.tokens.json"],
  platforms: {
    semanticLightCss: {
      transformGroup: "css",
      buildPath: "dist/css/",
      files: [
        {
          destination: "semantic.light.css",
          format: "css/variables",
          filter: (token) => token.path[0] === "semantic",
          options: {
            selector: ":root"
          }
        }
      ]
    },
    tokensJson: {
      transformGroup: "js",
      buildPath: "dist/tokens/",
      files: [
        {
          destination: "semantic.light.json",
          format: "json/nested",
          filter: (token) => token.path[0] === "semantic"
        }
      ]
    }
  }
};
