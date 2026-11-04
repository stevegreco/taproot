---
component: component.text-field
package: "@stevegreco/web-components"
tagName: ds-text-field
defineExport: defineTextField
usage: |
  <form>
    <ds-text-field label="Email" name="email" type="email" hint="Used for sign-in." required></ds-text-field>
    <ds-button type="submit">Continue</ds-button>
  </form>
api:
  - { name: label, kind: attribute, parameter: label }
  - { name: hint, kind: attribute, parameter: hint }
  - { name: error, kind: attribute, parameter: error }
  - { name: type, kind: attribute, parameter: type }
  - { name: name, kind: attribute, parameter: name }
  - { name: value, kind: attribute, parameter: value }
  - { name: placeholder, kind: attribute, parameter: placeholder }
  - { name: autocomplete, kind: attribute, parameter: autocomplete }
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

Text field defaults to `type="text"`. Set `name` so the value is included when the form submits.
Pair it with Button to submit:

```html
<form>
  <ds-text-field label="Email" name="email" type="email" autocomplete="email" required></ds-text-field>
  <ds-button type="submit">Continue</ds-button>
</form>
```

A non-empty `error` marks the field invalid, associates that message with the control, and blocks
submit until the message is cleared. Use `hint` for guidance that is not an error.

To validate in your own code, set `novalidate` on the form so the submit reaches your listener.
Read the values there, and set `error` on each field that needs a correction. Clear `error` on the
field's `input` event and when the form resets, because a reset leaves it set.

The `value` attribute sets the initial value, which form reset restores. `autocomplete` takes the
HTML autofill tokens, such as `email` or `current-password`, so the browser can offer saved values.

## Styles

Install `@stevegreco/design-system` alongside this package, and load its token stylesheet once at
the application root. Without it, the component has no colors, spacing, or type.

```js
import "@stevegreco/design-system/css";
```

Without a bundler, link the package's `dist/css/tokens.css` instead.
