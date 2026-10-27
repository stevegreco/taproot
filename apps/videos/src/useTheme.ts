export type Theme = "light" | "dark";

// tokens.css scopes its themes to `:root[data-theme]`, and headless Chromium
// renders with a light color scheme, so each composition sets the theme itself.
export const useTheme = (theme: Theme) => {
  document.documentElement.dataset.theme = theme;
};
