# Changelog

## Unreleased

Breaking. The package is now a library over the authored files, and the record format is version 1
(`urn:design-system-knowledge:record:1`). See [SPEC.md](SPEC.md) and
[RFC 0002](../../docs/rfcs/0002-knowledge-layer-architecture.md).

- `loadKnowledge`, `validateKnowledge`, and `renderRecord` read the content folder, validate it, and
  answer `list`, `get`, `section`, `search`, `links`, `rules`, `tokens`, and `render` from an index in
  memory. Errors name the file, line, and field.
- There is no compile step and no `dist/`. The compiler, compiled record schema, digest, bundle, and
  manifest are gone.
- Removed exports: `./compile`, `./retrieve`, `./records`, `./manifest`, `./markdown/*`,
  `./search-index`, `./assets/*`, `./schema`, and `./schema/compiled-knowledge-record.json`. New
  exports: `./SPEC.md`. `./schema/knowledge-record.json` and `./package.json` remain.
- Component records lose the `contract:` wrapper and the `web:` section. Links use the kinds in
  the spec, and rule references are checked against real sections.
- New `knowledge` CLI and `knowledge-mcp` stdio server (tools `search`, `get`, `list`, `links`,
  `rules`, `tokens`, `validate`; records as `knowledge://<id>` resources), a `knowledge.config.json`
  file, and an optional DTCG token resolver. New exports: `./config` and `./tokens-dtcg`. New
  dependencies: `@modelcontextprotocol/sdk` and `zod`.
- `knowledge get <id> --impl <name>` and the MCP `get` tool's `implementation` argument print a
  component's implementation after its record: package, element, import, usage, and an API table
  mapping attributes, properties, and events to record parameters and events. Folders come from a
  new `implementations` field in `knowledge.config.json`. New export: `./implementation`, the
  reader and contract check (`checkImplementation`) the docs site now imports instead of its own
  copies. A file that does not match its record fails with `ERR_INVALID_IMPLEMENTATION`.
- `get`, `links`, `tokens`, and `rules --id` accept a name that matches one record (`button`,
  `text field`). A one-word `search` tolerates typos, a word that starts a name or title matches it, and, in
  the CLI and MCP server, `search` follows each result with
  the call that reads it. Unknown ids and sections suggest the nearest ones, and failed lookups carry
  an error code: `{ error, code, suggestions }` with `--json`, and `structuredContent.error` over MCP.
- `get` of a whole component record, in the CLI and MCP server, leaves out the token table and ends
  with a line giving the binding count and the `tokens` call. `get <id>#tokens`, `tokens`, JSON
  output, and `knowledge://` resources are unchanged. `Knowledge.render` takes `{ omit }`.
- `rules`, in the CLI and MCP server, prints the `applicability` of a conditional rule under it, and
  ends with a line naming the `get <address>` call that reads a rule's rationale, references, and
  examples.
- `section()` of an enum parameter value, such as `component.button#parameters.variant.danger`,
  returns `{ meaning, example?, guidance? }` instead of the meaning string, and `get` renders the
  example and guidance with it.
- Validation is stricter: `composes` must go from a component to a component, `follows` and
  parameter `guidance` must point at a pattern or a guideline, and `example-of` must go from an
  example to a component, pattern, or guideline. An annotation ID must not repeat another
  annotation ID or a heading's slug. Every heading now gets an address: a slug an earlier heading
  took gets the next free suffix, where before a third heading could lose its address. Format
  version 1 is unreleased, so it stays at 1.
- Removed the `build`, `prepack`, and `clean` scripts, and the dependencies `@stevegreco/design-system`,
  `js-yaml`, `parse5`, and `unist-util-visit`.
- New optional `known-issues` field on every record: open problems, each a `statement` and an
  optional `issue` URL that tracks the fix. `get` shows them under the summary.
- Validation reports any text value that starts with `TODO`, the placeholder in the draft that the
  repository's `pnpm component:new <name> --phase spec` writes.

## 0.0.1

This version breaks compatibility with bundles compiled earlier in this stack:

- `compiledSchemaVersion` is 7. Bundles at 3, 4, 5, or 6 fail to open.
- Portable `specVersion` is 5. Usage entries have stable IDs. Component rules use a shared
  vocabulary in `content`, `behavior`, and `accessibility.requirements`.
- `dist/public/records.jsonl` is no longer written or published. Read `records.json`.
- Compiled records no longer include `decisions[]`. ADR provenance is a `sources[]` entry with
  `kind: adr`.

Treat the next published version as incompatible with any consumer that opened `records.jsonl` by
path or assumed compiled schema 3.
