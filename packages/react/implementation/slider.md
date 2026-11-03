---
component: component.slider
package: "@stevegreco/design-system-react"
export: Slider
usage: |
  <Slider
    label="Maximum price (USD)"
    hint="Shows homes at or below this price."
    name="max-price"
    min={0}
    max={2000}
    step={50}
    defaultValue={800}
    onChange={(price) => search({ maxPrice: price })}
  />
api:
  - { name: label, kind: prop, parameter: label }
  - { name: hint, kind: prop, parameter: hint }
  - { name: error, kind: prop, parameter: error }
  - { name: value, kind: prop, parameter: value }
  - {
      name: defaultValue,
      kind: prop,
      type: number,
      description: The value at first when the parent does not control value. Form reset restores it. Defaults to min.,
    }
  - { name: min, kind: prop, parameter: min }
  - { name: max, kind: prop, parameter: max }
  - { name: step, kind: prop, parameter: step }
  - { name: name, kind: prop, parameter: name }
  - { name: disabled, kind: prop, parameter: disabled }
  - { name: onInput, kind: callback, event: input }
  - { name: onChange, kind: callback, event: change }
  - {
      name: className,
      kind: prop,
      type: string,
      description: Added to the root element's classes.,
    }
---

## Value

Pass `value` with `onInput` to control the slider, or `defaultValue` to let it keep its own value.
A controlled slider shows only the `value` it is given, so a parent that wants the thumb to follow a
drag sets `value` in `onInput`. A value outside `min` and `max`, or between steps, shows as the
nearest allowed value; the prop itself is not rewritten.

## Input and change

`onInput` runs for every new value while a person drags or presses a key. `onChange` runs once when
they release, and only if the value differs from where they started
(`component.slider#change-on-release`). Run costly work, such as a new search, in `onChange`.
Neither runs for a new `value` prop or a form reset.

## Forms

With `name`, the value submits as a number string. A disabled slider submits nothing. A non-empty
`error` blocks the form from submitting, and the browser shows its text. Reset restores
`defaultValue` in an uncontrolled slider; a controlled slider keeps `value`.

## Value text

The value text is the number in the locale React Aria uses, which comes from an `I18nProvider` or
the browser. Put units in the label.

## Reading direction

The track follows the page's computed CSS `direction`: in a right-to-left page `min` is on the
right, and Arrow Right decreases the value. The value text keeps the reader's number format.

## Styles

Load the token stylesheet and the component stylesheet once, before rendering:

```tsx
import "@stevegreco/design-system/css";
import "@stevegreco/design-system-react/style.css";
```
