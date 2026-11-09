---
component: component.link
package: "@taproot-ds/web-components"
tagName: ds-link
defineExport: defineLink
usage: |
  <p>Themes resolve through the <ds-link href="/adr/0003">token tier ADR</ds-link>.</p>
  <ds-link variant="standalone" href="/projects">View all projects</ds-link>
api:
  - { name: href, kind: attribute, parameter: href }
  - { name: variant, kind: attribute, parameter: variant }
  - { name: click, kind: event, event: activate }
---

## Navigation

`ds-link` renders a native anchor, so activation, middle-click, modifier-click, and the browser's
context menu open the destination as any link does. The browser limits `:visited` styling to color,
so Link publishes no visited style.
