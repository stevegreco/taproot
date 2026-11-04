# Changelog

## 0.1.1

### Patch Changes

- 319b0cf: First release through Changesets. Tokens ship their DTCG source files and web components ship their
  implementation mappings, so an installed `ds-spec` can answer `tokens --resolve` and `get --impl web`.

## 0.1.0

Breaking. The CSS prefix, color primitives, the component tier, and several token names change in
one release.
The reasons are in [ADR 0003](docs/adr/0003-token-tier-consumption.md) and the
[semantic naming plan](docs/semantic-naming-plan.md).

- **New recipe: `semantic.typography.title`.** Body-size, semibold text for the title above body copy.
  Alert and Dialog use it.
- **New shape roles:** `semantic.radius.compact`, `semantic.border.width`, `semantic.focus.width`, and
  `semantic.focus.offset`. Every component border and focus ring uses them.
- Every semantic color role now has a description.
- **Every CSS variable starts with `--ds-`.** `--semantic-*` is now `--ds-semantic-*` and
  `--primitives-*` is now `--ds-primitives-*`, so a consumer's own variables cannot collide with
  ours. Token paths in JSON are unchanged. `CSS_PREFIX` from `./flatten` holds the prefix.
- **Color primitives are no longer CSS variables.** `tokens.css` drops every
  `--primitives-color-*` variable. Use the semantic color token for the role instead. The palette is
  still in `primitives.json`.
- **The package's main entry is the CSS.** `main` and the `.` export now point at
  `dist/css/tokens.css` instead of `dist/tokens/primitives.json`. Import
  `@stevegreco/design-system/tokens/primitives` for the primitive JSON.
- **The component tier is gone.** `--component-button-*`, `components.json`, and the
  `./tokens/components` export are removed. Each Button token aliased a semantic or primitive token,
  so use that token directly. `pnpm spec tokens button` lists them.
- **Typography recipes use the `sm`, `md`, `lg` size words.**
- **`foreground.on.brand.default` is now `foreground.on.brand`**, matching
  `foreground.on.action.primary`.

### Renamed tokens

The CSS variable follows the same rename: `semantic.typography.body.default.fontSize` was
`--semantic-typography-body-default-font-size` and is now `--ds-semantic-typography-body-md-font-size`.

| Before                                       | After                                |
| -------------------------------------------- | ------------------------------------ |
| `semantic.typography.heading.large.*`        | `semantic.typography.heading.lg.*`   |
| `semantic.typography.heading.default.*`      | `semantic.typography.heading.md.*`   |
| `semantic.typography.heading.small.*`        | `semantic.typography.heading.sm.*`   |
| `semantic.typography.body.default.*`         | `semantic.typography.body.md.*`      |
| `semantic.typography.body.small.*`           | `semantic.typography.body.sm.*`      |
| `semantic.typography.label.default.*`        | `semantic.typography.label.md.*`     |
| `semantic.typography.label.small.*`          | `semantic.typography.label.sm.*`     |
| `semantic.typography.code.default.*`         | `semantic.typography.code.md.*`      |
| `semantic.typography.code.small.*`           | `semantic.typography.code.sm.*`      |
| `semantic.color.foreground.on.brand.default` | `semantic.color.foreground.on.brand` |
