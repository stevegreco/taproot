---
component: component.select
package: "@taproot-ds/react-components"
export: Select
usage: |
  <Select
    label="Shirt size"
    hint="Sizes run small."
    name="size"
    defaultValue="m"
    options={[
      { value: "s", label: "Small" },
      { value: "m", label: "Medium" },
      { value: "l", label: "Large", disabled: true },
    ]}
  />
api:
  - { name: label, kind: prop, parameter: label }
  - { name: hint, kind: prop, parameter: hint }
  - { name: error, kind: prop, parameter: error }
  - { name: name, kind: prop, parameter: name }
  - { name: value, kind: prop, parameter: value }
  - {
      name: defaultValue,
      kind: prop,
      type: string,
      description: The value selected first when the parent does not control value. Form reset restores it. Defaults to the first choice that can be chosen.,
    }
  - { name: disabled, kind: prop, parameter: disabled }
  - { name: required, kind: prop, parameter: required }
  - {
      name: options,
      kind: prop,
      type: "Array<SelectOption | SelectGroup>",
      description: The choices and groups in order. Their fields are listed under each item.,
    }
  - { name: onInput, kind: callback, event: input }
  - { name: onChange, kind: callback, event: change }
  - {
      name: className,
      kind: prop,
      type: string,
      description: Added to the root element's classes.,
    }
items:
  choice:
    prop: options
    api:
      - { name: label, kind: field, parameter: label }
      - { name: value, kind: field, parameter: value }
      - { name: disabled, kind: field, parameter: disabled }
  group:
    prop: options
    api:
      - { name: label, kind: field, parameter: label }
      - { name: disabled, kind: field, parameter: disabled }
      - {
          name: options,
          kind: field,
          type: "SelectOption[]",
          description: The group's choices in order. Groups do not nest.,
        }
---

## Platform control

Select renders the platform's native select, not React Aria's Select. React Aria draws its own
button, popover, and list box, and the contract asks for platform selection behavior without a
custom overlay. The platform draws the list, its keyboard and typeahead behavior, and the opening
indicator.

## Choices

Pass `options`, an array of choices (`SelectOption`) and groups (`SelectGroup`). An entry with
its own `options` is a group. An empty label or a repeated value logs a console warning.

## Value

Pass `value` and `onChange` to control the selection, or `defaultValue` to let Select keep it. With
neither, the first available choice is selected. `onInput` and then `onChange` receive the new
value, and run only when a person picks a choice, never for a value set by the parent or a form
reset.

When `options` change, the current value stays selected while it is still a choice. When it is
gone, the platform selects the first available choice and an uncontrolled Select keeps that; no
callback runs.

## Forms

Inside a form, the selected choice submits under `name`. A disabled Select, a disabled choice, or a
choice in a disabled group submits nothing. A non-empty `error` blocks the form from submitting.

`required` shows "(required)" after the label, and assistive technology hears it from the control.
A select always has a value, so `required` blocks submit only while an empty choice is selected:
make the first option `{ value: "", label: "Choose a size" }`.

Form reset restores the initial selection without running `onInput` or `onChange`. A controlled
Select keeps showing its `value` prop after a reset, because the parent owns it.

## Styles

Load the token stylesheet and the component stylesheet once, before rendering:

```tsx
import "@taproot-ds/tokens/css";
import "@taproot-ds/react-components/style.css";
```
