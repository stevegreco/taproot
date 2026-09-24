---
id: binding.text-field.web-component
schemaVersion: 1
type: binding
title: Text field web component
summary: Maps the Text field contract onto ds-text-field, FACE, label, hint, and error.
status: draft
visibility: public
jobs:
  - implement
tags:
  - form
  - text-field
  - web-component
relations:
  implements:
    - component.text-field
sources:
  - kind: authored
    path: packages/knowledge/content/bindings/text-field.web-component.md
host:
  specVersion: 1
  platform: web-component
  package: "@stevegreco/design-system-components"
  export: DsTextField
  defaultTagName: ds-text-field
  registration:
    export: defineTextField
    supportsAliases: true
  anatomy:
    field:
      element: div
      part: field
    label:
      element: label
      part: label
    control:
      element: input
      part: control
    hint:
      element: p
      part: hint
    error:
      element: p
      part: error
  events:
    input:
      event: input
      suppressedWhen: effectively-disabled
    change:
      event: change
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
    control:
      description: The inner native input.
    hint:
      description: Supporting guidance. Hidden when empty.
    error:
      description: The error message. Hidden when empty.
  rationale:
    - decision: Text field is form-associated.
      rationale: The value must submit and reset across the shadow boundary.
    - decision: Label, hint, and error live in the shadow root.
      rationale: Association uses ids inside one shadow root, so it does not depend on light-DOM ids.
---

Register with `defineTextField()`. The default tag is `ds-text-field`. Aliases are allowed.
`::part(control)` is an escape hatch. The host honors the native `hidden` attribute; that is not a
contract parameter.

The visible label is the `label` attribute. Hint and error text are the `hint` and `error`
attributes. A non-empty `error` sets `aria-invalid` and includes the message in `aria-describedby`.
The required mark is `aria-hidden`; the inner input carries `required`.
