---
component: component.select
package: "@stevegreco/web-components"
tagName: ds-select
defineExport: defineSelect
usage: |
  <ds-select label="Delivery method" name="delivery" required>
    <option value="">Choose delivery</option>
    <option value="standard">Standard</option>
    <option value="express">Express</option>
  </ds-select>
api:
  - { name: label, kind: attribute, parameter: label }
  - { name: hint, kind: attribute, parameter: hint }
  - { name: error, kind: attribute, parameter: error }
  - { name: name, kind: attribute, parameter: name }
  - { name: value, kind: attribute, parameter: value }
  - { name: disabled, kind: attribute, parameter: disabled }
  - { name: required, kind: attribute, parameter: required }
  - { name: value, kind: property, parameter: value }
  - name: form
    kind: property
    type: "HTMLFormElement | null"
    description: The associated form, including association across the shadow boundary.
  - { name: input, kind: event, event: input }
  - { name: change, kind: event, event: change }
items:
  choice:
    tagName: option
    api:
      - name: label
        kind: property
        parameter: label
        description: The option's label attribute, or its text when it has none.
      - { name: value, kind: attribute, parameter: value }
      - { name: disabled, kind: attribute, parameter: disabled }
  group:
    tagName: optgroup
    api:
      - { name: label, kind: attribute, parameter: label }
      - { name: disabled, kind: attribute, parameter: disabled }
---

## Forms

Set `name` to include the current value in form submission. The `value` attribute supplies the
initial value; the `value` property changes the current value without changing the reset value.
A non-empty `error` blocks submission. Clear it after the user corrects the value.

Provide native `<option>` children, optionally grouped by `<optgroup label="…">`.
The component copies this content into its shadow `<select>` and observes changes to choice text,
values, disabled states, and groups. Option event listeners are not copied. Use the component's
`input` and `change` events.

An initial `value` attribute takes precedence over an option's `selected` attribute. Without
`value`, native option defaults determine the reset value. A first empty-valued option provides a
prompt and makes a required Select invalid until a non-empty value is chosen. The menu appearance
and opening keys follow the browser and operating system.
