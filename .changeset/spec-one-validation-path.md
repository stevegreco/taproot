---
"@taproot-ds/spec": minor
---

One set of checks for `validate` and the snapshot build, and answers that say when they are incomplete.

- `taproot validate` now also checks every implementation file against its component record, and the snapshot build for the hosted MCP server now also checks token references, vocabulary, and constants. Both run the same checks through the new `checkFromConfig`, so a deploy can no longer serve a token that does not exist, and `validate` catches a broken mapping.
- A record whose only issues are `TODO:` placeholders, or links to a record that was left out, now loads instead of being left out. `get` says which fields are unfinished and which linked records are missing. Issues of these kinds carry `kind: "placeholder"` or `kind: "dependency"`.
- When a pattern or guideline a component follows is left out, `rules` starts with `INCOMPLETE:`, names the missing rules, and fails with the new `ERR_INCOMPLETE_RULES` (exit code 1 from the CLI, with the rules found under `results` in JSON), instead of returning a shorter list as if it were complete.
- The local MCP server starts and reloads with invalid record files left out and named in a warning on every answer, as the CLI does, instead of refusing to start or serving the last valid version.
- New exports: `checkFromConfig` from `@taproot-ds/spec/config`; `findImplementationProblems` and `readImplementationFolder` from `@taproot-ds/spec/implementation`; `spec.gaps(id)` on a loaded spec.
