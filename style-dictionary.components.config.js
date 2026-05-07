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
    }
  }
};
