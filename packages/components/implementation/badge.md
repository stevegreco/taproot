---
component: component.badge
package: "@taproot-ds/web-components"
tagName: ds-badge
defineExport: defineBadge
usage: |
  <ds-badge variant="success">Active</ds-badge>
api:
  - { name: variant, kind: attribute, parameter: variant }
---

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
