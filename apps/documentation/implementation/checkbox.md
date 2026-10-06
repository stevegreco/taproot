---
component: component.checkbox
package: "@stevegreco/design-system-components"
tagName: ds-checkbox
defineExport: defineCheckbox
usage: |
  <form>
    <ds-checkbox label="Email me product updates" name="updates" hint="About one email a month." checked></ds-checkbox>
    <ds-checkbox label="I agree to the terms" name="terms" required></ds-checkbox>
    <ds-button type="submit">Continue</ds-button>
  </form>
api:
  - { name: label, kind: attribute, parameter: label }
  - { name: hint, kind: attribute, parameter: hint }
  - { name: error, kind: attribute, parameter: error }
  - { name: checked, kind: attribute, parameter: checked }
  - { name: indeterminate, kind: attribute, parameter: indeterminate }
  - { name: name, kind: attribute, parameter: name }
  - { name: value, kind: attribute, parameter: value }
  - { name: disabled, kind: attribute, parameter: disabled }
  - { name: required, kind: attribute, parameter: required }
  - name: form
    kind: property
    type: "HTMLFormElement | null"
    description: The associated form, including association across the shadow boundary.
  - { name: input, kind: event, event: input }
  - { name: change, kind: event, event: change }
---

## Forms

The `checked` attribute sets the initial state. Setting the `checked` property changes the current
state, and form reset restores the attribute's state. Without `value`, a checked checkbox submits
`on`, as a native checkbox does.

## Groups

Group related checkboxes in a native `fieldset` with a `legend` that names the set:

```html
<fieldset>
  <legend>Notifications</legend>
  <ds-checkbox label="Product updates" name="notify" value="updates"></ds-checkbox>
  <ds-checkbox label="Security alerts" name="notify" value="security"></ds-checkbox>
</fieldset>
```

Every checkbox shows its `label`, including one in a table row. Do not hide the label with CSS.
