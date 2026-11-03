---
component: component.button
package: "@stevegreco/react-components"
export: Button
usage: |
  <Button variant="primary" onActivate={save}>Save changes</Button>
  <Button variant="secondary" action="reset">Reset form</Button>
  <Button variant="tertiary" accessibleName="Search"><SearchIcon aria-hidden /></Button>
api:
  - { name: variant, kind: prop, parameter: variant }
  - { name: size, kind: prop, parameter: size }
  - { name: action, kind: prop, parameter: action }
  - { name: disabled, kind: prop, parameter: disabled }
  - { name: fullWidth, kind: prop, parameter: fullWidth }
  - { name: accessibleName, kind: prop, parameter: accessibleName }
  - { name: onActivate, kind: callback, event: activate }
  - {
      name: children,
      kind: prop,
      type: ReactNode,
      description: "The label, with an optional decorative icon before or after it.",
    }
  - {
      name: className,
      kind: prop,
      type: string,
      description: "Added to the button element's classes.",
    }
  - {
      name: ref,
      kind: prop,
      type: Ref<HTMLButtonElement>,
      description: "The native button element.",
    }
---

## Activation

`onActivate` runs when a person presses the button with a pointer, Enter, or Space. It never runs
while `disabled` is set. It also runs for `action="submit"` and `action="reset"`, alongside the
form's submit or reset. It receives no arguments.

## Forms

The default `action`, `activate`, renders a button that neither submits nor resets a form, unlike a
plain HTML button. Set `action="submit"` or `action="reset"` for a button that should. The button
belongs to the form it sits in.

## Disabled

A disabled button is removed from the tab order and announced as disabled. Put the reason for
disabling it in nearby text when the context does not already say why.

## Icons

Pass an icon as a child next to the label and hide it from assistive technology
(`aria-hidden`). An icon-only button needs `accessibleName`; without visible text or a name,
Button logs a console warning.

## Styles

Load the token stylesheet and the component stylesheet once, before rendering:

```tsx
import "@stevegreco/design-system/css";
import "@stevegreco/react-components/style.css";
```
