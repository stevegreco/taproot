---
component: component.checkbox
package: "@stevegreco/react-components"
export: Checkbox
usage: |
  <Checkbox
    label="Email me product updates"
    hint="About once a month."
    name="updates"
    defaultChecked
  />
api:
  - { name: label, kind: prop, parameter: label }
  - { name: hint, kind: prop, parameter: hint }
  - { name: error, kind: prop, parameter: error }
  - { name: checked, kind: prop, parameter: checked }
  - {
      name: defaultChecked,
      kind: prop,
      type: boolean,
      description: The checked state at first when the parent does not control checked. Form reset restores it.,
    }
  - { name: indeterminate, kind: prop, parameter: indeterminate }
  - { name: name, kind: prop, parameter: name }
  - { name: value, kind: prop, parameter: value }
  - { name: disabled, kind: prop, parameter: disabled }
  - { name: required, kind: prop, parameter: required }
  - { name: onInput, kind: callback, event: input }
  - { name: onChange, kind: callback, event: change }
  - {
      name: className,
      kind: prop,
      type: string,
      description: Added to the root element's classes.,
    }
---

## Checked

Pass `checked` and `onChange` to control the value, or `defaultChecked` to let Checkbox keep it.
`onInput` and then `onChange` receive the new checked state, and run only when a person toggles the
checkbox by clicking the box or label or pressing Space. A value set by the parent runs neither.

## Indeterminate

`indeterminate` shows the dash and exposes the mixed state. It does not change `checked` or what the
form submits. When a person activates the checkbox, the dash clears and checked toggles, even
though the prop is still `true`: Checkbox treats the prop like the DOM property, so a new value
from the parent sets it again. A parent that derives `indeterminate` from its children, such as a
"select all" row, sets it from those children on every `onChange`.

## Forms

Inside a form, a checked checkbox submits `value` (default `"on"`) under `name`; unchecked or
disabled submits nothing. `required` and a non-empty `error` block the form from submitting.
Required shows "(required)" after the label; assistive technology hears it from the control
instead.

Form reset restores `defaultChecked` and clears the dash without running `onInput` or `onChange`.
A controlled checkbox keeps showing its `checked` prop after a reset, because the parent owns it.

## Styles

Load the token stylesheet and the component stylesheet once, before rendering:

```tsx
import "@stevegreco/design-system/css";
import "@stevegreco/react-components/style.css";
```
