---
component: component.text-area
package: "@stevegreco/web-components"
tagName: ds-text-area
defineExport: defineTextArea
usage: |
  <ds-text-area label="Project description" name="description" rows="4" required></ds-text-area>
api:
  - { name: label, kind: attribute, parameter: label }
  - { name: hint, kind: attribute, parameter: hint }
  - { name: error, kind: attribute, parameter: error }
  - { name: name, kind: attribute, parameter: name }
  - { name: value, kind: attribute, parameter: value }
  - { name: disabled, kind: attribute, parameter: disabled }
  - { name: required, kind: attribute, parameter: required }
  - { name: placeholder, kind: attribute, parameter: placeholder }
  - { name: autocomplete, kind: attribute, parameter: autocomplete }
  - { name: rows, kind: attribute, parameter: rows }
  - { name: readonly, kind: attribute, parameter: readonly }
  - { name: value, kind: property, parameter: value }
  - name: form
    kind: property
    type: "HTMLFormElement | null"
    description: The associated form, including association across the shadow boundary.
  - { name: input, kind: event, event: input }
  - { name: change, kind: event, event: change }
---

## Forms

Set `name` to include the current value in form submission. The `value` attribute supplies the
initial value; the `value` property changes the current value without changing the reset value.
A non-empty `error` blocks submission.

To validate in your own code, set `novalidate` on the form so the submit reaches your listener.
Read the values there, and set `error` on each field that needs a correction. Clear `error` on the
field's `input` event and when the form resets, because a reset leaves it set.

`rows` accepts positive whole numbers and defaults to four. `readonly` preserves focus and submission while preventing edits. Users can resize the control vertically.

## Styles

Install `@stevegreco/design-system` alongside this package, and load its token stylesheet once at
the application root. Without it, the component has no colors, spacing, or type.

```js
import "@stevegreco/design-system/css";
```

Without a bundler, link the package's `dist/css/tokens.css` instead.
