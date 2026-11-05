---
"@taproot-ds/spec": minor
---

`spec.config.json` takes a `vocabulary`: concepts such as size or status, each with its words, an
optional parameter name limited to them, and aliases that point other words at the word to use.
`validate` reports an enum value that strays from it, with the file, line, and the word to use.
