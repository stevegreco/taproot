import { defineConfig, type ComponentMarkdown } from "blume";
import type { SemanticReferenceKind } from "./lib/semantic-reference";
import { assertWorkspaceBuilds } from "./lib/workspace-builds";

assertWorkspaceBuilds();

const { palettes } = await import("./lib/color-palettes");
const { componentCatalogSource } = await import("./lib/component-catalog");
const { semanticReferenceMarkdown } = await import("./lib/semantic-reference");

const colorFieldGuideMarkdown: ComponentMarkdown = () =>
  [
    "Primitive colors are fixed palette values used to author semantic tokens.",
    "> **Note:** Prefer semantic tokens in product interfaces because they describe what a color is for.",
    ...palettes.map((palette) =>
      [
        `## ${palette.title}`,
        palette.description,
        [
          "| Step | CSS variable | Value |",
          "| --- | --- | --- |",
          ...palette.items.map(
            (token) => `| ${token.step} | \`${token.name}\` | \`${token.value.toUpperCase()}\` |`,
          ),
        ].join("\n"),
      ].join("\n\n"),
    ),
  ].join("\n\n");

const semanticTokenReferenceMarkdown: ComponentMarkdown = ({ props }) => {
  const kind = props.kind;
  if (typeof kind !== "string") return null;
  return semanticReferenceMarkdown(kind as SemanticReferenceKind);
};

export default defineConfig({
  title: "Design System",
  description: "A token-first design system for consistent, themeable interfaces.",
  deployment: {
    site: "https://docs.stevegreco.workers.dev",
  },
  seo: {
    og: {
      // Setting a site turns on social cards, and Blume 1.7 passes the theme's
      // "Source Sans 3" to the card renderer unquoted, which fails the build.
      fonts: [],
    },
  },
  content: {
    sources: [
      { type: "filesystem", root: "docs", exclude: ["**/_*", "**/.*"] },
      { type: "custom", source: componentCatalogSource() },
    ],
  },
  ai: {
    markdownComponents: {
      ColorFieldGuide: colorFieldGuideMarkdown,
      SemanticTokenReference: semanticTokenReferenceMarkdown,
    },
  },
  theme: {
    fonts: {
      body: "source-sans-3",
      display: "lora",
      mono: "jetbrains-mono",
    },
  },
  navigation: {
    sidebar: {
      display: "group",
    },
  },
});
