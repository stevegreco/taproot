# Changelog

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
