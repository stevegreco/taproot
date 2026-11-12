# Changelog

## 0.4.0

### Minor Changes

- 3e35235: Control sizes come from tokens. A new semantic token, `semantic.indicator.width` (2px), sets the
  thickness of a selection bar such as the selected tab's underline. Checkbox, Radio group, Switch,
  and Tabs bind their box, dot, track, thumb, and indicator sizes in their spec records, and the web
  components read those tokens instead of fixed pixel values. The Switch track is now 32 by 20
  instead of 32 by 18, with the thumb centered; the other controls look the same.
- ca95092: An implementation folder's `README.md` now holds the setup every component of that implementation shares: installing the package, loading its styles and the optional page defaults, fonts, and registering elements. `taproot setup --impl <name>` and the MCP `setup` tool print it, the hosted snapshot carries it, and `get --impl` ends with a line pointing to it. The web implementation files no longer repeat the token stylesheet paragraph.
- 032a7c8: Add `guideline.page-setup`, which says what the page around the components needs: the base font, text color, background, and a type recipe for each heading level. The agent instructions point to it. `@taproot-ds/tokens` adds an optional base stylesheet, `@taproot-ds/tokens/base`, that applies those defaults with zero specificity.
- e17930a: Patterns and guidelines can declare `rules`, and a component inherits the rules of each record in its `links.follows`. A component rule narrows an inherited one with `extends` or sets it aside with `waived`, and `validate` checks both. `rules --id <component>` and `get` list inherited rules at their own addresses. `pattern.form-field` now carries the shared form rules, so every form component, Text field included, has rules to review against.
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
- 70c6026: Smaller fixes from a review of the spec package.
  
  - `spec.config.json` is checked against a JSON Schema, exported as `@taproot-ds/spec/schema/spec-config.json`. Point `$schema` at it for checks and completion in an editor. Every problem in the file is reported at once, and some messages are worded differently, such as `"content" must be a string`.
  - `taproot rules` takes a record id or name as an argument, as `get`, `links`, and `tokens` do: `taproot rules checkbox`. `--id` still works.
  - `TOKEN_KEYWORDS` and `TOKEN_PROPERTIES` are exported from the package root.
- ecdaee8: `spec.config.json` takes a `vocabulary`: concepts such as size or status, each with its words, an
  optional parameter name limited to them, and aliases that point other words at the word to use.
  `validate` reports an enum value that strays from it, with the file, line, and the word to use.
- bba0eb5: One set of checks for `validate` and the snapshot build, and answers that say when they are incomplete.
  
  - `taproot validate` now also checks every implementation file against its component record, and the snapshot build for the hosted MCP server now also checks token references, vocabulary, and constants. Both run the same checks through the new `checkFromConfig`, so a deploy can no longer serve a token that does not exist, and `validate` catches a broken mapping.
  - A record whose only issues are `TODO:` placeholders, or links to a record that was left out, now loads instead of being left out. `get` says which fields are unfinished and which linked records are missing. Issues of these kinds carry `kind: "placeholder"` or `kind: "dependency"`.
  - When a pattern or guideline a component follows is left out, `rules` starts with `INCOMPLETE:`, names the missing rules, and fails with the new `ERR_INCOMPLETE_RULES` (exit code 1 from the CLI, with the rules found under `results` in JSON), instead of returning a shorter list as if it were complete.
  - The local MCP server starts and reloads with invalid record files left out and named in a warning on every answer, as the CLI does, instead of refusing to start or serving the last valid version.
  - New exports: `checkFromConfig` from `@taproot-ds/spec/config`; `findImplementationProblems` and `readImplementationFolder` from `@taproot-ds/spec/implementation`; `spec.gaps(id)` on a loaded spec.

### Patch Changes

- 2ffce15: Raise the dark theme's `border.subtle` from `gray.800` to `gray.700`, so it measures 1.38:1 on
  `background.surface` instead of 1.06:1 and a Divider inside a Card is visible. On
  `background.default` it goes from 1.45:1 to 1.89:1. Divider's spec drops the known issue.
- 4484a22: Select and Text area now state a `forced-colors` rule. Tooltip's rationale records its maximum
  width. The action hierarchy example image says Taproot instead of Ember & Sage. The web
  implementation files for Button, Icon, Spinner, and Tabs explain why Button names itself with
  `aria-label` and the others with `label`.

## 0.3.0

### Minor Changes

- 01250c2: Rename the system to Taproot. `@stevegreco/design-system` is now `@taproot-ds/tokens`, `@stevegreco/web-components` is now `@taproot-ds/web-components`, and `@stevegreco/design-system-spec` is now `@taproot-ds/spec`. The `ds-spec` and `ds-spec-mcp` commands are now `taproot` and `taproot-mcp`, and the `design-system-spec` MCP server is now `taproot`. CSS variables, element tags, and class names keep the `ds` prefix.

## 0.2.0

### Minor Changes

- 1d6f517: `validate` no longer rejects a token reference for naming a color, radius, or border primitive. The
  format leaves token tiers to the adopter, so this system's rule moved to its own content test. Button's
  implementation guidance now leaves variant and disabled guidance to the spec.

### Patch Changes

- 2f27473: `get --impl web` now tells agents to install the tokens package and load its stylesheet, for every
  component. The web implementation files also cover validating a form in your own code and building
  a select-all checkbox, and the form field pattern says a reset leaves an error set.
- cbf6aa3: The docs site no longer has a page per component, so the format reference and READMEs no longer
  mention those pages.

## 0.1.0

### Minor Changes

- 319b0cf: First release through Changesets. Tokens ship their DTCG source files and web components ship their
  implementation mappings, so an installed `ds-spec` can answer `tokens --resolve` and `get --impl web`.

## 0.0.2

- Add the `repository` field, which npm trusted publishing checks.
- Add `@stevegreco/design-system-spec/http` and a snapshot build for hosted deploys. The local CLI and
  MCP server still read the source files.
- The MCP server reports its package version.

## 0.0.1

First version under this name. The package was renamed from the knowledge package and rebuilt as a
library over the authored files, so there is no compile step or compiled output. Nothing from earlier
versions carries over. [SPEC.md](SPEC.md) describes record format version 1.

- `loadSpec` and `validateSpec` read and check the content folder, with `list`, `get`, `section`,
  `search`, `links`, `rules`, `tokens`, and `render` over an index in memory.
- The `ds-spec` CLI and `ds-spec-mcp` stdio server call that library, and each record is a
  `spec://<id>` resource. `spec.config.json` names the content, implementations, constants, and
  token sets.
- Component records can have `parts` and `items`. Implementation files map their API per technology
  and are served by `get --impl <name>`.
