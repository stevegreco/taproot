---
component: component.card
package: "@taproot-ds/web-components"
tagName: ds-card
defineExport: defineCard
usage: |
  <ul class="projects">
    <li>
      <ds-card label="Quarterly revenue report" href="/reports/q3">
        <img slot="media" src="/img/q3-chart.png" alt="" />
        Revenue grew 12% over the previous quarter.
        <ds-badge variant="success">Published</ds-badge>
        <ds-button slot="actions" variant="tertiary" size="small">Share</ds-button>
      </ds-card>
    </li>
  </ul>
api:
  - { name: href, kind: attribute, parameter: href }
  - { name: click, kind: event, event: activate }
parts:
  title:
    api:
      - { name: label, kind: attribute, parameter: label }
      - { name: heading-level, kind: attribute, parameter: headingLevel }
      - { name: headingLevel, kind: property, parameter: headingLevel }
---

## Slots

Supporting content uses the default slot. Put an `<img>` or other graphic in `slot="media"` and
actions, usually `<ds-button>` or `<ds-link>`, in `slot="actions"`. Empty media, body, and actions
slots take no space. The title is not a slot: the `label` attribute renders it, inside a heading
at `heading-level` (`component.card#title-is-heading`).

With `href`, the title is a native anchor whose target is stretched over the card, so
middle-click, modifier-click, and the context menu work anywhere on it
(`component.card#one-destination`). Only the actions slot sits above that target. A link or
control placed in the default slot is covered by it, so put it in the actions
(`component.card#interactive-content-in-actions`).

## The hidden attribute

`ds-card` honors `hidden` and sets nothing on itself.

## Framework notes

- The card is `display: block` and fills the height its layout gives it, with the actions pinned to
  the bottom, so cards in a grid row line up. Lay cards out with a list and a grid in product CSS.
- Listen for `click` on the card and check `event.composedPath()` for the title link when you need
  to know that the destination was followed rather than an action. Clicks on actions bubble too.
