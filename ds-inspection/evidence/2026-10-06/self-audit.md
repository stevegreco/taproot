# Fresh-agent generation proof

Source access: CLI queries only. No repository file reads, listings, source searches, dependency installation, or repository mutation. Parent authorized the identical CLI entry `node packages/spec/bin/ds-spec.js` after `pnpm spec` stalled. Only output artifacts written under /private/tmp.

## Command trace

1. `pnpm spec get guideline.compose-or-propose` — stalled with no output.
2. `node packages/spec/bin/ds-spec.js get guideline.compose-or-propose` — read before markup.
3. `... search "form"` — discovered Button, Checkbox, Text field.
4. `... search "setup"` — no results.
5. `... get button --impl web` — package, element, registration, type/action mapping, variants, forms, stylesheet requirement.
6. `... get text-field --impl web` — registration, label/hint/name/type/autocomplete attributes, forms.
7. `... get checkbox --impl web` — registration, positive label, name/value, form submission.
8. `... get pattern.action-hierarchy#assign-emphasis` — primary task completion, secondary support.
9. `... search "tokens"` — Compose or propose and Link only.
10. `... --help` — enumerated CLI commands; no installation/bootstrap command.
11. `... list` — 14 records, none for system setup or token stylesheet consumption.
12. `... search "stylesheet"` — no results.
13. `... get example.action-hierarchy.settings --impl web` — correctly rejects non-component implementation; read example without impl instead.
14. `... tokens component.text-field --part field --resolve` — opaque primitive spacing token, no CSS import/export.
15. `... get link --impl web` — no stylesheet import/export.

Three intermediate calls briefly failed with ERR_MODULE_NOT_FOUND yaml during shared dependency changes; successful retries completed without changing dependencies.

## Self-audit

- PASS: Uses existing components; no new variant, invented component, custom part styling, focus recreation, or token overrides. `guideline.compose-or-propose#compose-first` and `#do-not-fork-a-component`.
- PASS: Each component package subpath, definition function, tag, and attribute is explicitly present in its web implementation. No invented component API.
- PASS: Visible field and checkbox labels satisfy `component.text-field#visible-label`, `#a11y-visible-label`, `component.checkbox#visible-label`, `#a11y-visible-label`; hint attribute provides association per `component.text-field#a11y-described-by`.
- PASS: Checkbox is for a value committed on later submit; positive label follows `component.checkbox#label-states-positive`; name/value are documented.
- PASS: Save is primary submit, Cancel secondary non-submit. `component.button#explicit-form-action`, `#label-describes-result`, `pattern.action-hierarchy#assign-emphasis`; settings example explicitly matches this pair. Ordering is a product choice; example does not define universal order.
- BLOCKED: Exact published tokens CSS package/export path cannot be discovered via available CLI records. Button web implementation requires loading it but does not give the import. No guessed path is used. Therefore the requested correct tokens CSS import is absent and the generated snippet is not ready for styling in a consuming bundler. This is a machine-readable bootstrap/documentation gap.
- LIMIT: Native form/h2/div/aria-labelledby are platform composition, not claimed DS APIs. Form field names and hint copy are product choices.
- LIMIT: Save persistence and Cancel behavior require product handlers; no endpoint, event detail, or cancellation API was invented. Snippet demonstrates component composition, not a finished settings product.
- LIMIT: No rendering/runtime test performed; proof tests generation from retrieval, with no package/source access.
