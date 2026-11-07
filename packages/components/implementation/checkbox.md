---
component: component.checkbox
package: "@taproot-ds/web-components"
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

To validate in your own code, set `novalidate` on the form so the submit reaches your listener.
Read the values there, and set `error` on a checkbox that needs a correction. Clear `error` on its
`change` event and when the form resets, because a reset leaves it set.

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

## Select all

Give the parent checkbox no `name`, so it submits nothing. Set its `checked` property when every
option is on and its `indeterminate` property when only some are. On its `change` event, set the
`checked` property of each option. Setting these from script fires no events
(`component.checkbox#programmatic-no-events`), so update the parent yourself when an option changes.

## Styles

Install `@taproot-ds/tokens` alongside this package, and load its token stylesheet once at
the application root. Without it, the component has no colors, spacing, or type.

```js
import "@taproot-ds/tokens/css";
import "@taproot-ds/tokens/base"; // optional: page font, text color, background, and headings
```

Without a bundler, link the package's `dist/css/tokens.css` instead, and `dist/css/base.css` for
the optional page defaults. Components style only themselves; `guideline.page-setup` says what the
page around them needs.
