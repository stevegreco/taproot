---
component: component.button
package: "@taproot-ds/web-components"
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

## Styles

Install `@taproot-ds/tokens` alongside this package, and load its token stylesheet once at
the application root. Without it, the component has no colors, spacing, or type.

```js
import "@taproot-ds/tokens/css";
```

Without a bundler, link the package's `dist/css/tokens.css` instead.

Button reads semantic tokens directly, so it follows the active theme. The tokens it reads are not
a customization API.

Do not recreate Button states with product CSS. Use the published variants and sizes first. Treat
`::part(button)` as an escape hatch that requires a specific product need and design review.

## Icons

Mark a decorative icon hidden from assistive technology. Provide `aria-label` when an icon is the
only visible content.

## Why `aria-label` and not `label`

Button maps `accessibleName` to `aria-label`, while Icon, Spinner, and Tabs map it to `label`. The
difference is deliberate. `aria-label` is the attribute people already put on an icon-only button,
and Button only passes it to the native button inside, so it keeps its standard meaning. The other
three use `label` because their name does more than name: Icon is hidden from assistive technology
without one, Spinner falls back to "Loading", and Tabs names the tab list inside it rather than the
host. They set the name through `ElementInternals` or on that inner element, so the host never
gains `aria-*` attributes. Renaming either side would break published markup.
