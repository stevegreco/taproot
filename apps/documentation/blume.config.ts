import { defineConfig, type ComponentMarkdown } from "blume";
import { palettes } from "./lib/color-palettes";

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

export default defineConfig({
  title: "Design System",
  description: "A token-first design system for consistent, themeable interfaces.",
  examples: {
    css: "theme.css",
  },
  ai: {
    markdownComponents: {
      ColorFieldGuide: colorFieldGuideMarkdown,
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
