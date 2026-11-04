---
component: component.avatar
package: "@taproot-ds/web-components"
tagName: ds-avatar
defineExport: defineAvatar
usage: |
  <p>
    <ds-avatar name="Ada Lovelace" image="/people/ada.jpg" size="small" decorative></ds-avatar>
    Ada Lovelace commented
  </p>
  <ds-avatar name="Grace Hopper" size="large"></ds-avatar>
api:
  - { name: name, kind: attribute, parameter: name }
  - { name: image, kind: attribute, parameter: image }
  - { name: size, kind: attribute, parameter: size }
  - { name: decorative, kind: attribute, parameter: decorative }
---

## Slots

None. The avatar renders its picture, initials, or placeholder from its attributes and ignores
children. The `image` attribute is a URL, loaded like an `<img>` `src`.

The role (`img`) and accessible name are set through `ElementInternals`, so the host never gains
`role` or `aria-*` attributes (`component.avatar#named-by-person`). Set `decorative` when the name
is printed beside the avatar (`component.avatar#decorative-beside-name`).

## The hidden attribute

The avatar never sets `hidden` on itself. It hides its own unused parts, so styling `::part(image)`
or `::part(initials)` does not change which one shows (`component.avatar#fallback-order`).

## Framework notes

- To make an avatar open a profile, wrap it in a `<ds-button>` or `<ds-link>` and give that control
  the accessible name. Mark the avatar `decorative` inside it.
- Changing `image` shows the initials until the new picture loads, so reuse the element rather than
  re-creating it to avoid a flash.

## Styles

Install `@taproot-ds/tokens` alongside this package, and load its token stylesheet once at
the application root. Without it, the component has no colors, spacing, or type.

```js
import "@taproot-ds/tokens/css";
```

Without a bundler, link the package's `dist/css/tokens.css` instead.
