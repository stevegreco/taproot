---
component: component.dialog
package: "@stevegreco/web-components"
tagName: ds-dialog
defineExport: defineDialog
usage: |
  <ds-dialog label="Delete project?" description="This cannot be undone.">
    <p>Delete the archived project and its files.</p>
    <ds-button slot="actions" variant="secondary">Cancel</ds-button>
    <ds-button slot="actions" variant="destructive">Delete project</ds-button>
  </ds-dialog>
api:
  - name: open
    kind: attribute
    parameter: open
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
parts:
  title:
    api:
      - name: label
        kind: attribute
        parameter: label
  description:
    api:
      - name: description
        kind: attribute
        parameter: description
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

The internal native dialog uses `closedby="closerequest"` when dismissible, preserving platform
close requests such as the system back gesture. When dismissal is disabled it uses
`closedby="none"`. Native cancel requests still pass through the host's cancelable `cancel` event.

Unconsumed Escape is handled in the bubble phase for the active dialog, including when focus has
fallen back to the document body. A child control must call `preventDefault()` to consume Escape
without dismissing the dialog; `stopPropagation()` alone does not prevent a native close request.
Composing key events do not request dismissal through the component keyboard handler.
