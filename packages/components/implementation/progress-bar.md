---
component: component.progress-bar
package: "@taproot-ds/web-components"
tagName: ds-progress-bar
defineExport: defineProgressBar
usage: |
  <ds-progress-bar label="Uploading report.pdf" value="40"></ds-progress-bar>
  <ds-progress-bar label="Importing 3 of 12 contacts" value="3" max="12"></ds-progress-bar>
api:
  - { name: label, kind: attribute, parameter: label }
  - { name: value, kind: attribute, parameter: value }
  - { name: max, kind: attribute, parameter: max }
---

## Slots

None. The progress bar renders its own label from the `label` attribute and ignores children.

The role (`progressbar`), accessible name, and range are set through `ElementInternals`, so the host
never gains `role` or `aria-*` attributes (`component.progress-bar#named-by-label`). The `value`
and `max` properties read back clamped, the same way the exposed value is
(`component.progress-bar#value-clamped`).

## The hidden attribute

The progress bar never sets `hidden` itself. Removing it or setting `hidden` when the task ends is
the page's job, and neither is announced (`component.progress-bar#not-announced`).

## Framework notes

- Set `value` as progress events arrive. Throttling is not needed: the fill animates to each new
  length on its own.
- Use the task's own unit for `max`, such as bytes or files, rather than converting to a
  percentage.
- Report the outcome with a `<ds-alert announce="polite">` when the task ends.
