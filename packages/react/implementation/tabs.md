---
component: component.tabs
package: "@taproot-ds/react-components"
export: Tabs
usage: |
  <Tabs accessibleName="Account settings" defaultValue="profile">
    <TabsSection value="profile" label="Profile">…</TabsSection>
    <TabsSection value="notifications" label="Notifications">…</TabsSection>
    <TabsSection value="billing" label="Billing">…</TabsSection>
  </Tabs>
api:
  - { name: accessibleName, kind: prop, parameter: accessibleName }
  - { name: value, kind: prop, parameter: value }
  - {
      name: defaultValue,
      kind: prop,
      type: string,
      description: The value selected first when the parent does not control value.,
    }
  - { name: onChange, kind: callback, event: change }
  - {
      name: className,
      kind: prop,
      type: string,
      description: Added to the root element's classes.,
    }
items:
  section:
    export: TabsSection
    api:
      - { name: label, kind: prop, parameter: label }
      - { name: value, kind: prop, parameter: value }
      - {
          name: children,
          kind: prop,
          type: ReactNode,
          description: The section's panel content.,
        }
---

## Sections

Each section is a direct `TabsSection` child. Its `label` prop is the visible text of its tab, its
`value` prop identifies it, and its children are the panel content. Values must be unique within
the tab set; a section whose value repeats is left out, with a console warning. Other children are
not rendered.

## Value

Pass `value` and `onChange` to control the selection, or `defaultValue` to let Tabs keep it. A
value that matches no section selects the first section. `onChange` receives the new section's value
and runs only when a person selects a different tab, never for a value set by the parent.

## Styles

Load the token stylesheet and the component stylesheet once, before rendering:

```tsx
import "@taproot-ds/tokens/css";
import "@taproot-ds/tokens/base"; // optional: page font, text color, background, and headings
import "@taproot-ds/react-components/style.css";
```

Components style only themselves; `guideline.page-setup` says what the page around them needs.

## Hidden sections

Only the selected section's content is mounted. Switching tabs unmounts the others, so state inside
them, such as text typed into a field, resets. Keep that state in the parent when it must survive a
switch.

## Reading direction

Arrow keys follow the tab list's computed CSS `direction`, so a right-to-left page reverses them
without any configuration.
