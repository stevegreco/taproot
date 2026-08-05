import { defineConfig } from "blume";

export default defineConfig({
  title: "Design System",
  description:
    "A token-first design system for consistent, themeable interfaces.",
  examples: {
    css: "theme.css",
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
      display: "group"
    }
  }


});
