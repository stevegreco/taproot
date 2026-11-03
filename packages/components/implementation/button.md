---
component: component.button
package: "@stevegreco/web-components"
tagName: ds-button
defineExport: defineButton
usage: |
  <ds-button variant="primary">Save changes</ds-button>
api:
  - name: variant
    kind: attribute
    parameter: variant
  - name: size
    kind: attribute
    parameter: size
  - name: type
    kind: attribute
    parameter: action
    values:
      activate: button
      submit: submit
      reset: reset
  - name: disabled
    kind: attribute
    parameter: disabled
  - name: full-width
    kind: attribute
    parameter: fullWidth
  - name: aria-label
    kind: attribute
    parameter: accessibleName
  - name: form
    kind: property
    type: "HTMLFormElement | null"
    description: The associated form, including association across the shadow boundary.
  - name: click
    kind: event
    event: activate
---

## Forms

Button defaults to `type="button"`. Set the type when it participates in a form:

```html
<form>
  <!-- form fields -->
  <ds-button type="button" variant="secondary">Cancel</ds-button>
  <ds-button type="submit" variant="primary">Save changes</ds-button>
</form>
```

Use `type="reset"` only when restoring every form control to its initial value is the intended
behavior.

## Map intent to variants

- Use `primary` for the highest-emphasis action in the group.
- Use `secondary` for a visible supporting action.
- Use `tertiary` for a low-emphasis contextual action.
- Use `destructive` for a destructive or difficult-to-reverse action.

Apply the hierarchy to each action group, not to the page as a whole.

## Use the component contract

Load the published token stylesheet once at the application root. Button reads semantic tokens
directly, so it follows the active theme. The tokens it reads are not a customization API.

Do not recreate Button states with product CSS. Use the published variants and sizes first. Treat
`::part(button)` as an escape hatch that requires a specific product need and design review.

## Handle labels and icons

Keep visible text when it is needed to understand the result. Mark a decorative icon hidden from
assistive technology. Provide `aria-label` when an icon is the only visible content.

## Handle unavailable actions

Use `disabled` only while the action is unavailable. When the reason is not apparent from the
surrounding fields or content, explain it nearby. Do not replace disabled behavior with a visual
style that still allows activation.
