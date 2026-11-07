---
component: component.tabs
package: "@taproot-ds/web-components"
tagName: ds-tabs
defineExport: defineTabs
usage: |
  <ds-tabs label="Account settings" value="profile">
    <ds-tab-panel label="Profile" value="profile">…</ds-tab-panel>
    <ds-tab-panel label="Notifications" value="notifications">…</ds-tab-panel>
    <ds-tab-panel label="Billing" value="billing">…</ds-tab-panel>
  </ds-tabs>
api:
  - { name: label, kind: attribute, parameter: accessibleName }
  - { name: value, kind: attribute, parameter: value }
  - { name: value, kind: property, parameter: value }
  - { name: change, kind: event, event: change }
items:
  section:
    tagName: ds-tab-panel
    api:
      - { name: label, kind: attribute, parameter: label }
      - { name: value, kind: attribute, parameter: value }
---

## Sections

Each section is a direct `ds-tab-panel` child. Its `label` attribute is the visible text of its tab,
and its `value` attribute identifies it, defaulting to the label. Values must be unique within the
tab set. Tabs follow the order of the children, and children can be added, removed, or relabeled
after connection. Other children are not rendered.

The tab set's `label` attribute names the tab list inside it, not the host, so use `label`, not
`aria-label`. Button is the one component that takes `aria-label`; the
[Button implementation](button.md) says why.

`defineTabs()` registers both elements. Pass a second tag name to alias the section element as well
as the tab set.

## Value

The `value` attribute names the selected section. Selecting a tab sets the attribute and then
dispatches `change` from the tab set. Read the `value` property for the selected section's value;
when the attribute matches no section, it returns the first section's value.

## Hidden sections

Only the selected section is assigned to the panel, so the others are not rendered and are not in
the accessibility tree. Content in hidden sections stays in the document, so form fields inside them
keep their values and still submit with their form.

## Styles

Install `@taproot-ds/tokens` alongside this package, and load its token stylesheet once at
the application root. Without it, the component has no colors, spacing, or type.

```js
import "@taproot-ds/tokens/css";
import "@taproot-ds/tokens/base"; // optional: page font, text color, background, and headings
```

Without a bundler, link the package's `dist/css/tokens.css` instead, and `dist/css/base.css` for
the optional page defaults. Components style only themselves; `guideline.page-setup` says what the
page around them needs.
