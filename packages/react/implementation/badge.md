---
component: component.badge
package: "@stevegreco/design-system-react"
export: Badge
usage: |
  <Badge variant="success">Active</Badge>
  <Badge variant="info" icon={<SparkleIcon />}>Beta</Badge>
api:
  - { name: variant, kind: prop, parameter: variant }
  - {
      name: children,
      kind: prop,
      type: ReactNode,
      description: The label text. It states the status on its own; color does not carry the meaning.,
    }
  - {
      name: icon,
      kind: prop,
      type: ReactNode,
      description: Optional leading icon before the label. It is hidden from assistive technology.,
    }
  - {
      name: className,
      kind: prop,
      type: string,
      description: Added to the root element's classes.,
    }
---

## Label and icon

The children are the label. Keep them to a word or two, and make the words state the status
("Failed", not only a red badge). An empty label logs a console warning.

The `icon` prop places a graphic before the label, sized to the label's text and painted in its
color. The icon is always decorative (`aria-hidden`), because the label already says what it means.

## Not a control

Badge renders a `span` with no role, no `tabindex`, and no event handlers. To act on a status, put a
Button beside it. To announce a status change, let the surrounding UI or an Alert do it: Badge sets
no live region.

## Styles

Load the token stylesheet and the component stylesheet once, before rendering:

```tsx
import "@stevegreco/design-system/css";
import "@stevegreco/design-system-react/style.css";
```

## Unknown variants

A `variant` outside the listed values renders as `default` and logs a console warning.
