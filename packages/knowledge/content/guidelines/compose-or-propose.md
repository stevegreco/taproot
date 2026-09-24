---
id: guideline.compose-or-propose
schemaVersion: 1
type: guideline
title: Compose or propose
summary: Compose a new interface need from tokens and existing components first, and open an issue or RFC only when the system itself has to change.
status: draft
visibility: public
jobs:
  - design
  - implement
tags:
  - composition
  - contribution
  - governance
  - rfc
relations:
  uses:
    - pattern.action-hierarchy
  related:
    - component.button
    - component.badge
sources:
  - kind: authored
    path: packages/knowledge/content/guidelines/compose-or-propose.md
---

Most interface needs are met by composing what the system already publishes. Change the system
only when composition cannot express the need without copying or overriding a component.

## Compose first

Work through these in order and stop at the first one that meets the need:

1. A published variant, size, or parameter of an existing component.
2. Existing components placed together in product markup, such as a Badge beside a Button or a
   Link after an action group.
3. Product layout and chrome styled with `--semantic-*` tokens. Use a `--primitives-*` token only
   when no semantic role expresses the choice.

A composition that meets the need stays in product code. It does not need an issue, a record, or
a review.

## Do not fork a component

Composition stops being composition when product code rebuilds what a component owns. Do not:

- Copy a component's CSS or markup to make a variant that the contract does not publish.
- Use `::part()` or `--component-*` token overrides to create a variant, state, or size the
  contract does not publish. Setting a component token to customize an existing variant is fine.
- Define new `--component-*` tokens in product code.
- Use one component to do another's job, such as a Badge as a control or a Link styled as a
  Button. The action hierarchy pattern says which control fits which job.
- Rebuild a component's states, focus ring, or accessible name handling in a new element.

When one of these is the only way to meet the need, the system is missing something. Propose it.

## Open an issue

Open an issue when the change fits inside the existing record shape and contracts:

- A variant, size, or parameter on an existing component.
- A bug in a component, binding, token, or record.
- A composition used in more than one place that should become a pattern record.
- A new component whose behavior comes from a native element plus tokens, such as an Icon host or
  a field shell.

A new component follows the new-component definition of done in
`docs/knowledge/new-component.md`. Its component record has a `contract` with explicit `visuals`,
shaped like the Button, Badge, and Link records. Extend that template rather than inventing a new
record or mapping shape for one component.

## Open an RFC

Open an RFC in `docs/rfcs/` before any code when the change alters how the system works, not only
what it contains:

- A component that owns focus management, an overlay, or a composite keyboard model, such as a
  Dialog, Select, Menu, or Tabs.
- A change to the component record, contract, or binding shape.
- A new token tier, or a semantic role category that does not exist yet.
- A change that would supersede an accepted ADR.

An accepted RFC becomes an ADR, and the ADR updates the requirements and content model it changes.

## Keep the process small

This is a personal system. An RFC is one Markdown document that states the problem, the evidence,
and the proposed change. It needs no review board or sign-off beyond its author. The RFC step
exists to force the design question before the implementation, not to add ceremony.
