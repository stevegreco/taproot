# design-system

Design token package with DTCG-style source tokens and generated distribution artifacts.

## Source of truth

- DTCG-style tokens: `tokens/primitives.tokens.json`
- Semantic token examples:
  - `tokens/semantic/light.tokens.json`
  - `tokens/semantic/dark.tokens.json`

## Build outputs

- CSS variables (single file): `dist/css/tokens.css`
- JSON tokens: `dist/tokens/primitives.json`
- The CSS file contains:
  - primitives in `:root` with `--primitives-*` names
  - semantic light tokens in `:root`
  - semantic dark overrides in `:root[data-theme="dark"]`

## Install

```bash
pnpm install
```

## Build

```bash
pnpm run build
```

## Consume in CSS projects

```css
@import "design-system/css";
```

Or via JS:

```js
import "design-system/css";
```

Semantic layers:
The single CSS entry already includes both light and dark semantic layers.
The sample semantic token is `--semantic-color-background-brand`.

## Consume JSON tokens

```js
import tokens from "design-system/tokens";
```

## Publish checklist

1. Run `pnpm run build`
2. Bump version in `package.json`
3. Publish with `pnpm publish`

## Notes

- The package uses Style Dictionary to generate platform outputs.
- Keep editing tokens in `tokens/primitives.tokens.json` rather than editing `dist/*` files directly.
