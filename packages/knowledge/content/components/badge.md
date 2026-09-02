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
  - web-component
relations:
  related:
    - component.button
sources:
  - kind: authored
    path: packages/knowledge/content/components/badge.md
  - kind: component-spec
    path: packages/components/specs/badge.spec.yaml
  - kind: adr
    path: packages/tokens/docs/adr/0003-token-tier-consumption.md
---

Badge labels an item's state, category, or supporting metadata. It is not a control. Use Button to
trigger an action in the current view. Use a link to navigate to another location.

## Choose a variant

- `default` is neutral metadata or categorization.
- `accent` is brand emphasis without implying status.
- `success` is a successful or active state.
- `danger` is a failed or blocked status. It is not a destructive action. Use Button `danger` for
  that.
- `warning` is a condition that needs attention.
- `info` is an informational state or a feature label.

Keep the label short. Do not rely on color alone. Badge is not focusable and does not activate.

Do not treat Badge as a live region. If a status change must be announced, the surrounding UI
applies that role.

Badge consumes semantic color, type, radius, and primitive spacing. It has no component-token
namespace. Do not recreate its variants in product CSS.

The component specification is authoritative for the complete API, anatomy, states, behavior, and
accessibility contract. The knowledge compiler must merge those structured fields into the compiled
record rather than reproduce them here.
