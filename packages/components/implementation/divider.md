---
component: component.divider
package: "@taproot-ds/web-components"
tagName: ds-divider
defineExport: defineDivider
usage: |
  <div style="display: grid; gap: 16px">
    <p>12 of 20 seats used.</p>
    <ds-divider></ds-divider>
    <p>Billed annually.</p>
  </div>
  <div style="display: flex; align-items: center; gap: 8px">
    <ds-button variant="secondary">Undo</ds-button>
    <ds-divider orientation="vertical"></ds-divider>
    <ds-button variant="secondary">Share</ds-button>
  </div>
api:
  - { name: orientation, kind: attribute, parameter: orientation }
---

## Slots

None. The divider renders its own line and ignores children.

The role (`separator`) and its orientation are set through `ElementInternals`, so the host never
gains `role` or `aria-*` attributes (`component.divider#exposed-as-separator`). Use `<ds-divider>`
in place of `<hr>`, not inside it.

## The hidden attribute

The divider never sets `hidden` itself. Setting it removes the line and the space it takes.

## Framework notes

- The divider has no margin (`component.divider#spans-container`). Put it in a flex or grid
  container and let the container's `gap` set the space on both sides.
- A vertical divider stretches to the height of a flex or grid row, even when the row uses
  `align-items: center`. Outside such a row it is one line of text tall.

## Styles

Install `@taproot-ds/tokens` alongside this package, and load its token stylesheet once at
the application root. Without it, the component has no colors, spacing, or type.

```js
import "@taproot-ds/tokens/css";
```

Without a bundler, link the package's `dist/css/tokens.css` instead.
