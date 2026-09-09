# ADR 0003: Component-owned portable contracts

**Status:** Accepted

This decision supersedes the spec-record half of
[ADR 0002](./0002-knowledge-owned-portable-contracts.md). ADR 0002 remains the record of
host-neutrality and of moving portable contracts out of `packages/components`. This ADR changes
only where that host-neutral contract is authored.

It accepts [RFC 0001](../rfcs/0001-component-contract-record-shape.md) Option B.

## Context

ADR 0002 authored portable contracts as `type: spec` records and copied `spec.contract` onto the
compiled component. No consumer listed, searched, or retrieved a spec on its own. Documentation
reads `list({ type: "component" })` and `related()` to a binding. The copy had no provenance on the
component.

The host-neutral rule still holds. A design or review agent that calls `get("component.button")`
must not receive `ds-button`. Host mappings still need an authored home.

## Decision

Author the portable contract on the component record when the component publishes one. Delete
`type: spec` from the record vocabulary. Keep each host binding as its own record.

`component.button.contract` and `component.badge.contract` are host-neutral. They have no
`tagName`, slots, parts, attribute spellings, FACE, or DOM types. A binding's `host` is the only
authored object that may name those. `checkBindingAgreement` is the enforcement point: binding
anatomy names, parameters, and events must be a bijection with the component contract they
implement.

The component body is when and why, and host-neutral. FACE, `fieldset`, and inner-native-button
how-to live on the binding and the implementation guideline.

Compiled `contract` is legal only on `type: component`. A later component may omit `contract`.
Compiled schema version is 6. Authored `schemaVersion` stays 1. Bundles whose compiled schema
version is not 6 fail closed. Portable `specVersion` is 4. Compact `visuals` compile into mapping
rows; see [ADR 0004](./0004-compact-visual-authoring.md).

Provenance of a contract is the component's `kind: authored` source.

`list({ type: "spec" })` throws `KnowledgeQueryError` `unknown-filter-value`. That is a retrieval
contract break. `get("spec.button")` is `undefined`.

Option C remains the documented fallback. If a later component makes one-file review unusable,
extract a non-record contract source then.

## Consequences

- `get("component.button").contract` is authored in `components/button.md` and stays host-neutral.
- `related("component.button")` still reaches the web-component binding through `implementedBy`.
- Public record count drops by one per migrated component.
- KNOW-002, KNOW-006, KNOW-008, the content model, and `AGENTS.md` name component records as the
  portable contract owner.
- Compiled Markdown is the narrative projection and omits `contract`, `host`, and `checks`. `get()` is
  the only compiled owner of those fields.

## Alternatives considered

**Keep `type: spec` and attach through `uses`.** Rejected. The spec had no independent consumer,
and the copy hid contract provenance.

**RFC Option C: a non-record contract file composed onto the component.** Deferred. Button and
Badge are reviewable as one file. A later, larger component can reopen this.
