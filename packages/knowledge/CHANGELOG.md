# Changelog

## Unreleased

This version breaks compatibility with earlier bundles and specs. See
[ADR 0007](../../docs/adr/0007-simplified-knowledge-model.md).

- `compiledSchemaVersion` is 8. Bundles at 7 or earlier fail to open, as does a manifest whose
  digest does not match its content.
- Binding records are gone. Each component spec has a `web:` section, and compiled components carry
  `web`. The portable-contract and host-binding schemas and exports are gone; one record schema
  holds both.
- `contract.states` is a priority list and replaces `stateResolution`. Channels and states use
  neutral names: `focus-ring`, `padding-horizontal`, `padding-vertical`, `motion`,
  `motion-duration`, `motion-easing`, state `focus`, axis `reducedMotion`.
- `related` is the only relation. Guideline `checks` are gone; contract rules are the review
  checklist. `status`, `jobs`, `tags`, usage IDs, and `specVersion` are no longer authored.
- Authored `mappings` and `visualCoverage` are rejected; both are compiler output.
- Markdown pages add install steps, anatomy, states, events, CSS, the web API, and related records.
  The package exports `./markdown/*`, `./assets/*`, and `./package.json`, and the catalog adds
  `info.root` and `markdownPath(id)`.

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
