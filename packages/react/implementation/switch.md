---
component: component.switch
package: "@taproot-ds/react-components"
export: Switch
usage: |
  <Switch
    label="Email notifications"
    hint="A summary is sent every Monday."
    checked={enabled}
    onChange={saveSetting}
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
      description: Whether the switch starts on when the parent does not control checked. Form reset restores it.,
    }
  - { name: disabled, kind: prop, parameter: disabled }
  - { name: name, kind: prop, parameter: name }
  - { name: value, kind: prop, parameter: value }
  - { name: onInput, kind: callback, event: input }
  - { name: onChange, kind: callback, event: change }
  - {
      name: className,
      kind: prop,
      type: string,
      description: Added to the root element's classes.,
    }
---

## Checked state

Pass `checked` and `onChange` to control the switch, or `defaultChecked` to let it keep its own
state. Both callbacks receive the new state as a boolean. On each toggle `onInput` runs first, then
`onChange`. Neither runs when the parent changes `checked` or when the form resets.

## Applying the setting

Apply the setting in `onChange`, without a separate submit. If saving fails, set `checked` back to
the previous value and pass the reason as `error`. Disable the switch while a save is in progress
if a second toggle would race the first.

## Forms

With `name`, the switch submits `value` (default `on`) only when it is on and enabled. A non-empty
`error` blocks the form from submitting. Reset restores `defaultChecked` in an uncontrolled switch;
a controlled switch keeps `checked`, so listen for the form's `reset` event and set it yourself.

## Styles

Load the token stylesheet and the component stylesheet once, before rendering:

```tsx
import "@taproot-ds/tokens/css";
import "@taproot-ds/tokens/base"; // optional: page font, text color, background, and headings
import "@taproot-ds/react-components/style.css";
```

Components style only themselves; `guideline.page-setup` says what the page around them needs.

## Reading direction

The thumb sits at the inline start when off and the inline end when on, so it follows a
right-to-left page without configuration.
