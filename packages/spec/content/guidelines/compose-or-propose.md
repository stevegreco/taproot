---
id: guideline.compose-or-propose
type: guideline
title: Compose or propose
summary: Compose a new interface need from tokens and existing components first, and open an issue or RFC only when the system itself has to change.
tags:
  - composition
  - contribution
  - governance
  - rfc
links:
  related:
    - pattern.action-hierarchy
    - component.button
    - component.badge
---

Most interface needs are met by composing what the system already publishes. Change the system
only when composition cannot express the need without copying or overriding a component.

## Compose first

Work through these in order and stop at the first one that meets the need:

1. A published variant, size, or parameter of an existing component.
2. Existing components placed together in product markup, such as a Badge beside a Button or a
   Link after an action group.
3. Product layout and chrome styled with semantic tokens. Use a primitive token only when no
   semantic role expresses the choice.

A composition that meets the need stays in product code. It does not need an issue, a record, or
a review.

## Do not fork a component

Composition stops being composition when product code rebuilds what a component owns. Do not:

- Copy a component's styles or structure to make a variant that the contract does not publish.
- Restyle a component's internal parts, or override its component tokens, to create a variant,
  state, or size the contract does not publish. Setting a component token to customize an existing
  variant is fine.
- Define new component tokens in product code.
- Use one component to do another's job, such as a Badge as a control or a Link styled as a
  Button. The action hierarchy pattern says which control fits which job.
- Rebuild a component's states, focus ring, or accessible name handling in a new element.

When one of these is the only way to meet the need, the system is missing something. Propose it.

## Propose a change

Open an issue on the design system when the change fits the components and tokens it already has:

- A variant, size, or parameter on an existing component.
- A bug in a component, one of its implementations, a token, or its documentation.
- A composition used in more than one place that should become a pattern.
- A new component whose behavior comes from a standard platform control plus tokens, such as an
  icon or a field shell.

Some changes alter how the system works, not only what it contains. Say so in the issue, so the
design question is settled before anyone writes code:

- A component that owns focus management, an overlay, or a composite keyboard model, such as a
  Dialog, Select, Menu, or Tabs.
- A new token tier, or a semantic role category that does not exist yet.
