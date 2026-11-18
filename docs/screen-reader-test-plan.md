# Screen reader test plan

Automated checks (axe in CI, the unit tests) prove that roles and attributes are present. They
cannot prove that a component makes sense when heard. This checklist covers that for the overlay
and form components, where the most can go wrong. Each check cites the spec rule it confirms.

Run it when a component on this list changes how it is named, described, focused, or announced,
and before a release that adds one. Record each run in [Runs](#runs).

## Setup

- **Primary:** VoiceOver with Safari on macOS. Turn VoiceOver on with Cmd+F5. VO means
  Control+Option.
- **Second, when you can:** NVDA with Firefox or Chrome on Windows. Use browse mode to read and
  focus mode to operate controls.
- Start Storybook with `pnpm exec turbo run dev --filter=storybook` and open each story in its own
  frame, for example `http://localhost:6006/iframe.html?id=components-dialog--default`. The frame
  leaves out the Storybook interface, so the screen reader hears only the component.
- Move with Tab and Shift+Tab, as a keyboard user would, and with VO+Right Arrow (or NVDA's Down
  Arrow), as a screen reader user reading the page would. A check passes only when both ways work.
- Write down what was spoken, in short form, for any check that fails or sounds odd.

## Form controls

These apply to Text field, Text area, Checkbox, Radio group, Select, Switch, and Slider. Use the
Default, WithHint, WithError, Disabled, and (where it exists) Required stories.

| # | Check | Rule |
| --- | --- | --- |
| F1 | Focusing the control speaks the visible label as its name, then its role. | `pattern.form-field#label-is-name` |
| F2 | The hint is spoken after the name, as a description. | `pattern.form-field#described-by-hint-and-error` |
| F3 | With an error, the control is spoken as invalid, and the error text is spoken. | `pattern.form-field#error-marks-invalid`, `pattern.form-field#described-by-hint-and-error` |
| F4 | A required control is spoken as required. | `pattern.form-field#required-announced` |
| F5 | A disabled control is spoken as dimmed or unavailable, and cannot be changed. | `pattern.form-field#disabled-prevents-interaction` |
| F6 | Placeholder text, where present, is not spoken as the name. | `pattern.form-field#visible-label` |

Then the checks for each control:

| # | Component | Check | Rule |
| --- | --- | --- | --- |
| T1 | Text area | Readonly is spoken as read-only, and the value can still be read and selected. | `component.text-area#readonly-keeps-value` |
| C1 | Checkbox | Space toggles it, and the new state (checked or unchecked) is spoken. | `component.checkbox#toggle-on-activate` |
| C2 | Checkbox | The Indeterminate story is spoken as mixed. | `component.checkbox#mixed-state` |
| R1 | Radio group | Entering the group speaks the group label, then the focused option's name, its state, and its position (for example "2 of 3"). | `component.radio-group#accessible-group` |
| R2 | Radio group | Arrow keys move to the next option, check it, and speak it. They wrap at the ends. Tab leaves the group in one press. | `component.radio-group#keyboard-selection` |
| R3 | Radio group | The hint and error are spoken when entering the group. | `component.radio-group#accessible-group` |
| S1 | Select | Focusing it speaks the label, the role, and the selected choice. | `pattern.form-field#label-is-name` |
| S2 | Select | Opening the list and moving through it speaks each choice. A disabled choice is spoken as unavailable. | `component.select#named-choices` |
| W1 | Switch | It is spoken as a switch (not a checkbox), with its state, on or off. | `component.switch#toggle-on-activate` |
| W2 | Switch | Space toggles it, the new state is spoken, and the name stays the same. | `component.switch#stable-visible-label` |
| L1 | Slider | Focusing the thumb speaks the label, the role, and the same value text shown on screen. | `component.slider#value-shown` |
| L2 | Slider | Arrow keys, Page Up, Page Down, Home, and End change the value, and each new value is spoken. | `component.slider#keyboard-steps` |
| L3 | Slider | In the RightToLeft story, Right Arrow still raises the value, and the spoken value matches the display. | `component.slider#keyboard-steps` |

## Overlays

### Dialog

Use the Default, WithoutDescription, and ExplicitCloseOnly stories. Open the dialog from its
trigger with the keyboard.

| # | Check | Rule |
| --- | --- | --- |
| D1 | On opening, focus lands on the title (or the control the story names), and the screen reader speaks the dialog's role and title. | `component.dialog#initial-focus`, `component.dialog#accessible-modal` |
| D2 | The description is spoken once on opening. In WithoutDescription nothing extra is spoken. | `component.dialog#accessible-modal` |
| D3 | Tab and Shift+Tab stay inside the dialog. | `component.dialog#contain-focus` |
| D4 | Reading with VO+Right Arrow (or NVDA's Down Arrow) does not leave the dialog for the page behind it. | `component.dialog#accessible-modal` |
| D5 | Closing (Escape, or the close control) returns focus to the trigger, and the trigger is spoken. | `component.dialog#restore-focus` |
| D6 | In ExplicitCloseOnly, Escape leaves the dialog open, and its close action is reachable and spoken by name. | `component.dialog#cancellation`, `component.dialog#explicit-exit` |

### Tooltip

Use the Default and Toolbar stories.

| # | Check | Rule |
| --- | --- | --- |
| P1 | Focusing the trigger speaks the tooltip's label as the trigger's name. | `component.tooltip#label-names-trigger` |
| P2 | The label is spoken once. The bubble is not read again as separate text when it appears, or when reading on past the trigger. | `component.tooltip#label-names-trigger` |
| P3 | Escape closes the bubble, focus stays on the trigger, and nothing new is spoken. | `component.tooltip#escape-closes` |

## Runs

Record each run here, newest first. Write pass, fail, or n/a for each check, and link an issue for
each failure. A run need not cover every row, but it says which ones it skipped.

| Date | Version or commit | Screen reader and browser | Who | Result | Issues |
| --- | --- | --- | --- | --- | --- |
| | | | | | |
