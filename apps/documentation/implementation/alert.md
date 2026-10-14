---
component: component.alert
package: "@stevegreco/design-system-components"
tagName: ds-alert
defineExport: defineAlert
usage: |
  <ds-alert variant="success" label="Changes saved" announce="polite" dismissible>
    Your profile is up to date.
  </ds-alert>
  <ds-alert variant="danger" label="Upload failed">
    <ds-icon slot="icon" label="Error"><svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg></ds-icon>
    The file is larger than 10 MB.
    <ds-button slot="actions" variant="secondary" size="sm">Choose another file</ds-button>
  </ds-alert>
api:
  - { name: variant, kind: attribute, parameter: variant }
  - { name: label, kind: attribute, parameter: label }
  - { name: announce, kind: attribute, parameter: announce }
  - { name: dismissible, kind: attribute, parameter: dismissible }
  - { name: dismiss-label, kind: attribute, parameter: dismissLabel }
  - { name: dismissLabel, kind: property, parameter: dismissLabel }
  - { name: dismiss, kind: event, event: dismiss }
---

## Content

The message uses the default slot. Put a `<ds-icon>` in `slot="icon"` and actions, usually
`<ds-button>` or `<ds-link>`, in `slot="actions"`. Empty icon and actions slots take no space. The
`label` attribute renders the title as text, not a heading. If the page outline needs a heading, put
one in the message.

## Announcing

With `announce="polite"` the title and message sit in a `role="status"` region inside the shadow
root, and with `announce="urgent"` in a `role="alert"` region. The icon, actions, and dismiss
control stay outside it. The host itself never gains `role` or `aria-*` attributes.

A live region announces text that appears inside it, which an element inserted with its text in
place does not reliably do. So when an announcing alert connects, is unhidden, or switches
`announce` on, it adds its text one frame after the region. Insert the alert, or remove `hidden`,
when the event happens. Changing the slotted text of a connected announcing alert is announced
again.

## Dismissal

`dismissible` adds a native button named by `dismiss-label` (default `Dismiss`). Activating it
dispatches a cancelable, bubbling `dismiss` event from the host. Unless a listener calls
`preventDefault()`, the alert sets its own `hidden` attribute. In a framework, clear your state from
the event, or the next render may still hold the hidden element.

When the alert is hidden for any reason while it contains focus, focus moves to the next tabbable
element after it in the document, or the previous one when nothing follows. To send focus somewhere
else, focus it from your `dismiss` listener; the alert leaves focus wherever the listener put it.
