---
"@stevegreco/design-system-spec": minor
"@stevegreco/web-components": patch
---

`validate` no longer rejects a token reference for naming a color, radius, or border primitive. The
format leaves token tiers to the adopter, so this system's rule moved to its own content test. Button's
implementation guidance now leaves variant and disabled guidance to the spec.
