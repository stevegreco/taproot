# ADR 0005: YAML component specs with generated narrative

**Status:** Accepted

This decision supersedes the Markdown-authoring and narrative-projection portions of
[ADR 0003](./0003-component-owned-portable-contracts.md). It preserves component ownership of
portable contracts and host separation (KNOW-002, KNOW-003, KNOW-006, KNOW-008).

ADR 0003 remains the record that portable contracts live on `type: component` records, that
`type: spec` is not a record type, and that host mappings stay on bindings.

## Context

Button's Markdown record placed a complete portable contract in YAML frontmatter and then repeated
usage and variant guidance in the body. Requiring a prose companion preserved that duplication
without adding distinct knowledge.

RFC 0001 Option C attached a non-record contract file to a required Markdown component record.
That still left two authored surfaces. This decision uses the YAML file as the component record
itself.

## Decision

Author complete component records as `*.spec.yaml` files. The suffix describes the source file. It
does not introduce `type: spec`, a separate spec ID, or another search result. Identity remains
the authored `id` (`component.button`, `component.badge`).

A YAML component must be complete and useful without a Markdown body. The compiler generates the
compiled `body` from the structured record and sets compiled-only `bodyOrigin: generated`. That
projection is not a second authored authority (KNOW-004, KNOW-007, KNOW-014, KNOW-024). Markdown
records still author their bodies (`bodyOrigin: authored`).

Portable `specVersion` is 5. Usage entries have stable IDs. Component-specific rules use a common
vocabulary (`id`, `level`, `statement`, optional `applicability`, `rationale`, `references`, and
`examples.do` / `examples.avoid`) in `content`, `behavior`, and `accessibility.requirements`.
Obligation levels are `must`, `should`, and `may`. IDs are unique within a contract. Rule
`references` are dotted record IDs, optionally with a heading fragment. Plain-language
`usage.avoid.instead` values such as `Link` are not record IDs.

Shared action-group rules stay on the action-hierarchy pattern. Host-specific facts such as
ancestor-fieldset disabling and inner-native-control focus forwarding stay on the web-component
binding.

Patterns, guidelines, examples, and bindings remain Markdown. Components without a published
contract may still be Markdown. Compiled schema version is 7. Authored `schemaVersion` stays 1.
`parseRecord(markdown, { sourcePath })` remains the Markdown parser. YAML specs parse through
`parseYamlRecord` / `parseAuthoredRecord`.

## Consequences

- `get("component.button")` returns one compiled component whose `contract` was authored in
  `components/button/button.spec.yaml`.
- Documentation and search read usage and rules from the compiled record, not from parallel prose.
- Generated Markdown in `markdown/<id>.md` is a readable projection of that record.
- Bundles whose compiled schema version is not 7 fail closed.

## Alternatives considered

**Keep Markdown components with structured frontmatter.** Rejected. The contract already contained
the usage and rules, and the body repeated them.

**RFC Option C: a non-record contract file composed onto a required Markdown component.** Rejected
for this slice. The YAML file is the component record, not an attachment.
