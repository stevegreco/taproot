---
component: component.icon
package: "@taproot-ds/web-components"
tagName: ds-icon
defineExport: defineIcon
usage: |
  <ds-button variant="destructive">
    <ds-icon><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg></ds-icon>
    Delete project
  </ds-button>
  <ds-icon size="medium" label="Warning"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2 22 21H2z"/></svg></ds-icon>
api:
  - { name: size, kind: attribute, parameter: size }
  - { name: label, kind: attribute, parameter: accessibleName }
---

Slot one inline `<svg>` with a `viewBox`. The icon scales it to fill a square of the chosen size.
Paint the artwork with `currentColor`, as a `fill` or a `stroke`, so it takes the color of the text
around it. The icon sets no fill or stroke of its own, which keeps outline and filled icon sets
working.

The role and accessible name are set through `ElementInternals`, so the host never gains `role` or
`aria-*` attributes. Without `label` the icon is hidden from assistive technology.
Use `label`, not `aria-label`, to name the icon. Button is the one component that takes
`aria-label`; the [Button implementation](button.md) says why.
