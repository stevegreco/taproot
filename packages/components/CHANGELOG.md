# Changelog

## 0.1.1

### Patch Changes

- 2f27473: `get --impl web` now tells agents to install the tokens package and load its stylesheet, for every
  component. The web implementation files also cover validating a form in your own code and building
  a select-all checkbox, and the form field pattern says a reset leaves an error set.
- cbf6aa3: The docs site no longer has a page per component, so the format reference and READMEs no longer
  mention those pages.
- 1d6f517: `validate` no longer rejects a token reference for naming a color, radius, or border primitive. The
  format leaves token tiers to the adopter, so this system's rule moved to its own content test. Button's
  implementation guidance now leaves variant and disabled guidance to the spec.

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
