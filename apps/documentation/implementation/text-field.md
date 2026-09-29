---
id: guideline.text-field-implementation
type: guideline
title: Implement text fields
summary: Implement a labeled text field with hint, error, and form submission.
tags:
  - form
  - implementation
related:
  - component.text-field
docsSections:
  behavior:
    section: set-form-behavior-deliberately
    heading: Forms
---

## Register and render Text field

Install the token and component packages, then register Text field once:

```js
import "@stevegreco/design-system/css";
import { defineTextField } from "@stevegreco/design-system-components/text-field";

defineTextField();
```

## Set form behavior deliberately

Text field defaults to `type="text"`. Set `name` so the value is included when the form submits.
Pair it with Button to submit:

```html
<form>
  <ds-text-field label="Email" name="email" type="email" autocomplete="email" required></ds-text-field>
  <ds-button type="submit">Continue</ds-button>
</form>
```

A non-empty `error` marks the field invalid, associates that message with the control, and blocks
submit until the message is cleared. Clear `error` when the person edits the value. Use `hint` for
guidance that is not an error.
