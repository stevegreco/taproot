import "@taproot-ds/tokens/css";
import "@taproot-ds/web-components";
import "./preview.css";

/**
 * tokens.css follows the OS color scheme unless `data-theme` is set on the
 * root, so "system" removes the attribute and the others force a theme.
 */
function withTheme(story, { globals }) {
  const root = document.documentElement;
  if (globals.theme === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", globals.theme);
  return story();
}

/** @type {import("@storybook/web-components-vite").Preview} */
export default {
  decorators: [withTheme],
  globalTypes: {
    theme: {
      description: "Token theme",
      toolbar: {
        title: "Theme",
        icon: "mirror",
        items: [
          { value: "system", title: "System" },
          { value: "light", title: "Light" },
          { value: "dark", title: "Dark" },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { theme: "system" },
  parameters: {
    backgrounds: { disable: true },
    controls: { expanded: true },
    options: {
      storySort: {
        order: ["Introduction", "Tokens", ["Overview", "Primitives", "Semantic"], "Components"],
      },
    },
    a11y: { test: "error" },
  },
  tags: ["autodocs"],
};
