export default {
  source: ["tokens/primitives.tokens.json"],
  platforms: {
    css: {
      transformGroup: "css",
      buildPath: "dist/css/",
      files: [
        {
          destination: "primitives.css",
          format: "css/variables",
          filter: (token) => token.path[0] === "primitives",
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
          destination: "primitives.json",
          format: "json/nested"
        }
      ]
    }
  }
};
