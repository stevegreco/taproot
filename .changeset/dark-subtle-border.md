---
"@taproot-ds/tokens": patch
"@taproot-ds/spec": patch
---

Raise the dark theme's `border.subtle` from `gray.800` to `gray.700`, so it measures 1.38:1 on
`background.surface` instead of 1.06:1 and a Divider inside a Card is visible. On
`background.default` it goes from 1.45:1 to 1.89:1. Divider's spec drops the known issue.
