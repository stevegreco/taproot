---
id: pattern.action-hierarchy
schemaVersion: 1
type: pattern
title: Action hierarchy
summary: Assign button emphasis according to an action's importance, support role, and risk.
status: draft
visibility: public
jobs:
  - design
  - implement
  - review
tags:
  - action
  - button
  - hierarchy
  - destructive
relations:
  uses:
    - component.button
  related:
    - guideline.button-implementation
    - guideline.button-review
sources:
  - kind: authored
    path: packages/knowledge/content/patterns/action-hierarchy.md
---

Action hierarchy helps a person identify the next action without making every available action
equally prominent.

## Define the action group

An action group contains controls that resolve the same decision or task. A page can contain more
than one action group when the groups act on independent subjects.

Use one `primary` Button for the highest-emphasis action in a group. Do not treat this as a rule that
allows only one primary action on an entire page.

## Assign emphasis

### Primary

Use `primary` for the action that advances or completes the current task. Prefer one primary Button
per action group.

### Secondary

Use `secondary` for a supporting action that should remain visible. It can offer an alternative,
return to the prior state, or dismiss the current task without competing with the primary action.

### Ghost

Use `ghost` for a low-emphasis action that remains discoverable in context. Do not use it for the
main path through a task.

### Danger

Use `danger` only for a destructive or difficult-to-reverse action. Danger communicates risk rather
than hierarchy. In a destructive confirmation group, danger can be the highest-emphasis action and
replaces the primary action.

Do not use danger styling for an error status, warning message, or action that merely needs more
attention.

## Separate unrelated decisions

Place destructive account or data management actions in their own labeled group. Do not mix a
destructive action into a routine save or cancel group when it operates on a different subject.

## Use clear labels

Name the result of each action. Labels such as "Save changes," "Discard draft," and "Delete account"
make the hierarchy understandable without relying on color.

## Avoid

- More than one primary Button in the same action group
- A primary and a danger Button competing as terminal actions in one confirmation group
- Danger styling used only to attract attention
- Ghost styling for the action required to finish the task
- Disabled actions with no nearby explanation when the reason is unclear
- Relying on control order or color as the only expression of importance or risk
