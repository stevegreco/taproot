---
id: spec.badge
schemaVersion: 1
type: spec
title: Badge contract
summary: Label status or metadata. Not a control.
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
relations: {}
sources:
  - kind: authored
    path: packages/knowledge/content/specs/badge.md
contract:
  specVersion: 2
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
    hidden:
      kind: boolean
      default: false
      description: Hides the badge.
  events: {}
  states:
    - default
  behavior:
    - Badge is not focusable and does not activate.
    - Hidden hides the badge from the rendered UI.
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
---

Badge's portable contract. Host spellings live on the binding record that implements
`component.badge`.
