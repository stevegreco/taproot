export const THEMES = ["light", "dark"];

export const primitivesConfig = {
  source: ["src/tokens/primitives.tokens.json"],
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
            selector: ":root",
          },
        },
      ],
    },
    tokensJson: {
      transformGroup: "js",
      buildPath: "dist/tokens/",
      files: [
        {
          destination: "primitives.json",
          format: "json/nested",
        },
      ],
    },
  },
};

export function semanticConfig(theme) {
  return {
    source: [
      "src/tokens/primitives.tokens.json",
      `src/tokens/semantic/${theme}.tokens.json`,
      "src/tokens/semantic/shape.tokens.json",
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
              selector: theme === "light" ? ":root" : `:root[data-theme="${theme}"]`,
            },
          },
        ],
      },
      tokensJson: {
        transformGroup: "js",
        buildPath: "dist/tokens/",
        files: [
          {
            destination: `semantic.${theme}.json`,
            format: "json/nested",
            filter: (token) => token.path[0] === "semantic",
          },
        ],
      },
    },
  };
}

const componentSources = [
  "src/tokens/primitives.tokens.json",
  "src/tokens/semantic/light.tokens.json",
  "src/tokens/semantic/shape.tokens.json",
  "src/tokens/components/*.tokens.json",
];

// Component files are discovered as a group so adding a contract does not
// require build-configuration changes. The source-alias test verifies every
// component leaf references a current primitive or semantic token.
export const componentsConfig = {
  // Style Dictionary warns when outputReferences points at shared tokens that
  // are intentionally filtered from components.css.
  log: { warnings: "disabled" },
  source: componentSources,
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
            // Keep CSS aliases live so semantic theme changes flow through one
            // component stylesheet. JSON preserves the same source references.
            outputReferences: true,
          },
        },
      ],
    },
    tokensJson: {
      transformGroup: "js",
      buildPath: "dist/tokens/",
      files: [
        {
          destination: "components.json",
          format: "json/nested-references",
          filter: (token) => token.path[0] === "component",
        },
      ],
    },
  },
};

export function getAllConfigs() {
  return [primitivesConfig, ...THEMES.map(semanticConfig), componentsConfig];
}
