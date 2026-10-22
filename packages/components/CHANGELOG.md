# Changelog

## Unreleased

Breaking. Requires `@stevegreco/design-system` 0.1.0.

- Button's sizes are now `small` and `medium`, matching Icon, Spinner, and Avatar. Replace
  `size="sm"` with `size="small"` and `size="md"` with `size="medium"`.
- Button's `ghost` variant is now `tertiary`, and its `danger` variant is now `destructive`. Each
  uses the word of the semantic intent it applies, and `danger` now names a status only (Alert,
  Badge). Replace `variant="ghost"` with `variant="tertiary"` and `variant="danger"` with
  `variant="destructive"`.
- Button reads semantic tokens directly. The `--component-button-*` variables are gone, so
  overriding them no longer changes Button.
