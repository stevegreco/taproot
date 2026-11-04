# Changelog

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
