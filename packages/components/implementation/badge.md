---
component: component.badge
package: "@stevegreco/web-components"
tagName: ds-badge
defineExport: defineBadge
usage: |
  <ds-badge variant="success">Active</ds-badge>
api:
  - { name: variant, kind: attribute, parameter: variant }
---

## Styles

Install `@stevegreco/design-system` alongside this package, and load its token stylesheet once at
the application root. Without it, the component has no colors, spacing, or type.

```js
import "@stevegreco/design-system/css";
```

Without a bundler, link the package's `dist/css/tokens.css` instead.
