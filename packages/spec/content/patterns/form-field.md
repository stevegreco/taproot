---
id: pattern.form-field
type: pattern
title: Form field
summary: Give every form control the same label, hint, error, required, disabled, and form behavior.
tags:
  - form
  - field
  - label
  - error
  - validation
---

Text field, Text area, Select, Checkbox, Switch, and Radio group share the guidance below. Each
component record keeps only the rules about its own control, such as what its value is.

## Label

Provide a visible label that names the value. The label is the control's accessible name.
Placeholder text is not a label. Write "Email address", not "Enter email".

## Hint

Use a hint for format, purpose, or consequence that the label does not already state. The hint is
associated with the control, so assistive technology reads it as the description.

## Error

Write the error as what to fix: "Enter an email address with an @ sign", not "Invalid".

- A non-empty error marks the control invalid, and clearing the error removes that state.
- While a non-empty error is set, the control blocks its form from submitting.
- The error is associated with the control, so assistive technology reads it as the description.
- The invalid state always includes the text message. Meaning never depends on color alone.

## Required

A required control is announced as required, and shows it by more than color. A required control
with no value blocks its form from submitting.

## Disabled

Disabled prevents interaction from pointer and keyboard, and a disabled control submits nothing.
When the reason a control is unavailable is not obvious, explain it nearby.

## Form value

Inside a form, the control's value submits under its name, and reset restores the initial value.
Each component says what its value is, such as the checked option of a Radio group.

## Focus

Keyboard focus stays visible in every state, including under forced colors.

## Switch and forms

Switch applies its setting immediately, without a separate submit action. It can also submit with a
form, so the guidance on this page applies to it. Use Checkbox when the choice takes effect only
when the form is submitted.
