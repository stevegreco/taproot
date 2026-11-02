---
component: component.accordion
package: "@stevegreco/design-system-components"
tagName: ds-accordion
defineExport: defineAccordion
usage: |
  <ds-accordion heading-level="2">
    <ds-accordion-section label="How long does delivery take?" expanded>
      <p>Most orders arrive in three to five working days.</p>
    </ds-accordion-section>
    <ds-accordion-section label="Can I return an item?">
      <p>Return anything unused within 30 days for a full refund.</p>
    </ds-accordion-section>
  </ds-accordion>
api:
  - { name: exclusive, kind: attribute, parameter: exclusive }
  - { name: exclusive, kind: property, parameter: exclusive }
  - { name: heading-level, kind: attribute, parameter: headingLevel }
  - { name: headingLevel, kind: property, parameter: headingLevel }
  - { name: toggle, kind: event, event: toggle }
items:
  section:
    tagName: ds-accordion-section
    api:
      - { name: label, kind: attribute, parameter: label }
      - { name: label, kind: property, parameter: label }
      - { name: expanded, kind: attribute, parameter: expanded }
      - { name: expanded, kind: property, parameter: expanded }
---

## Sections

Each section is a direct `ds-accordion-section` child. Its `label` attribute is the visible text of
its trigger, and its boolean `expanded` attribute says whether it is open. Triggers follow the order
of the children, and children can be added, removed, relabeled, expanded, or collapsed after
connection. Other children are not rendered.

`defineAccordion()` registers both elements. Pass a second tag name to alias the section element as
well as the accordion.

## Toggle

Activating a trigger sets or removes the section's `expanded` attribute, then dispatches `toggle`
from the accordion, once for each section that changed (`component.accordion#toggle-reports`). The
event bubbles, and `event.detail.section` is the section; read its `expanded` property for the new
state. Setting `expanded` yourself dispatches nothing. With `exclusive`, setting `expanded` on one
section removes it from the others, and when the markup marks several sections expanded, the first
one stays open.

## Collapsed sections

A collapsed section stays in the document but is not rendered or in the accessibility tree
(`component.accordion#collapsed-content-hidden`). Form fields inside it keep their values and still
submit with their form. The browser's find in page does not search collapsed sections.

## The hidden attribute

`hidden` on the accordion hides every section. `hidden` on a section is not supported; remove the
section instead.

## Framework notes

- Keep each section's open state in your own state if it must survive a re-render, and update it
  from the `toggle` event.
- Render `expanded` as a boolean attribute: present means open, whatever its value.
