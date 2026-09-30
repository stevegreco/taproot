---
component: component.link
package: "@stevegreco/design-system-components"
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
