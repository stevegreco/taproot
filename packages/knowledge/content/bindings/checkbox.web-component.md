---
id: binding.checkbox.web-component
type: binding
title: Checkbox web component
summary: Maps the Checkbox contract onto ds-checkbox, FACE, a native checkbox, label, hint, and error.
status: draft
jobs:
  - implement
tags:
  - checkbox
  - form
  - web-component
relations:
  implements:
    - component.checkbox
host:
  specVersion: 1
  platform: web-component
  package: "@stevegreco/design-system-components"
  export: DsCheckbox
  defaultTagName: ds-checkbox
  registration:
    export: defineCheckbox
    supportsAliases: true
  anatomy:
    field:
      element: div
      part: field
    choice:
      element: div
      part: choice
    control:
      element: input
      part: control
    indicator:
      element: svg
      part: indicator
    label:
      element: label
      part: label
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
    submitsValue: true
  focus:
    forwardsTo: control
  parts:
    control:
      description: The inner native checkbox, restyled as the box.
    indicator:
      description: The check mark or dash drawn over the box. Hidden when neither applies.
    hint:
      description: Supporting guidance. Hidden when empty.
    error:
      description: The error message. Hidden when empty.
  example: |
    <form>
      <ds-checkbox label="Email me product updates" name="updates" hint="About one email a month." checked></ds-checkbox>
      <ds-checkbox label="I agree to the terms" name="terms" required></ds-checkbox>
      <ds-button type="submit">Continue</ds-button>
    </form>
  rationale:
    - decision: Checkbox is form-associated.
      rationale: The checked value must submit and reset across the shadow boundary.
    - decision: The control is a native checkbox with its default appearance removed.
      rationale: The native element supplies role, mixed state, Space to toggle, and label activation. Restyling it keeps those without an ARIA re-implementation.
    - decision: The checked attribute is the initial state, as on a native checkbox.
      rationale: The property is the live state. Reset returns to the attribute, matching Text field's value attribute.
    - decision: Indeterminate has an attribute, unlike a native checkbox.
      rationale: Declarative markup and frameworks can set it without script. Activation removes the attribute, so it never contradicts the live state.
    - decision: Label, hint, and error live in the shadow root.
      rationale: Association uses ids inside one shadow root, so it does not depend on light-DOM ids.
---

Register with `defineCheckbox()`. The default tag is `ds-checkbox`. Aliases are allowed.
`::part(control)` is an escape hatch. The host honors the native `hidden` attribute; that is not a
contract parameter.

The visible label is the `label` attribute, rendered in a `<label for>` so clicking it toggles the
box. Hint and error text are the `hint` and `error` attributes. A non-empty `error` sets
`aria-invalid` and includes the message in `aria-describedby`. A required checkbox shows a text
required mark that is `aria-hidden`; the inner input carries `required`.

The inner input has `appearance: none` and draws the box with the mapped tokens. The indicator is an
inline SVG, `aria-hidden`, drawn in `currentColor` so forced colors repaint it. Under
`forced-colors: active` the box keeps a `CanvasText` border on `Canvas`. Checked and
indeterminate boxes fill with `Highlight` and draw the indicator in `HighlightText`. Disabled uses
`GrayText`.
