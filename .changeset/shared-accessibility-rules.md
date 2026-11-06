---
"@taproot-ds/spec": minor
"@taproot-ds/web-components": patch
---

A new `guideline.accessibility` defines the shared accessibility rules once: `visible-focus`,
`forced-colors`, `not-color-alone`, and `not-a-control`. Every component follows it and narrows a
rule with `extends` only to name its own parts. Rules that restated the guideline are gone, and
some addresses changed: `component.checkbox#state-not-color-alone`,
`component.switch#state-not-color-alone`, and `component.badge#text-communicates-state` are now
each component's `#not-color-alone`, and `pattern.form-field#visible-focus` is
`guideline.accessibility#visible-focus`.

Button, Badge, and Text field gain forced-colors rules, and the web components meet them. Under
forced colors, Button's primary and destructive variants fill with the system highlight, secondary
is outlined, and tertiary is text alone, so emphasis no longer disappears. Badge keeps a visible
boundary, and Text field draws its boundary, focus, and disabled state in system colors like Text
area.
