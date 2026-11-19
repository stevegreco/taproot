---
"@taproot-ds/spec": patch
---

`get <address> --json` and `spec.section()` give a rule that extends another the `level` and `topic` it inherits, as `rules` does. Before, the JSON had only `id`, `extends`, and `statement`, so a reader could not tell how strong the rule was.
