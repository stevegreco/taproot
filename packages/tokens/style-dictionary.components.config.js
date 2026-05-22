export default {
  log: { warnings: "disabled" },
  source: [
    "tokens/primitives.tokens.json",
    "tokens/semantic/light.tokens.json",
    "tokens/components/*.tokens.json"
  ],
  platforms: {
    componentsCss: {
      transformGroup: "css",
      buildPath: "dist/css/",
      files: [
        {
          destination: "components.css",
          format: "css/variables",
          filter: (token) => token.path[0] === "component",
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
          destination: "components.json",
          format: "json/nested",
          filter: (token) => token.path[0] === "component"
        }
      ]
    }
  }
};
