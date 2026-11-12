---
"@taproot-ds/spec": minor
---

Smaller fixes from a review of the spec package.

- `spec.config.json` is checked against a JSON Schema, exported as `@taproot-ds/spec/schema/spec-config.json`. Point `$schema` at it for checks and completion in an editor. Every problem in the file is reported at once, and some messages are worded differently, such as `"content" must be a string`.
- `taproot rules` takes a record id or name as an argument, as `get`, `links`, and `tokens` do: `taproot rules checkbox`. `--id` still works.
- `TOKEN_KEYWORDS` and `TOKEN_PROPERTIES` are exported from the package root.
