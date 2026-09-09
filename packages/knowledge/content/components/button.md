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
  specVersion: 4
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
  configurationAxes:
    prefersReducedMotion:
      values:
        - reduce
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
    - A disabled ancestor fieldset disables the button.
    - Programmatic focus and blur are forwarded to the inner native control.
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
  stateResolution:
    suppress:
      disabled:
        - hover
        - pressed
    overlay:
      - hover
      - pressed
    independent:
      - focus-visible
  visuals:
    control:
      base:
        radius: component.button.radius
        gap: component.button.gap
        font-family: component.button.font.family
        font-size: component.button.font.size
        font-weight: component.button.font.weight
        line-height: component.button.font.lineHeight
        letter-spacing: component.button.font.letterSpacing
        transition-duration: component.button.motion.duration
        transition-timing-function: component.button.motion.easing
      states:
        focus-visible:
          outline: component.button.focus.border
      size:
        md:
          padding-inline: component.button.size.medium.paddingInline
          padding-block: component.button.size.medium.paddingBlock
        sm:
          padding-inline: component.button.size.small.paddingInline
          padding-block: component.button.size.small.paddingBlock
      variant:
        primary:
          background: component.button.primary.background.default
          foreground: component.button.primary.foreground.default
          border: component.button.primary.border.default
          states:
            hover:
              background: component.button.primary.background.hover
              border: component.button.primary.border.hover
            pressed:
              background: component.button.primary.background.pressed
              border: component.button.primary.border.pressed
            disabled:
              background: component.button.primary.background.disabled
              foreground: component.button.primary.foreground.disabled
              border: component.button.primary.border.disabled
        secondary:
          background: component.button.secondary.background.default
          foreground: component.button.secondary.foreground.default
          border: component.button.secondary.border.default
          states:
            hover:
              background: component.button.secondary.background.hover
            pressed:
              background: component.button.secondary.background.pressed
            disabled:
              background: transparent
              foreground: component.button.secondary.foreground.disabled
              border: component.button.secondary.border.disabled
        ghost:
          background: transparent
          foreground: component.button.ghost.foreground.default
          border: transparent
          states:
            hover:
              background: component.button.ghost.background.hover
            pressed:
              background: component.button.ghost.background.pressed
            disabled:
              background: transparent
              foreground: component.button.ghost.foreground.disabled
        danger:
          background: component.button.danger.background.default
          foreground: component.button.danger.foreground.default
          border: component.button.danger.border.default
          states:
            hover:
              background: component.button.danger.background.hover
              border: component.button.danger.border.hover
            pressed:
              background: component.button.danger.background.pressed
              border: component.button.danger.border.pressed
            disabled:
              background: component.button.danger.background.disabled
              foreground: component.button.danger.foreground.disabled
              border: component.button.danger.border.disabled
      prefersReducedMotion:
        reduce:
          transition: none
---

Button lets a person trigger an action in the current view. Use a link for navigation and Badge for
status or metadata.

## Choose a variant

Use `primary` for the highest-emphasis action in a group, `secondary` for a supporting action,
`ghost` for low-emphasis access, and `danger` for destructive or difficult-to-reverse work.

Apply the [action hierarchy pattern](../patterns/action-hierarchy.md#assign-emphasis) when several
actions appear together.

## Write the label

Use a concise label that describes the result, such as "Save changes" or "Delete account." Do not
use generic labels such as "Click here."
