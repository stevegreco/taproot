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
  reader the docs site now imports instead of its own copy.
- Removed the `build`, `prepack`, and `clean` scripts, and the dependencies `@stevegreco/design-system`,
  `js-yaml`, `parse5`, and `unist-util-visit`.

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
