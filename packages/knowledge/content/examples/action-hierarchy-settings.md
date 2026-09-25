---
id: example.action-hierarchy.settings
type: example
title: Settings action hierarchy
summary: A settings screen separates routine profile actions from destructive account deletion.
status: draft
jobs:
  - design
  - implement
  - review
tags:
  - action
  - button
  - destructive
  - settings
relations:
  demonstrates:
    - pattern.action-hierarchy
    - guideline.button-implementation
    - guideline.button-review
  uses:
    - component.button
assets:
  - id: example.action-hierarchy.settings.light
    path: packages/knowledge/content/examples/assets/action-hierarchy-settings.svg
    mediaType: image/svg+xml
    width: 960
    height: 640
    alt: Account settings screen with a secondary Cancel button and primary Save changes button in the profile form, followed by a separate danger zone containing a Delete account button.
annotations:
  - id: profile-actions
    label: Routine action group
    description: Cancel supports the task and Save changes completes it, so the group uses secondary and primary emphasis.
    relatesTo:
      - pattern.action-hierarchy
  - id: danger-zone
    label: Destructive action group
    description: Delete account acts on a different subject and is separated into a labeled danger zone.
    relatesTo:
      - pattern.action-hierarchy
  - id: outcome-labels
    label: Outcome-based labels
    description: Save changes and Delete account state their results without relying on color.
    relatesTo:
      - component.button
---

This account settings screen contains two independent action groups.

The profile form pairs a secondary "Cancel" action with one primary "Save changes" action. The
primary action completes the routine editing task.

Account deletion is destructive and operates on a different subject. A labeled danger zone
separates it from the profile form. Its supporting text explains the consequence before the person
reaches the danger Button.

![Account settings action hierarchy](assets/action-hierarchy-settings.svg)

## What this example demonstrates

- Hierarchy applies within an action group rather than across the whole page.
- A supporting action remains visible without competing with the primary path.
- A destructive action is separated from routine actions.
- Button labels name their results.
- Text and structure communicate purpose and risk without relying on color.

## What this example does not decide

The example does not define universal button ordering. Products must follow their established
reading direction and platform convention while preserving the semantic hierarchy.
