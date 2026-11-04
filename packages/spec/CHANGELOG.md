# Changelog

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
