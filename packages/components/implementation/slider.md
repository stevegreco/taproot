---
component: component.slider
package: "@taproot-ds/web-components"
tagName: ds-slider
defineExport: defineSlider
usage: |
  <ds-slider
    label="Maximum price (USD)"
    hint="Shows homes at or below this price."
    name="max-price"
    max="2000"
    step="50"
    value="800"
  ></ds-slider>
api:
  - { name: label, kind: attribute, parameter: label }
  - { name: hint, kind: attribute, parameter: hint }
  - { name: error, kind: attribute, parameter: error }
  - { name: value, kind: attribute, parameter: value }
  - { name: min, kind: attribute, parameter: min }
  - { name: max, kind: attribute, parameter: max }
  - { name: step, kind: attribute, parameter: step }
  - { name: name, kind: attribute, parameter: name }
  - { name: disabled, kind: attribute, parameter: disabled }
  - name: form
    kind: property
    type: "HTMLFormElement | null"
    description: The associated form, including association across the shadow boundary.
  - { name: input, kind: event, event: input }
  - { name: change, kind: event, event: change }
---

## Value

The `value` attribute sets the initial value, and form reset restores it. The `value` property is
the current number. Setting it changes the current value and fires no events
(`component.slider#programmatic-no-events`). Without a `value` attribute the slider starts at
`min`. A value outside the range or between steps reads back as the nearest allowed value.

## Input and change

`input` fires for every new value while a person drags or presses a key, and `change` fires once
when they release (`component.slider#change-on-release`). Read `event.target.value` in either. Run
costly work, such as a new search, from `change`.

## Forms

With `name`, the value submits as a number string. To validate in your own code, set `novalidate`
on the form so the submit reaches your listener, and set `error` on a slider that needs a
correction. Clear `error` on its `change` event and when the form resets, because a reset leaves it
set.

## Value text

The value beside the label is the number formatted for the `lang` of the nearest ancestor that has
one, or the browser's locale. Put units in the label.

## Reading direction

The track follows the element's CSS `direction`: with `dir="rtl"` on the slider or an ancestor,
`min` is on the right and Arrow Right decreases the value.
