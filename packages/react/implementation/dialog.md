---
component: component.dialog
package: "@taproot-ds/react-components"
export: Dialog
usage: |
  const [open, setOpen] = useState(false);

  <Button onActivate={() => setOpen(true)}>Delete project</Button>
  <Dialog
    label="Delete project?"
    description="The project and its files are removed."
    open={open}
    onOpenChange={setOpen}
    actions={
      <>
        <Button variant="secondary" onActivate={() => setOpen(false)}>Cancel</Button>
        <Button variant="destructive" onActivate={deleteProject}>Delete</Button>
      </>
    }
  />
api:
  - { name: open, kind: prop, parameter: open }
  - {
      name: defaultOpen,
      kind: prop,
      type: boolean,
      description: Whether the dialog starts shown when the parent does not control open.,
    }
  - { name: dismissible, kind: prop, parameter: dismissible }
  - {
      name: initialFocus,
      kind: prop,
      type: "RefObject<HTMLElement | null>",
      description: The control to focus on opening. Without it the title takes focus.,
    }
  - {
      name: children,
      kind: prop,
      type: "ReactNode | ((close) => ReactNode)",
      description: The content part. A function receives close.,
    }
  - {
      name: actions,
      kind: prop,
      type: "ReactNode | ((close) => ReactNode)",
      description: "The actions part, including an explicit way to close. A function receives close.",
    }
  - { name: onCancel, kind: callback, event: cancel }
  - { name: onClose, kind: callback, event: close }
  - {
      name: onOpenChange,
      kind: callback,
      description: "Called with false when Escape dismissal is not prevented or close runs. A controlled dialog sets open here.",
    }
  - {
      name: className,
      kind: prop,
      type: string,
      description: Added to the root (backdrop) element's classes.,
    }
parts:
  title:
    api:
      - { name: label, kind: prop, parameter: label }
  description:
    api:
      - { name: description, kind: prop, parameter: description }
---

## Open state

Pass `open` and `onOpenChange` to control the dialog, or `defaultOpen` to let it keep its own
state. The dialog only asks to close through `onOpenChange(false)`: after Escape, when `onCancel`
did not prevent it, or when the `close` function given to `children` or `actions` runs. Close it
from your own actions by setting `open` to false.

## Cancel and close

`onCancel` receives a cancelable `Event` when Escape requests dismissal. Call
`event.preventDefault()` to keep the dialog open, for example while a form has unsaved changes.
With `dismissible={false}`, Escape does nothing and `onCancel` never runs, so the actions must
include a Cancel or Close button. Clicking the backdrop never closes the dialog.

`onClose` runs once after each change from open to closed, whatever caused it, including the parent
setting `open` to false. Use it to move focus when the element that opened the dialog no longer
exists, for example after deleting the item it belonged to.

## Focus

On opening, the title takes focus, so a stray key press cannot activate a destructive action. To
focus a control instead, such as the first field of a short form, pass its ref as `initialFocus`.
On close, focus returns to the element that had it before opening.

## Actions

Compose actions with `Button` and give them emphasis by consequence: the main action `primary` or
`destructive`, Cancel `secondary`. Actions sit at the inline end and wrap on narrow screens.

## Styles

Load the token stylesheet and the component stylesheet once, before rendering:

```tsx
import "@taproot-ds/tokens/css";
import "@taproot-ds/tokens/base"; // optional: page font, text color, background, and headings
import "@taproot-ds/react-components/style.css";
```

Components style only themselves; `guideline.page-setup` says what the page around them needs.

The dialog renders in a portal at the end of the document body. It is at most 32rem wide and fits
the viewport; long content scrolls inside the dialog while the title and actions stay in view.
