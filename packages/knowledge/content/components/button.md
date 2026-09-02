---
id: component.button
schemaVersion: 1
type: component
title: Button
summary: Use Button to trigger an action or to submit or reset a form.
status: draft
visibility: public
jobs:
  - design
  - implement
  - review
tags:
  - action
  - button
  - form
  - web-component
relations:
  related:
    - pattern.action-hierarchy
    - guideline.button-implementation
    - guideline.button-review
sources:
  - kind: authored
    path: packages/knowledge/content/components/button.md
  - kind: component-spec
    path: packages/components/specs/button.spec.yaml
  - kind: token-source
    path: packages/tokens/src/tokens/components/button.tokens.json
  - kind: adr
    path: packages/tokens/docs/adr/0003-token-tier-consumption.md
---

Button lets a person trigger an action in the current view. Use a link for navigation and Badge for
status or metadata.

## Choose a variant

- `primary` marks the highest-emphasis action in an action group.
- `secondary` keeps a supporting action visible without competing with the primary action.
- `ghost` provides low-emphasis access to an action and remains transparent at rest.
- `danger` identifies an action that is destructive or difficult to reverse. It communicates risk,
  not general importance.

Apply the [action hierarchy pattern](../patterns/action-hierarchy.md) when several actions appear
together.

## Write the label

Use a concise label that describes the result, such as "Save changes" or "Delete account." Do not
use generic labels such as "Click here."

## Preserve native behavior

Button is a form-associated custom element. Set `type="submit"` to submit its associated form and
`type="reset"` to reset it. The default type is `button`.

The component forwards focus to its inner native button and follows a disabled ancestor
`fieldset`. It suppresses activation while effectively disabled.

## Accessibility

- Provide visible label text or an `aria-label` for an icon-only control.
- Keep the focus indicator visible.
- Do not communicate meaning through color alone.
- Explain nearby why an action is disabled when the reason is not already clear.

The component specification is authoritative for the complete API, anatomy, states, behavior, and
accessibility contract. The knowledge compiler must merge those structured fields into the compiled
record rather than reproduce them here.
