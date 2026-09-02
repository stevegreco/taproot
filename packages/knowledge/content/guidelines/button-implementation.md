---
id: guideline.button-implementation
schemaVersion: 1
type: guideline
title: Implement button actions
summary: Implement actions with the Button contract, explicit form behavior, and semantic variants.
status: draft
visibility: public
jobs:
  - implement
tags:
  - action
  - button
  - form
  - implementation
relations:
  uses:
    - component.button
    - pattern.action-hierarchy
  related:
    - guideline.button-review
sources:
  - kind: authored
    path: packages/knowledge/content/guidelines/button-implementation.md
---

## Register and render Button

Install the token and component packages, then register Button once:

```js
import "@stevegreco/design-system/css";
import { defineButton } from "@stevegreco/design-system-components/button";

defineButton();
```

Use `<ds-button>` for an action in the current view:

```html
<ds-button variant="primary">Save changes</ds-button>
```

Use a link when activation navigates to another location.

## Set form behavior deliberately

Button defaults to `type="button"`. Set the type when it participates in a form:

```html
<form>
  <!-- form fields -->
  <ds-button type="button" variant="secondary">Cancel</ds-button>
  <ds-button type="submit" variant="primary">Save changes</ds-button>
</form>
```

Use `type="reset"` only when restoring every form control to its initial value is the intended
behavior.

## Map intent to variants

- Use `primary` for the highest-emphasis action in the group.
- Use `secondary` for a visible supporting action.
- Use `ghost` for a low-emphasis contextual action.
- Use `danger` for a destructive or difficult-to-reverse action.

Apply the hierarchy to each action group, not to the page as a whole.

## Use the component contract

Load the published token stylesheet once at the application root. Button consumes its
`--component-button-*` contract and follows the active theme through semantic aliases.

Do not recreate Button states with product CSS. Use the published variants and sizes first. Treat
`::part(button)` as an escape hatch that requires a specific product need and design review.

## Handle labels and icons

Keep visible text when it is needed to understand the result. Mark a decorative icon hidden from
assistive technology. Provide `aria-label` when an icon is the only visible content.

## Handle unavailable actions

Use `disabled` only while the action is unavailable. When the reason is not apparent from the
surrounding fields or content, explain it nearby. Do not replace disabled behavior with a visual
style that still allows activation.
