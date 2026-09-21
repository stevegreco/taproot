export const THEMES = ["light", "dark"];

export const PRIMITIVES_SOURCE = "src/tokens/primitives.tokens.json";

export function semanticThemeSource(theme) {
  return `src/tokens/semantic/${theme}.tokens.json`;
}

// Shared by semanticConfig, the meta format, and descriptions.test.js.
// A new semantic file belongs here, so the build and the group-description
// check see it together.
export const SHARED_SEMANTIC_SOURCES = [
  "src/tokens/semantic/shape.tokens.json",
  "src/tokens/semantic/typography.tokens.json",
];

export function semanticDescriptionSources(theme) {
  return [semanticThemeSource(theme), ...SHARED_SEMANTIC_SOURCES];
}

export function semanticSources(theme) {
  return [PRIMITIVES_SOURCE, ...semanticDescriptionSources(theme)];
}

export const primitivesConfig = {
  source: [PRIMITIVES_SOURCE],
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
  const cssFiles = [
    {
      destination: `semantic.${theme}.css`,
      format: "css/variables",
      filter: (token) => token.path[0] === "semantic",
      options: {
        selector: theme === "light" ? ":root" : `:root[data-theme="${theme}"]`,
      },
    },
  ];

  if (theme === "dark") {
    cssFiles.push({
      destination: "semantic.dark.system.css",
      format: "css/variables",
      filter: (token) => token.path[0] === "semantic",
      options: {
        selector: ":root:not([data-theme])",
      },
    });
  }

  return {
    source: semanticSources(theme),
    platforms: {
      css: {
        transformGroup: "css",
        buildPath: "dist/css/",
        files: cssFiles,
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
          // Descriptions are identical across themes. Emit the map once, from
          // light, so the dark build cannot overwrite it with a second copy.
          ...(theme === "light"
            ? [
                {
                  destination: "semantic.meta.json",
                  format: "json/semantic-meta",
                  filter: (token) => token.path[0] === "semantic",
                },
              ]
            : []),
        ],
      },
    },
  };
}

const componentSources = [...semanticSources("light"), "src/tokens/components/*.tokens.json"];

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
