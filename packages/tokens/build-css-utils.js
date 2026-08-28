export const SYSTEM_DARK_QUERY = "prefers-color-scheme: dark";

function indent(css) {
  return css
    .split("\n")
    .map((line) => (line ? `  ${line}` : line))
    .join("\n");
}

export function wrapInMediaQuery(css, query) {
  return `@media (${query}) {\n${indent(css.trim())}\n}`;
}

export function createCombinedCss({
  primitives,
  semanticLight,
  semanticDarkSystem,
  semanticDark,
  components,
}) {
  const colorScheme = `:root {
  color-scheme: light;
}

@media (${SYSTEM_DARK_QUERY}) {
  :root:not([data-theme]) {
    color-scheme: dark;
  }
}

:root[data-theme="dark"] {
  color-scheme: dark;
}`;

  return [
    primitives,
    colorScheme,
    semanticLight,
    wrapInMediaQuery(semanticDarkSystem, SYSTEM_DARK_QUERY),
    semanticDark,
    components,
  ]
    .map((css) => css.trim())
    .join("\n\n")
    .concat("\n");
}
