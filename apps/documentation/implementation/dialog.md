---
component: component.dialog
package: "@stevegreco/design-system-components"
tagName: ds-dialog
defineExport: defineDialog
usage: |
  <ds-dialog label="Delete project?" description="This cannot be undone.">
    <p>Delete the archived project and its files.</p>
    <ds-button slot="actions" variant="secondary">Cancel</ds-button>
    <ds-button slot="actions" variant="danger">Delete project</ds-button>
  </ds-dialog>
api:
  - name: open
    kind: attribute
    parameter: open
  - name: label
    kind: attribute
    parameter: label
  - name: description
    kind: attribute
    parameter: description
  - name: dismissible
    kind: attribute
    parameter: dismissible
  - name: showModal
    kind: property
    type: "() => void"
    description: Sets open to true and opens the connected dialog modally.
  - name: close
    kind: property
    type: "() => void"
    description: Sets open to false and closes the dialog.
  - name: cancel
    kind: event
    event: cancel
  - name: close
    kind: event
    event: close
---

## Open and close

Call `showModal()` on the host or set its `open` property. Both use native `dialog.showModal()`
inside the shadow root. Call `close()` from each composed cancel or completion button. Content
uses the default slot; action buttons use `slot="actions"`. Consumer actions do not close automatically.

`dismissible` defaults to true. Set the property to false or use `dismissible="false"` to block
Escape. A permitted Escape sends a cancelable `cancel` event from the host; call `preventDefault()`
to retain unfinished work. Listen for `close` to synchronize application state.

## Focus and lifecycle

The visible title receives initial focus. Set `autofocus` on a suitable slotted control to choose it
instead. Open dialogs keep Tab and Shift+Tab within composed controls, including open shadow roots.
Closing restores focus to the prior control if it still exists. If the opener was removed, focus the
next workflow control from your close listener.

Hiding or disconnecting an open host releases its scroll lock and reports close. The `open` request
remains set when hidden, so unhiding reopens it. In controlled frameworks, clear application open
state on close when hiding should permanently dismiss the task.

The component uses native modal background blocking and a document scroll lock. It restores the
previous inline overflow value and priority when the final dialog lock closes. Keep dialogs at the
application level and avoid placing them inside inert or hidden ancestors.

The internal native dialog uses `closedby="none"` so keyboard dismissal belongs to the component,
including when a child control stops propagation. Unconsumed Escape is handled in the bubble
phase. Child controls can call `preventDefault()` or `stopPropagation()` to keep their Escape
interaction local, and composing key events do not request dismissal. Browser support for native
`closedby` is required for the stopped-propagation guarantee.
