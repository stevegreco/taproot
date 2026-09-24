---
id: binding.button.web-component
schemaVersion: 1
type: binding
title: Button web component
summary: Maps the Button contract onto ds-button, FACE, slots, and parts.
status: draft
visibility: public
jobs:
  - implement
tags:
  - button
  - web-component
relations:
  implements:
    - component.button
sources:
  - kind: authored
    path: packages/knowledge/content/bindings/button.web-component.md
host:
  specVersion: 1
  platform: web-component
  package: "@stevegreco/design-system-components"
  export: DsButton
  defaultTagName: ds-button
  registration:
    export: defineButton
    supportsAliases: true
  anatomy:
    control:
      element: button
      part: button
    content:
      slot: default
      required: true
      accepts:
        - text
        - decorative-icon
        - text-and-decorative-icon
  parameters:
    action:
      attribute: type
      property: type
      values:
        activate: button
        submit: submit
        reset: reset
    fullWidth:
      attribute: full-width
    accessibleName:
      attribute: aria-label
  events:
    activate:
      event: click
      suppressedWhen: effectively-disabled
  properties:
    form:
      type: "HTMLFormElement | null"
      readonly: true
      description: The associated form, including association across the shadow boundary.
  formAssociation:
    mechanism: FACE
    fieldsetDisables: true
    submitRunsConstraintValidation: true
    resetResetsAssociatedForm: true
  focus:
    forwardsTo: control
  parts:
    button:
      description: The inner native button control.
  rationale:
    - decision: Button is form-associated.
      rationale: Submit and reset behavior must work across the shadow boundary.
---

Register with `defineButton()`. The default tag is `ds-button`. Aliases are allowed. `::part(button)`
is an escape hatch.
