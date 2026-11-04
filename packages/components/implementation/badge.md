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
```

Without a bundler, link the package's `dist/css/tokens.css` instead.
