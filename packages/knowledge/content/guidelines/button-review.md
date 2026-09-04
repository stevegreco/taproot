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
