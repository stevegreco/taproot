# Changelog

## 0.2.1

### Patch Changes

- 3e35235: Control sizes come from tokens. A new semantic token, `semantic.indicator.width` (2px), sets the
  thickness of a selection bar such as the selected tab's underline. Checkbox, Radio group, Switch,
  and Tabs bind their box, dot, track, thumb, and indicator sizes in their spec records, and the web
  components read those tokens instead of fixed pixel values. The Switch track is now 32 by 20
  instead of 32 by 18, with the thumb centered; the other controls look the same.
- 4484a22: Select and Text area now state a `forced-colors` rule. Tooltip's rationale records its maximum
  width. The action hierarchy example image says Taproot instead of Ember & Sage. The web
  implementation files for Button, Icon, Spinner, and Tabs explain why Button names itself with
  `aria-label` and the others with `label`.
- 6ca3993: A new `guideline.accessibility` defines the shared accessibility rules once: `visible-focus`,
  `forced-colors`, `not-color-alone`, and `not-a-control`. Every component follows it and narrows a
  rule with `extends` only to name its own parts. Rules that restated the guideline are gone, and
  some addresses changed: `component.checkbox#state-not-color-alone`,
  `component.switch#state-not-color-alone`, and `component.badge#text-communicates-state` are now
  each component's `#not-color-alone`, and `pattern.form-field#visible-focus` is
  `guideline.accessibility#visible-focus`.
  
  Button, Badge, and Text field gain forced-colors rules, and the web components meet them. Under
  forced colors, Button's primary and destructive variants fill with the system highlight, secondary
  is outlined, and tertiary is text alone, so emphasis no longer disappears. Badge keeps a visible
  boundary, and Text field draws its boundary, focus, and disabled state in system colors like Text
  area.
- Updated dependencies [3e35235]
- Updated dependencies [2ffce15]
  - @taproot-ds/tokens@0.3.0

## 0.2.0

### Minor Changes

- 01250c2: Rename the system to Taproot. `@stevegreco/design-system` is now `@taproot-ds/tokens`, `@stevegreco/web-components` is now `@taproot-ds/web-components`, and `@stevegreco/design-system-spec` is now `@taproot-ds/spec`. The `ds-spec` and `ds-spec-mcp` commands are now `taproot` and `taproot-mcp`, and the `design-system-spec` MCP server is now `taproot`. CSS variables, element tags, and class names keep the `ds` prefix.

### Patch Changes

- Updated dependencies [01250c2]
  - @taproot-ds/tokens@0.2.0

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
