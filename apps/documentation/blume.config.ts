import { defineConfig, type ComponentMarkdown } from "blume";
import type { ComponentSpecSection } from "./lib/component-spec";
import type { SemanticReferenceKind } from "./lib/semantic-reference";
import { assertWorkspaceBuilds } from "./lib/workspace-builds";

assertWorkspaceBuilds();

const { palettes } = await import("./lib/color-palettes");
const { componentSpecMarkdown } = await import("./lib/component-spec");
const { componentCatalogSource } = await import("./lib/component-catalog");
const { componentPagesSource, PROSE_FOLDER } = await import("./lib/component-pages");
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

const componentSpec: ComponentMarkdown = ({ props }) => {
  const component = props.component;
  if (typeof component !== "string") return null;
  const section = props.section;
  if (section != null && typeof section !== "string") return null;
  return componentSpecMarkdown(component, section as ComponentSpecSection | undefined);
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
      // Component pages render from the catalog. Their optional prose files
      // live in docs/components/ but render only through that source.
      { type: "filesystem", root: "docs", exclude: ["**/_*", "**/.*", `${PROSE_FOLDER}/*.mdx`] },
      { type: "custom", source: componentPagesSource() },
      { type: "custom", source: componentCatalogSource() },
    ],
  },
  examples: {
    css: "theme.css",
  },
  ai: {
    markdownComponents: {
      ColorFieldGuide: colorFieldGuideMarkdown,
      SemanticTokenReference: semanticTokenReferenceMarkdown,
      ComponentSpec: componentSpec,
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
