---
"@taproot-ds/spec": minor
---

Patterns and guidelines can declare `rules`, and a component inherits the rules of each record in its `links.follows`. A component rule narrows an inherited one with `extends` or sets it aside with `waived`, and `validate` checks both. `rules --id <component>` and `get` list inherited rules at their own addresses. `pattern.form-field` now carries the shared form rules, so every form component, Text field included, has rules to review against.
