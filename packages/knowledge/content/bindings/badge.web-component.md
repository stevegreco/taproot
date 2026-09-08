---
id: binding.badge.web-component
schemaVersion: 1
type: binding
title: Badge web component
summary: Maps the Badge contract onto ds-badge, a span surface, and a default slot.
status: draft
visibility: public
jobs:
  - implement
tags:
  - badge
  - web-component
relations:
  implements:
    - component.badge
sources:
  - kind: authored
    path: packages/knowledge/content/bindings/badge.web-component.md
host:
  specVersion: 1
  platform: web-component
  package: "@stevegreco/design-system-components"
  export: DsBadge
  defaultTagName: ds-badge
  registration:
    export: defineBadge
    supportsAliases: true
  anatomy:
    surface:
      element: span
      part: badge
    content:
      slot: default
      required: true
      accepts:
        - text
  parameters:
    variant:
      attribute: variant
      property: variant
  events: {}
  parts:
    badge:
      description: The inner label surface.
---

Register with `defineBadge()`. The default tag is `ds-badge`. Aliases are allowed. `::part(badge)` is
an escape hatch.
