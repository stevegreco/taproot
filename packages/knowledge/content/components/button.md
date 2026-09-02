---
id: component.button
schemaVersion: 1
type: component
title: Button
summary: Use Button to trigger an action or to submit or reset a form.
status: draft
visibility: public
jobs:
  - design
  - implement
  - review
tags:
  - action
  - button
  - form
relations:
  related:
    - component.badge
sources:
  - kind: authored
    path: packages/knowledge/content/components/button.md
  - kind: token-source
    path: packages/tokens/src/tokens/components/button.tokens.json
  - kind: adr
    path: packages/tokens/docs/adr/0003-token-tier-consumption.md
tokenRef:
  tier: component
  namespace: component.button
  description: All visual values consume the published Button component-token contract.
contract:
  specVersion: 2
  description: Triggers an action or submits or resets a form.
  usage:
    do:
      - situation: Trigger an action in the current view.
      - situation: Submit or reset a form.
    avoid:
      - situation: Navigate to another location.
        instead: Link
        why: Links provide native navigation semantics.
      - situation: Display status or metadata.
        instead: Badge
        why: Button communicates an available action.
  anatomy:
    - name: control
      role: interactive-surface
      description: Interactive control.
    - name: content
      role: label
      description: Action label with an optional decorative icon.
  parameters:
    variant:
      kind: enum
      values:
        primary: Highest-emphasis action.
        secondary: Supporting action.
        ghost: Low-emphasis action.
        danger: Destructive or difficult-to-reverse action.
      default: primary
    size:
      kind: enum
      values:
        sm: Small button.
        md: Medium button.
      default: md
    action:
      kind: enum
      values:
        activate: Triggers an action.
        submit: Submits the associated form.
        reset: Resets the associated form.
      default: activate
    disabled:
      kind: boolean
      default: false
    fullWidth:
      kind: boolean
      default: false
      description: Fills the available inline size.
    accessibleName:
      kind: string
      description: Accessible name when visible content is insufficient.
  events:
    activate:
      description: Requests the action represented by the button.
  states:
    - default
    - hover
    - pressed
    - focus-visible
    - disabled
  behavior:
    - Disabled prevents activation.
    - Submit and reset participate in a form when the host supports form association.
  accessibility:
    semantics: Button.
    name: Required from visible content or accessibleName.
    keyboard:
      - key: Enter
        action: Activate.
      - key: Space
        action: Activate.
    requirements:
      - Keyboard focus remains visibly indicated.
      - Icon-only buttons have an accessible name.
      - The label describes the resulting action.
      - Meaning does not depend on color alone.
  rationale:
    - decision: Button has a published component-token namespace.
      rationale: Consumers need a stable customization boundary for variants and states.
---

Button lets a person trigger an action in the current view. Use a link for navigation and Badge for
status or metadata.

## Choose a variant

Use `primary` for the highest-emphasis action in a group, `secondary` for a supporting action,
`ghost` for low-emphasis access, and `danger` for destructive or difficult-to-reverse work.

Apply the [action hierarchy pattern](../patterns/action-hierarchy.md) when several actions appear
together.

## Write the label

Use a concise label that describes the result, such as "Save changes" or "Delete account." Do not
use generic labels such as "Click here."
