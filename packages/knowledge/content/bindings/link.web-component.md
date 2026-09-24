---
id: binding.link.web-component
schemaVersion: 1
type: binding
title: Link web component
summary: Maps the Link contract onto ds-link, an inner native anchor, a slot, and a part.
status: draft
visibility: public
jobs:
  - implement
tags:
  - link
  - web-component
relations:
  implements:
    - component.link
sources:
  - kind: authored
    path: packages/knowledge/content/bindings/link.web-component.md
host:
  specVersion: 1
  platform: web-component
  package: "@stevegreco/design-system-components"
  export: DsLink
  defaultTagName: ds-link
  registration:
    export: defineLink
    supportsAliases: true
  anatomy:
    control:
      element: a
      part: link
    content:
      slot: default
      required: true
      accepts:
        - text
        - text-and-decorative-icon
  events:
    activate:
      event: click
  focus:
    forwardsTo: control
  parts:
    link:
      description: The inner native anchor.
  rationale:
    - decision: Link is not form-associated.
      rationale: A link navigates. It never submits or resets a form.
    - decision: Navigation is the inner anchor's native behavior.
      rationale: Middle-click, modifier keys, and the context menu keep working without script.
    - decision: Content always includes text.
      rationale: Link text is the accessible name. There is no accessibleName parameter, so an icon-only link would be announced as just "link".
---

Register with `defineLink()`. The default tag is `ds-link`. Aliases are allowed. `::part(link)` is
an escape hatch. The host honors the native `hidden` attribute; that is not a contract parameter.

The host is `display: inline`, so an inline link wraps with the text around it. `href` is mirrored
onto the inner anchor; removing it removes the anchor's `href`, which drops link semantics and
focusability.
