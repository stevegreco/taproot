export const THEMES = ["light", "dark"];

export const primitivesConfig = {
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

export function semanticConfig(theme) {
  return {
    source: [
      "tokens/primitives.tokens.json",
      `tokens/semantic/${theme}.tokens.json`,
      "tokens/semantic/shape.tokens.json"
    ],
    platforms: {
      css: {
        transformGroup: "css",
        buildPath: "dist/css/",
        files: [
          {
            destination: `semantic.${theme}.css`,
            format: "css/variables",
            filter: (token) => token.path[0] === "semantic",
            options: {
              selector: theme === "light" ? ":root" : `:root[data-theme="${theme}"]`
            }
          }
        ]
      },
      tokensJson: {
        transformGroup: "js",
        buildPath: "dist/tokens/",
        files: [
          {
            destination: `semantic.${theme}.json`,
            format: "json/nested",
            filter: (token) => token.path[0] === "semantic"
          }
        ]
      }
    }
  };
}

export const componentsConfig = {
  log: { warnings: "disabled" },
  source: [
    "tokens/primitives.tokens.json",
    "tokens/semantic/light.tokens.json",
    "tokens/semantic/shape.tokens.json",
    "tokens/components/*.tokens.json"
  ],
  platforms: {
    css: {
      transformGroup: "css",
      buildPath: "dist/css/",
      files: [
        {
          destination: "components.css",
          format: "css/variables",
          filter: (token) => token.path[0] === "component",
          options: {
            selector: ":root",
            outputReferences: true
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

export function getAllConfigs() {
  return [primitivesConfig, ...THEMES.map(semanticConfig), componentsConfig];
}
