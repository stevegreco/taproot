import { defineConfig, type ComponentMarkdown } from "blume";
import type { ComponentKnowledgeSection } from "./lib/component-knowledge";
import type { SemanticReferenceKind } from "./lib/semantic-reference";
import { assertWorkspaceBuilds } from "./lib/workspace-builds";

assertWorkspaceBuilds();

const { palettes } = await import("./lib/color-palettes");
const { componentKnowledgeMarkdown } = await import("./lib/component-knowledge");
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

const componentKnowledge: ComponentMarkdown = ({ props }) => {
  const component = props.component;
  if (typeof component !== "string") return null;
  const section = props.section;
  if (section != null && typeof section !== "string") return null;
  return componentKnowledgeMarkdown(component, section as ComponentKnowledgeSection | undefined);
};

export default defineConfig({
  title: "Design System",
  description: "A token-first design system for consistent, themeable interfaces.",
  examples: {
    css: "theme.css",
  },
  ai: {
    markdownComponents: {
      ColorFieldGuide: colorFieldGuideMarkdown,
      SemanticTokenReference: semanticTokenReferenceMarkdown,
      ComponentKnowledge: componentKnowledge,
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
