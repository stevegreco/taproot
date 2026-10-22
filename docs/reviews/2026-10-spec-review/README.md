# Spec review: judged findings

October 22, 2026. Reviewed at main `eacd841`.

Three isolated reviews ([structure](structure-review.md), [consistency](consistency-review.md),
[usability](usability-review.md)) were verified against the repo, merged, and ranked here. This
file is the one to act on. The three source reviews are kept for their full evidence.

## Verdict

The spec format is sound and validates cleanly, so this first iteration needs consolidation, not new machinery. Three reviewers (structure, consistency, usability) raised 43 findings at main `eacd841`. After checking each against the repo, 14 survive, merged into the ranked list below; 3 were real factual errors in the spec.

Do these five first. Together they are roughly two days of work and add no new tooling:

1. Fix the three token maps that contradict the stylesheets and tokens ADR 0003 (item 1).
2. Move the 11 copied form-field rules into one `pattern.form-field` (item 2).
3. Add a short Conventions section to SPEC.md and rename the outliers in one sweep (item 3).
4. Give patterns and guidelines a template, and say in one sentence what a recipe is (item 4).
5. Make SPEC.md the only field reference, and fix the stale ADR link and the wrong AGENTS.md line (item 5).

All three reviewers independently named the form-field duplication, and two named the rule-id drift and the implementation files that restate the spec. Those agreements are the strongest signals in the review.

## Ranked findings

Ranked by impact on the spec being a trustworthy single source of truth, then by effort. Every item below was checked in the repo. Effort: XS is under an hour, S is a few hours, M is about half a day. Line numbers are as of `eacd841`.

| # | Problem | Evidence | Fix | Effort | Raised by |
| --- | --- | --- | --- | --- | --- |
| 1 | Three token maps are factually wrong. They name primitives where the stylesheet uses a semantic token, and their rationale claims no semantic token exists. | `checkbox.spec.yaml:223` uses `primitives.radius.xs`, but `checkbox.css:56` uses `semantic.radius.compact`. `alert.spec.yaml:249` and `dialog.spec.yaml:154` use `primitives.weight.semibold`, but `alert.css:77` and `dialog.css:35` use `semantic.typography.title`. This breaks tokens ADR 0003. | Point the three records at the semantic tokens and rewrite their rationale entries. | XS | Consistency |
| 2 | Eleven form-field rules are copied into four records, and the copies have drifted. | The same 11 rule ids (`visible-label`, `hint-adds-guidance`, `error-*`, `form-value`, `a11y-*`) appear in text-field, text-area, select, and checkbox. Only text-field (lines 103, 143) says placeholder text is not a label. Switch and radio-group carry partial copies under other ids. | Add one `pattern.form-field` with a section per shared rule. Each field component adds `links.follows: [pattern.form-field]` and keeps only its own rules. No schema change. State Switch's stance there: it applies immediately and can also submit with a form. | M | All three |
| 3 | The same idea is named several ways, which breaks `spec rules` queries and citations. | Visible focus has 3 rule ids and forced colors has 5. The `a11y-` prefix is in 7 records and missing from 5. `label` is visible text in 8 records but a hidden name in Tabs and Icon, where Button uses `accessibleName`. Button sizes are `sm`/`md`, Icon sizes are `small`/`medium`/`large`. Radio's rationale says "selected" for its `checked` state. | Add a Conventions section of about ten lines to SPEC.md: rule-id prefix, shared rule ids, `label` versus `accessibleName`, size values, parameter casing, and the extra token values and properties in use (`inherit`, `shadow`, `size`). Rename the outliers in one pass, while there are only 13 records. The Icon size rename changes its web attribute values, so note it in the changelog. | M | All three |
| 4 | Only components have an authoring path. Patterns, guidelines, and examples start from a blank file, and "recipe" is not defined. | `.agents/skills/` and `scripts/component-new.mjs` cover components only. SPEC.md gives front matter for the Markdown types but no body headings. The schema's `type` enum has no recipe. | Add one short template per Markdown type, with suggested headings. Add one sentence to SPEC.md saying a recipe is a pattern (or an example), not a new type. Skip a generic scaffold command for now. | S | Usability |
| 5 | The format is described in four places, and two of them are wrong. | `docs/adr/0002-record-format.md:7` links to the removed `packages/knowledge/SPEC.md` and restates an outdated field list. `AGENTS.md:38` says nothing checks an implementation, but `checkImplementation` checks the API mapping. Root README leads with tokens, not the spec. | Make SPEC.md the only field reference. Cut ADR 0002 to decisions, fix its link, and mark RFC 0002 as historical. Correct the AGENTS.md line to say the API mapping is checked and behavior and styling are not. Add a three-row Start here table to the spec README and link it from the root README. | S | Structure, Usability, Consistency |
| 6 | Implementation files restate spec guidance, so the docs page can disagree with the spec. | `apps/documentation/implementation/button.md` restates the variant meanings and the `explain-disabled` rule. Commit `5cbe6d9` already fixed Alert by citing rule ids. | Apply the Alert approach to the other 12 files: keep web-only content and cite rule addresses. Add one line to the implement-component skill. | M | Structure, Usability |
| 7 | Token maps do not say how conditions combine, and records handle collisions two ways. | SPEC.md Tokens says the map "defines no rule for combining conditions". Checkbox writes `checked + hover`; Switch and Radio explain precedence in prose, so `spec tokens switch --condition "checked + hover"` returns nothing. | Write the rule Button already follows into SPEC.md: a condition lists only what changes from `base`, and a combination is written only where two conditions collide. Convert Switch and Radio's prose precedence to combinations. | S | Usability, Consistency |
| 8 | No record maps border width or focus-ring width and offset, though every stylesheet uses them. | No `*.spec.yaml` references `semantic.border.width`, `semantic.focus.width`, or `semantic.focus.offset`; 12 stylesheets do. | Add one sentence to SPEC.md: system-wide constants such as border and focus-ring width are not mapped per component. | XS | Consistency |
| 9 | `summary` and `description` are both required and usually say the same thing. | Button: "Use Button to trigger an action or to submit or reset a form." and "Triggers an action or submits or resets a form." Link, Badge, and the fields repeat the pattern. | Make `description` optional, for when it adds something, as in Dialog and Tabs. Removing a required field keeps every record valid. | S | Structure, Usability |
| 10 | Two records use flow-style YAML, unlike the other 11. | `switch.spec.yaml` and `radio-group.spec.yaml` write rules as `- { id: …, }` maps; parts of Dialog do too. | Convert them to block style. No new lint rule. | XS | Structure, Consistency |
| 11 | SPEC.md refers to checklist ids for `covers` but never lists them. | The ids live only in `scripts/component-status.mjs`, `CHECKLIST`, line 31. | Add one line to SPEC.md naming where the list lives, or list the ids. Do not backfill older records yet. | XS | Consistency |
| 12 | Search answers with confidence when nothing fits. | The usability reviewer ran `spec search "empty state"` (form fields came back) and `"loading spinner"` (Alert came back), each with a next-step line. Not rerun by the judge. | When the top score is weak, print "No strong match" and point to `guideline.compose-or-propose`. | S | Usability |
| 13 | Radio group's label uses the wrong type style, and its option labels have no part or tokens. | The group label uses `body.md`; text-field, text-area, and select use `label.md`. | Use `label.md` for the group label and add an `option-label` part, matching Checkbox and Switch. | XS | Consistency |
| 14 | Badge has two pairs of overlapping rules and no link to Icon. | `non-interactive` and `a11y-not-a-control` say the same thing, as do `a11y-no-live-region` and `a11y-surrounding-ui-announces`. Badge has an optional icon but no `composes: component.icon`. | Merge each pair and add the link. | XS | Consistency |

Polish to take when you are already in a file: separators in rendered parameter rows, sentence case for plain-text `instead` values, a short name in `accessibility.role`, and a one-line "paths predate the rename" note on the research docs.

## Decisions

Where reviewers disagreed or a fix changes how the work is done, the judge picked the simpler option. Each is open to overrule.

| Question | Reviewers said | Call | Why |
| --- | --- | --- | --- |
| Should patterns and guidelines get a `rules` list? | Usability: yes, and the form-field fix needs it. Structure: no schema change needed. | Not now. | Pattern sections are already citable by address, as `component.button#follow-action-hierarchy` cites `pattern.action-hierarchy#assign-emphasis`. Item 2 works without a schema change. Revisit if `spec rules` missing pattern guidance becomes a real problem. |
| Should token maps stay in the spec or move to the implementation file? | Usability: move them, or cut them down. Consistency: they are incomplete and should grow. | Keep them in the spec, and adopt the override rule in item 7. | They are the design and engineering contract for tokens, and validation already resolves every reference. They run from 6% (Icon) to 32% (Button) of a record, not the 25 to 35% the usability review reported. |
| Write state combinations explicitly or in prose? | Consistency: explicit everywhere. Usability: write only differences. | Both, through item 7: only differences, plus a combination where two conditions collide. | Queryable without spelling out every pairing. |
| Map border and focus-ring width per component? | Consistency: map them, or declare them out of scope. | Declare them out of scope (item 8). | One sentence instead of about 30 new lines across 12 records, and the tokens package already owns them. |
| Should `status` stop depending on the web implementation? | Usability: decouple, so an approved spec can land on main before any code. | Keep the current flow unless design sign-off on main is wanted. | The test only fails when a draft has an implementation or a stable record has none, so a draft can already merge alone. What couples them is the one-PR, three-phase process from `d8030ba`. For spec-only merges, the change is one paragraph in AGENTS.md and the spec-component skill. |

## Dropped or downgraded

These findings were wrong, overstated, or add more complexity than they remove.

| Finding | Reviewer | Outcome | Reason |
| --- | --- | --- | --- |
| Backfill the decide-what-it-ships checklist on Badge, Link, Text field, and Button | Consistency (High) | Downgraded to item 11 | It is process tracking from a script, not a false statement in the spec. Defining where the ids live is enough for now. |
| Add a test that a component's CSS variables match its token map | Consistency | Deferred | Worth it once the format settles. Fix item 1 by hand first. |
| Add a YAML lint rule against flow maps | Structure, Consistency | Dropped | Converting two files is enough; a new rule is more config to keep. |
| Add a generic `spec new <type>` scaffold | Usability | Dropped for now | A template file per type covers it with no code. |
| Flatten the one-file component folders | Structure | Dropped | Harmless, and the folders can hold assets later. |
| Add a shared list to the token config | Structure | Dropped | There are only two themes. |
| Shrink the link model | Usability | Folded into item 5 | The model works. The Start here table can show only `follows` and `related`. |
| Skills live in three tool folders | Usability | Dropped | `.claude/skills/` already symlinks to `.agents/skills/`. Only `verify-design-system` is Cursor-only. |
| Switch contradicts itself about forms | Consistency | Folded into item 2 | Applying immediately and submitting with a form can both be true. The pattern says so once. |
| Make sources uniform | Consistency | Dropped | Low value. Remove the field from records where it only repeats the ADR, if you touch them. |
