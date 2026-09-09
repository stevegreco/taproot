---
id: component.badge
schemaVersion: 1
type: component
title: Badge
summary: Use Badge for status or metadata. It is not a control.
status: draft
visibility: public
jobs:
  - design
  - implement
  - review
tags:
  - badge
  - status
  - metadata
relations:
  related:
    - component.button
sources:
  - kind: authored
    path: packages/knowledge/content/components/badge.md
  - kind: adr
    path: packages/tokens/docs/adr/0003-token-tier-consumption.md
contract:
  specVersion: 4
  description: Labels status or metadata. Not a control.
  usage:
    do:
      - situation: Display status, category, or supporting metadata.
    avoid:
      - situation: Trigger an action in the current view.
        instead: Button
        why: Badge is not interactive and does not communicate an available action.
      - situation: Navigate to another location.
        instead: Link
        why: Links provide native navigation semantics.
      - situation: Announce a live status change by itself.
        instead: Host live-region semantics
        why: Badge sets no live-region role.
  anatomy:
    - name: surface
      role: indicator
      description: Non-interactive label surface.
    - name: content
      role: label
      description: Short status or metadata text.
  parameters:
    variant:
      kind: enum
      values:
        default: Neutral metadata or categorization.
        accent: Brand emphasis without implying status.
        success: Successful or active state.
        danger: Failed or blocked status, not a destructive action.
        warning: Condition that needs attention.
        info: Informational state or feature label.
      default: default
  events: {}
  states:
    - default
  behavior:
    - Badge is not focusable and does not activate.
  accessibility:
    semantics: Non-interactive text.
    name: Visible text is the accessible name.
    keyboard: []
    requirements:
      - The text communicates the state. Meaning does not depend on color alone.
      - Badge is not used as a control.
      - Badge does not set a live-region role.
      - Changing status that must be announced is the surrounding UI's job.
  rationale:
    - decision: Badge consumes semantic tokens directly.
      rationale: ADR 0003. No component-token namespace.
    - decision: Badge is non-interactive and sets no live-region role.
      rationale: Status that must be announced belongs to the surrounding UI.
  visuals:
    surface:
      base:
        padding-block: primitives.space.1
        padding-inline: primitives.space.2
        radius: semantic.radius.pill
        font-family: semantic.typography.label.small.fontFamily
        font-size: semantic.typography.label.small.fontSize
        font-weight: semantic.typography.label.small.fontWeight
        line-height: semantic.typography.label.small.lineHeight
        letter-spacing: semantic.typography.label.small.letterSpacing
      variant:
        default:
          background: semantic.color.background.muted
          foreground: semantic.color.foreground.muted
          border: semantic.color.border.subtle
        accent:
          background: semantic.color.background.brand.muted
          foreground: semantic.color.foreground.brand.default
          border: semantic.color.border.brand.muted
        success:
          background: semantic.color.background.status.success.default
          foreground: semantic.color.foreground.status.success.default
          border: semantic.color.border.status.success.default
        danger:
          background: semantic.color.background.status.danger.default
          foreground: semantic.color.foreground.status.danger.default
          border: semantic.color.border.status.danger.default
        warning:
          background: semantic.color.background.status.warning.default
          foreground: semantic.color.foreground.status.warning.default
          border: semantic.color.border.status.warning.default
        info:
          background: semantic.color.background.status.info.default
          foreground: semantic.color.foreground.status.info.default
          border: semantic.color.border.status.info.default
---

Badge labels an item's state, category, or supporting metadata. It is not a control. Use Button to
trigger an action in the current view. Use a link to navigate to another location.

## Choose a variant

Use `default` for neutral metadata, `accent` for brand emphasis without implying status, and the
status variants for the matching condition. Badge `danger` is a failed or blocked status, not a
destructive action.

Keep the label short. Badge is not a control.

Do not treat Badge as a live region. If a status change must be announced, the surrounding UI
applies that role.

Badge consumes semantic color, type, radius, and primitive spacing. It has no component-token
namespace.
