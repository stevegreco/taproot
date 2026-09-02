---
id: guideline.button-review
schemaVersion: 1
type: guideline
title: Review button actions
summary: Check button semantics, hierarchy, labels, form behavior, accessibility, and token use.
status: draft
visibility: public
jobs:
  - review
tags:
  - accessibility
  - action
  - button
  - review
relations:
  reviews:
    - component.button
    - pattern.action-hierarchy
  related:
    - guideline.button-implementation
sources:
  - kind: authored
    path: packages/knowledge/content/guidelines/button-review.md
checks:
  - id: button-review-semantics
    level: error
    requirement: Button triggers an action in the current view; navigation uses a link.
  - id: button-review-hierarchy
    level: warning
    requirement: Each action group has no more than one primary Button.
  - id: button-review-danger
    level: error
    requirement: Danger is limited to destructive or difficult-to-reverse actions.
  - id: button-review-label
    level: warning
    requirement: The accessible label describes the result of the action.
  - id: button-review-form-type
    level: error
    requirement: Form buttons declare the type required by their intended behavior.
  - id: button-review-disabled
    level: warning
    requirement: Disabled actions cannot activate and have a clear reason when context does not explain it.
  - id: button-review-focus
    level: error
    requirement: Keyboard focus remains visibly indicated.
  - id: button-review-tokens
    level: warning
    requirement: Product styles do not recreate Button variants or interaction states.
---

Review the rendered interface and implementation. A source-only review cannot verify focus
visibility, interaction states, accessible names, or effective disabled behavior.

## Semantics

- Confirm each Button triggers an action in the current view.
- Confirm controls that navigate use links.
- Confirm status and metadata use non-action components such as Badge.

## Hierarchy

- Identify each independent action group.
- Confirm each group has no more than one primary Button.
- Confirm secondary and ghost actions have less emphasis than the primary path.
- Confirm danger indicates destructive or difficult-to-reverse behavior.
- In a destructive confirmation group, confirm danger replaces rather than competes with primary.

## Labels

- Confirm each visible or accessible label describes the result.
- Reject generic labels such as "Click here."
- Confirm icon-only Buttons have an accessible name.
- Confirm meaning remains understandable without color.

## Behavior

- Confirm form controls declare `button`, `submit`, or `reset` according to their intended behavior.
- Confirm submit behavior runs native constraint validation.
- Confirm disabled Buttons do not activate.
- Confirm a disabled action has a nearby explanation when its reason is unclear.

## Keyboard and focus

- Activate each Button with Enter and Space.
- Confirm keyboard focus remains visible.
- Confirm programmatic focus reaches the inner control when the product depends on it.

## Styling

- Confirm the application loads the published token stylesheet.
- Confirm product CSS does not recreate published variants, disabled styles, or interaction states.
- Require a documented product need before accepting customization through `::part(button)`.
