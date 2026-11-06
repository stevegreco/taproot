---
"@taproot-ds/tokens": minor
"@taproot-ds/web-components": patch
"@taproot-ds/spec": minor
---

Control sizes come from tokens. A new semantic token, `semantic.indicator.width` (2px), sets the
thickness of a selection bar such as the selected tab's underline. Checkbox, Radio group, Switch,
and Tabs bind their box, dot, track, thumb, and indicator sizes in their spec records, and the web
components read those tokens instead of fixed pixel values. The Switch track is now 32 by 20
instead of 32 by 18, with the thumb centered; the other controls look the same.
