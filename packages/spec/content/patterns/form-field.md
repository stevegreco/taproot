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
rules:
  - id: visible-label
    level: must
    topic: content
    statement: Provide a visible label that names the value. Placeholder text is not a label.
    examples:
      do:
        - Email address
      avoid:
        - Enter email
  - id: hint-adds-information
    level: should
    topic: content
    statement: Use a hint only for format, purpose, or consequence that the label does not already state.
  - id: error-says-what-to-fix
    level: must
    topic: content
    statement: Write the error as what to fix.
    examples:
      do:
        - Enter an email address with an @ sign
      avoid:
        - Invalid
  - id: explain-disabled
    level: should
    topic: content
    statement: When the reason a control is unavailable is not obvious, explain it nearby.
  - id: error-marks-invalid
    level: must
    topic: behavior
    statement: A non-empty error marks the control invalid, and clearing the error removes that state.
  - id: clear-error
    level: should
    topic: behavior
    statement: >-
      Clear the error when the person edits the value, and on form reset, which restores the value
      but leaves the error.
  - id: error-blocks-submit
    level: must
    topic: behavior
    statement: While a non-empty error is set, the control blocks its form from submitting.
  - id: required-blocks-submit
    level: must
    topic: behavior
    statement: A required control with no value blocks its form from submitting.
  - id: disabled-prevents-interaction
    level: must
    topic: behavior
    statement: Disabled prevents interaction from pointer and keyboard.
  - id: disabled-submits-nothing
    level: must
    topic: behavior
    statement: A disabled control submits nothing.
  - id: form-value
    level: should
    topic: behavior
    statement: Inside a form, the control's value submits under its name, and reset restores the initial value.
    applicability: The control belongs to a form.
  - id: label-is-name
    level: must
    topic: accessibility
    statement: The visible label is the control's accessible name.
  - id: described-by-hint-and-error
    level: must
    topic: accessibility
    statement: >-
      The hint and the error are associated with the control, so assistive technology reads them as
      its description.
  - id: invalid-not-color-alone
    level: must
    topic: accessibility
    statement: The invalid state always includes the error text, so meaning never depends on color alone.
  - id: required-announced
    level: must
    topic: accessibility
    statement: A required control is announced as required, and shows it by more than color.
  - id: visible-focus
    level: must
    topic: accessibility
    statement: Keyboard focus stays visible in every state, including under forced colors.
---

Text field, Text area, Select, Checkbox, Switch, Radio group, and Slider follow this pattern and
inherit the rules above. Each keeps only the rules about its own control. It narrows a rule where its
control differs, such as what its value is, and waives one that cannot apply, with the reason.

## Label, hint, and error

The label says what the value is. The hint says what the label cannot, such as a format or a
consequence. The error says how to fix what was entered. Assistive technology reads the label as the
control's name and the hint and error as its description, so each must make sense on its own.

## Switch and forms

Switch applies its setting immediately, without a separate submit action. It can also submit with a
form, so these rules apply to it. Use Checkbox when the choice takes effect only when the form is
submitted.
