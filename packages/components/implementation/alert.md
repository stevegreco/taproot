---
component: component.alert
package: "@stevegreco/web-components"
tagName: ds-alert
defineExport: defineAlert
usage: |
  <ds-alert variant="success" label="Changes saved" announce="polite" dismissible>
    Your profile is up to date.
  </ds-alert>
  <ds-alert variant="danger" label="Upload failed">
    <ds-icon slot="icon" label="Error"><svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg></ds-icon>
    The file is larger than 10 MB.
    <ds-button slot="actions" variant="secondary" size="small">Choose another file</ds-button>
  </ds-alert>
api:
  - { name: variant, kind: attribute, parameter: variant }
  - { name: announce, kind: attribute, parameter: announce }
  - { name: dismiss, kind: event, event: dismiss }
parts:
  title:
    api:
      - { name: label, kind: attribute, parameter: label }
  dismiss:
    api:
      - { name: dismissible, kind: attribute, parameter: dismissible }
      - { name: dismiss-label, kind: attribute, parameter: dismissLabel }
      - { name: dismissLabel, kind: property, parameter: dismissLabel }
---

## Slots

The message uses the default slot. Put a `<ds-icon>` in `slot="icon"` and actions, usually
`<ds-button>` or `<ds-link>`, in `slot="actions"`. Empty icon and actions slots take no space. The
`label` attribute renders the title as text, not a heading. If the page outline needs a heading, put
one in the message.

The live region for `announce` is inside the shadow root, around the title and message only
(`component.alert#announce-on-request`). The host never gains `role` or `aria-*` attributes.

## The hidden attribute

Dismissing sets the alert's own `hidden` attribute unless a `dismiss` listener calls
`preventDefault()` (`component.alert#dismiss-reports`). Setting `hidden` while the alert contains
focus moves focus on, however it was set (`component.alert#focus-after-dismiss`).

## Framework notes

- Render the alert, or remove `hidden`, when the event it reports happens. An announcing alert adds
  its text one frame after it connects or is unhidden, so a live region already in place announces
  it.
- Clear your state from the `dismiss` event, or the next render may still hold the hidden element.
- To send focus somewhere other than the next tabbable element, focus it from your `dismiss`
  listener.

## Styles

Install `@stevegreco/design-system` alongside this package, and load its token stylesheet once at
the application root. Without it, the component has no colors, spacing, or type.

```js
import "@stevegreco/design-system/css";
```

Without a bundler, link the package's `dist/css/tokens.css` instead.
