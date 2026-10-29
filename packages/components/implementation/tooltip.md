---
component: component.tooltip
package: "@stevegreco/design-system-components"
tagName: ds-tooltip
defineExport: defineTooltip
usage: |
  <ds-tooltip label="Delete row">
    <ds-button variant="tertiary" size="small">
      <ds-icon><svg viewBox="0 0 16 16">…</svg></ds-icon>
    </ds-button>
  </ds-tooltip>
api:
  - { name: label, kind: attribute, parameter: label }
  - { name: placement, kind: attribute, parameter: placement }
---

## Slots

The default slot holds the trigger: one focusable control, usually an icon-only `<ds-button>`. Only
the first element in the slot is the trigger (`component.tooltip#one-trigger`). The bubble is not a
slot; the `label` attribute renders it.

`ds-tooltip` sets the trigger's `aria-label` to `label` (`component.tooltip#label-names-trigger`).
`<ds-button>` and native controls forward `aria-label` to the control, so do not set one yourself.
If the trigger already had one, it is put back when the trigger leaves the tooltip. `<ds-link>`
does not forward `aria-label` yet, so it is not a supported trigger.

The bubble is a manual popover in the top layer, so `overflow: hidden` on an ancestor does not clip
it (`component.tooltip#stays-in-view`). It is hidden from assistive technology.

## The hidden attribute

`ds-tooltip` honors `hidden`, which also closes an open bubble. It never sets `hidden` itself.

## Framework notes

- Wrap the trigger, not the icon inside it. The tooltip listens for pointer and focus events on
  itself, so a trigger rendered elsewhere has no tooltip.
- Change `label` when the action changes, such as Mute and Unmute. The trigger's name follows it.
- Escape closes the bubble in the capture phase and marks the event handled, so a surrounding
  `<ds-dialog>` stays open (`component.tooltip#escape-closes`).
