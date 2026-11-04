# Changelog

## 0.1.0

### Minor Changes

- 319b0cf: First release through Changesets. Tokens ship their DTCG source files and web components ship their
  implementation mappings, so an installed `ds-spec` can answer `tokens --resolve` and `get --impl web`.

### Patch Changes

- Updated dependencies [319b0cf]
  - @stevegreco/design-system@0.1.1

## 0.0.1

Breaking. Requires `@stevegreco/design-system` 0.1.0.

- The package is renamed to `@stevegreco/web-components`.
- Button's sizes are now `small` and `medium`, matching Icon, Spinner, and Avatar. Replace
  `size="sm"` with `size="small"` and `size="md"` with `size="medium"`.
- Button's `ghost` variant is now `tertiary`, and its `danger` variant is now `destructive`. Each
  uses the word of the semantic intent it applies, and `danger` now names a status only (Alert,
  Badge). Replace `variant="ghost"` with `variant="tertiary"` and `variant="danger"` with
  `variant="destructive"`.
- Button reads semantic tokens directly. The `--component-button-*` variables are gone, so
  overriding them no longer changes Button.
