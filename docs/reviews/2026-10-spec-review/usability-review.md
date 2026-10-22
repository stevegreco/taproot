# Spec review: usability

Lens: how easily a designer, engineer, or AI agent can author a new spec (component, guideline, pattern, recipe) and consume existing ones as the single source of truth. Reviewed at `main` @ eacd841. No repo changes made. CLI was run (`pnpm spec validate/list/search/get/rules`).

## What already works well (keep)

- Consumption for agents is strong: `pnpm spec get button` by plain name, typo-tolerant search, addressable rules (`component.button#label-describes-result`), `--impl web`, `--json`, MCP server with `spec://` resources (packages/spec/README.md, CLI and MCP sections).
- Validation is friendly: one command, file + line + JSON pointer, `TODO:` placeholders flagged (SPEC.md, Cross-record checks). `validate` passes: 16 records, no issues.
- Component authoring has a real path: three skills plus `pnpm component:new/status` (AGENTS.md; .agents/skills/spec-component/SKILL.md).
- Draft-first component flow keeps the proposal small (SPEC.md, Status).

## Findings (most severe first)

### 1. HIGH: Only components have an authoring path; patterns, guidelines, examples (and "recipes") do not
- Evidence: `.agents/skills/` has spec-component, implement-component, document-component, design-tokens; none for pattern, guideline, or example. `scripts/component-new.mjs` scaffolds components only. SPEC.md "Pattern, guideline, and example records" gives front matter fields but no body structure. The project goal names "recipe", but the type enum is `component | pattern | guideline | example` (spec-record.schema.json line 14); "recipe" only appears in tokens docs (typography recipes).
- Impact: The spec is meant to be the starting point for any design system work, but a designer writing a pattern starts from a blank Markdown file with no template, no expected headings, and no review flow. Patterns will drift in shape, which hurts agents that consume them by section.
- Fix: Add one short template per Markdown type (suggested headings: pattern = Problem / Solution / When not to use / Avoid; guideline = Principle / Do / Don't), and generalize the scaffold to `pnpm spec new <type> <name>`. Decide explicitly whether "recipe" is a pattern, an example, or a new type, and write that one sentence into SPEC.md.

### 2. HIGH: Shared form-field rules are copy-pasted across records
- Evidence: 11 rule ids appear identically in text-field, text-area, select, and checkbox (and partly radio-group, switch): `visible-label`, `hint-adds-guidance`, `form-value`, `error-says-what-to-fix`, `error-marks-invalid`, `error-blocks-submit`, `a11y-visible-label`, `a11y-required`, `a11y-invalid-message`, `a11y-described-by`, `a11y-visible-focus`. Statements are word-for-word (e.g. text-field.spec.yaml:117 and select.spec.yaml:108).
- Impact: Changing one form rule means editing 4 to 6 files by hand; nothing checks they stay in sync. This is the biggest maintenance cost in the corpus and grows with every new field component.
- Fix: Add `pattern.form-field` holding the shared guidance and have each field component reference it (`links.follows`, rule `references`). Minimal v1: keep component-specific rules in components, move the shared ones to the pattern.

### 3. MEDIUM: Pattern and guideline guidance is not addressable as rules
- Evidence: `rules` exist only on component records (schema `allOf`, component branch). The action-hierarchy "Avoid" list (patterns/action-hierarchy.md) and the compose-or-propose "Do not fork" list are prose. `pnpm spec rules --topic content` returns only component rules.
- Impact: An agent or reviewer asking "what must I follow?" via `rules` misses all cross-component guidance. This also blocks the fix for finding 2.
- Fix: Allow an optional `rules` list in pattern/guideline front matter with the same shape, or make a heading section citable as a rule. Pick one; the first is simpler.

### 4. MEDIUM: Search returns confident wrong answers when nothing fits
- Evidence: `pnpm spec search "empty state"` returns checkbox, text-area, text-field, select, radio-group. `pnpm spec search "loading spinner"` returns Alert. Each is followed by a "→ get … --impl web" next-step line, exit code 0.
- Impact: An agent looking for a component that does not exist is steered to reuse a wrong one, which is the opposite of compose-or-propose.
- Fix: When the top score is weak, say "No strong match" and point to `guideline.compose-or-propose`. Expose that in `--json` (e.g. `confidence: low`).

### 5. MEDIUM: Spec facts are restated in implementation files, unchecked
- Evidence: apps/documentation/implementation/button.md "Map intent to variants" restates pattern.action-hierarchy; "Handle unavailable actions" restates `component.button#explain-disabled`. AGENTS.md says "Nothing checks an implementation against a spec, so keep the two consistent in review." Commit 5cbe6d9 already moved Alert to citing rule ids instead.
- Impact: Two sources of truth for usage guidance; the docs page can disagree with the spec.
- Fix: Apply the Alert approach to every implementation file: web-only guidance plus rule addresses. Optionally have `checkImplementation` warn on long prose sections that cite no address.

### 6. MEDIUM: Lifecycle status is tied to the web implementation
- Evidence: SPEC.md Status: "The docs tests fail if a draft has an implementation file, or if a component that is not a draft has none." spec-component SKILL: three phases share one PR that merges only after docs.
- Impact: The spec claims to be technology-neutral and the agreement point between design and engineering, but a contract cannot be marked agreed until web code and docs exist. A designer cannot land an approved spec on main on their own.
- Fix: Let `status` mean contract maturity only (draft, stable, deprecated), and report implementation coverage separately (`component:status` already can). Allow the spec PR to merge on its own.

### 7. MEDIUM: Entry points are scattered and the format doc mixes author and tool concerns
- Evidence: Root README.md leads with tokens install; the spec gets one paragraph. The real guide is AGENTS.md. SPEC.md (319 lines) includes tool-level detail an author rarely needs (slug collision algorithm `foo-1-1`, inverse-link derivation, four implicit link sources). Reasoning is split across ADR 0001-0003 and RFC 0002 (446 lines), described as "written when the spec was called the knowledge layer".
- Impact: A designer opening the repo does not find "how do I write a spec" quickly; a new contributor reads tool internals to learn the format.
- Fix: One short "Start here" section (top of packages/spec/README.md, linked from root README) with a task table: "write a component / pattern / guideline", "look something up", "validate". Move slug and link-derivation detail to an appendix at the end of SPEC.md.

### 8. MEDIUM: Token maps are the heaviest authoring burden
- Evidence: `tokens` is roughly 25 to 35 percent of each record (button 73 of 223 lines, checkbox 83 of 344). SPEC.md Tokens: the map "defines no rule for combining conditions", so every combination (`variant.primary + disabled`, etc.) is written out.
- Impact: Large, repetitive, hard to review for designers, and easy to get out of sync with the CSS.
- Fix for a simple v1: either state a single convention (conditions are overrides applied over `base`, most specific wins) so authors write only differences, or move token maps to the implementation file and keep the contract to anatomy, parameters, states, and rules.

### 9. LOW: `summary` and `description` are both required and often say the same thing
- Evidence: button: "Use Button to trigger an action or to submit or reset a form." / "Triggers an action or submits or resets a form." Same for badge and link. `get` prints both back to back.
- Fix: Make `description` optional, used only when it adds something.

### 10. LOW: Link model is larger than v1 needs
- Evidence: SPEC.md Links: 5 kinds, each with an inverse, plus 4 implicit sources (`instead`, rule `references`, enum `guidance`, annotations that are checked but create no links).
- Fix: Keep it, but in the author-facing doc show only `follows` and `related`, and mention the rest as advanced.

### 11. LOW: Rendered output readability
- Evidence: `pnpm spec get button` prints "Example: Save changes Guidance: [Action hierarchy](…)" with no separator; the Parameters table's Description column is empty for enums whose meaning lives in values.
- Fix: Add separators ("Example: Save changes. Guidance: …") and drop or fill the empty column.

### 12. LOW: Naming conventions are mixed
- Evidence: parameter keys are camelCase (`fullWidth`, `accessibleName`) while ids, tags, rule ids, parts, and token properties are kebab-case. The `key` def allows both (schema line 146).
- Fix: Pick one for parameters and state it in SPEC.md.

### 13. LOW: Agent skills live in three tool-specific places
- Evidence: `.agents/skills/` (source), `.claude/skills/` (symlinks), `.cursor/skills/verify-design-system` (only there).
- Fix: Keep `.agents/skills` as the one source and symlink everything from it, including verify-design-system.

## Suggested order for a simple first iteration
1. Templates + generic scaffold for non-component records, and settle "recipe" (finding 1).
2. `pattern.form-field` with rules allowed on patterns (findings 2, 3).
3. "Start here" doc (finding 7) and low-confidence search signal (finding 4).
4. Decide whether token maps stay in the contract (finding 8) and decouple status from web (finding 6).
