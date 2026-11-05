# Multi-Point Inspection Report — Ember & Sage

_Inspected: 2026-10-29 · Technician: Claude Code (Opus 5.5) · Previous inspection: first inspection_
_Vehicle: `origin/main` at c810d5c · Profile: `ds-inspection/GARAGE.md` (checked in 2026-10-29)_

## The short version

The engine is in good shape. The 20 components line up across the spec, the code, the docs, and Storybook, the build blocks on contrast failures in both themes, and agents get correct markup through the CLI and MCP server. The main problem is getting it to people: npm has tokens 0.0.6, while `main` is a breaking 0.1.0 tagged eight days ago with 87 commits since. The components and spec packages have never been published, so consumers can't install the components or reach the agent tooling outside this repo. Next, publish all three packages and add a release workflow so this can't fall behind again.

**Overall: 66/100**: a conversation starter, not a grade. Fix the reds, schedule the yellows, re-run on a cadence.

## Inspection sheet

|  # | Station                         | Quality      | Light |      Score |
|---:|:--------------------------------|:-------------|:-----:|-----------:|
|  1 | Coverage & gaps                 | Complete     |  🟡   |       6/10 |
|  2 | Best practices                  | Sound        |  🟢   |       8/10 |
|  3 | Accessibility                   | Sound        |  🟡   |       7/10 |
|  4 | Shared language                 | Sound        |  🟡   |       7/10 |
|  5 | Testing & validation            | Sound        |  🟡   |       7/10 |
|  6 | Orchestration                   | Synchronized |  🟡   |       6/10 |
|  7 | Governance & version control    | Extensible   |  🟡   |       6/10 |
|  8 | Feedback & adoption             | Extensible   |  🟡   |       4/10 |
|  9 | Machine-readable docs & context | AI-Ready     |  🟢   |       9/10 |
| 10 | Agent access                    | AI-Ready     |  🟡   |       6/10 |
|    | **Overall**                     |              |       | **66/100** |

**Lights:** 🟢 2 green · 🟡 8 yellow · 🔴 0 red · 0 not inspected

**Key:** 🔴 Red (0–3): broken or missing; the light is ON · 🟡 Yellow (4–7): drift or gaps; schedule a fix · 🟢 Green (8–10): healthy, no action needed · **N/I**: not inspected (no evidence access; never guessed)

## Evidence basis

- Access used this pass: code, docs, tracker, npm, and MCP all live. There is no design library, so that leg was confirmed absent rather than skipped.
- Findings tagged `[verified]`: 38 · `[reported]`: 2 (consumer count and feedback channels, Station 8)
- Build and test of `main`: `pnpm build` and `pnpm test` passed, 8/8 Turbo tasks (spec 174 tests, docs 43 tests, components suite green). Token audit: no failures.

## Station records

### Station 1 — Coverage & gaps: YELLOW (6/10)
- Inventory: 0 in design (no library, by design) · 20 in spec · 20 in code · 20 doc pages · 20 story files (all components, not a sample)
- Evidence level: live (repo, built docs, npm)
- Findings:
  - [verified] Spec, code, docs, and stories match one-for-one: 20 components in `packages/spec/content/components`, `packages/components/src`, `apps/documentation/dist/components`, and `apps/storybook/stories`.
  - [verified] Tokens are tiered primitive → semantic and cover color (light and dark, 112 entries each), typography (recipes), shape, elevation, shadow, space, and duration. Deliberately no component tier (ADR 0003).
  - [verified] Missing staples, compared with the common core and with systems such as Carbon, Polaris, and Primer (benchmark from the technician's own knowledge; no design-systems knowledge MCP connected): table, pagination, breadcrumb, navigation, menu/dropdown, popover, toast, combobox, date picker, skeleton/empty state. Product teams will build these themselves.
  - [verified] Distribution is stale. npm's latest `@stevegreco/design-system` is 0.0.6 (2026-10-20), while `main` is 0.1.0, a breaking release (`--ds-` prefix, component tier removed) tagged `v0.1.0` on 2026-10-21. `@stevegreco/design-system-components` and `@stevegreco/design-system-spec` return 404 on npm.
- Not inspected: what consumer products actually need (no product access)
- Deviations noted: no design library; no component token tier
- First move: publish all three packages at their current versions (see work order #1).

### Station 2 — Best practices: GREEN (8/10)
- Sampled: `button.js`, `tabs.js`, `dialog` (contract + implementation), all 20 component stylesheets swept for hex/px and physical properties, 2 generated doc pages
- Evidence level: live
- Findings:
  - [verified] format: Components wrap native elements (`<button>`, `<dialog>`, `role="tablist"` built on buttons) and use `ElementInternals` for form association, so `<ds-button type="submit">` submits across the shadow boundary.
  - [verified] format: No hex or `rgb()` values in any component stylesheet. `stylesheets.test.js` enforces semantic radius, border-width, and focus tokens across every stylesheet.
  - [verified] industry: Layout uses logical properties throughout. The physical sides in `accordion.css:65-66` are a documented exception for the chevron.
  - [verified] format: Fixed control geometry uses raw px: checkbox 16px, radio 16/8/4px, switch 32×18/12/3/17px, tabs indicator 2px. Small, but it won't scale with text size or a density change.
  - [verified] org: Docs pages are generated from the spec (usage do/avoid, anatomy, rules, rationale), so every page has the same structure.
- Not inspected: rendered visual quality
- Deviations noted: spacing primitives used directly (ADR 0003); accordion chevron
- First move: tokenize control geometry (a `semantic.size.control-indicator` role or similar) so checkbox, radio, and switch scale together.

### Station 3 — Accessibility: YELLOW (7/10)
- Sampled: button, tabs, dialog; token contrast in both themes · Design side: not applicable (no library)
- Evidence level: live
- Findings:
  - [verified] WCAG 1.4.3 / 1.4.11: `packages/tokens/scripts/audit-contrast.js` checks text and non-text pairs in light and dark, and `pnpm build` fails on any failure. It passed on `main` (disabled pairs reported as exempt).
  - [verified] Dialog's contract has 8 accessibility MUSTs (initial focus, contain focus, restore focus, forced colors), and `dialog.verify.js` tests Escape and focus restore in a real browser.
  - [verified] Keyboard assertions appear in 7 of 23 component test files, covering the interactive components. The docs Verify steps read Chrome's accessibility tree through CDP (`examples/accessibility.js`).
  - [verified] No automated axe/WCAG rule scan in CI. Storybook sets `a11y: { test: "error" }` in `.storybook/preview.js`, but nothing runs Storybook tests (no `test` script, not in `ci.yml`), so that setting never takes effect.
  - [verified] Open #245: dark `border.subtle` on `background.surface` is 1.06:1, so dividers inside cards disappear in dark mode. Decorative, not a WCAG failure, and the audit doesn't cover this pair.
  - [verified] No screen-reader test plan found.
- Not inspected: manual VoiceOver or NVDA pass
- First move: run axe-core against the built docs examples in the existing Playwright Verify harness.

### Station 4 — Shared language: YELLOW (7/10)
- Swept: every component's observed attributes, enum value sets, and dispatched events; token naming plan
- Evidence level: live
- Findings:
  - [verified] Sizes are consistent: `small/medium/large` (plus `inherit` on Icon and Spinner). Button now matches after the unreleased rename from `sm/md`.
  - [verified] Status vocabulary is consistent: `danger` names a status (Alert, Badge), and `destructive` names an action intent (Button). The changelog states this split.
  - [verified] Form controls share `name/label/hint/error/required/disabled` through `pattern.form-field`. Seven components emit `change`.
  - [verified] Tokens are named by role at the semantic tier (`semantic.color.background.action.primary.default`), following `packages/tokens/docs/semantic-naming-plan.md`.
  - [verified] Guardrail gap: tooling checks that each implementation's API mapping covers every spec parameter, but nothing checks that the same concept uses the same name across components. The `sm` → `small` and `ghost` → `tertiary` drift was caught in a manual review (`docs/reviews/2026-10-spec-review/consistency-review.md`).
- Not inspected: design-side names (no library)
- First move: add a spec validation rule that flags a parameter value set (sizes, statuses) that differs from the shared vocabulary.

### Station 5 — Testing & validation: YELLOW (7/10)
- Inspected: `.github/workflows/ci.yml`, test folders for all packages, `dialog.verify.js`, `stylesheets.test.js`, agent-retrieval eval
- Evidence level: live (ran build and tests)
- Findings:
  - [verified] CI runs on every PR and every push to `main`: lint, format check, build (including the blocking token audits), a check that generated sources are committed, and the full test suite, with Playwright Chromium.
  - [verified] Tests check behavior, not just rendering: keyboard, focus, form submission, and the accessibility tree.
  - [verified] No visual regression (no Chromatic, Percy, or `toHaveScreenshot`). Token changes such as #245's fix go out unchecked visually.
  - [verified] An agent eval exists but runs by hand, once: `docs/research/agent-retrieval` (2026-10-01). #261 plans the automated version.
- Not inspected: test coverage percentages
- First move: add Playwright screenshot tests over the docs examples in light and dark before the next token change.

### Station 6 — Orchestration: YELLOW (6/10)
- Diffed: spec ↔ implementation API mapping (tooling), spec ↔ docs (generated), tokens source ↔ CSS (single pipeline), repo ↔ npm
- Token diff: not run. There is no design-side token list; code tokens come from one source (`src/tokens/*.tokens.json` → Style Dictionary).
- Evidence level: live
- Findings:
  - [verified] Docs component pages are generated from spec records plus `implementation/*.md`, so they can't drift from the spec. The MCP `get --implementation web` serves the same files.
  - [verified] CI fails if a build changes tracked files, so generated sources can't fall behind the code.
  - [verified] What consumers receive is far behind. npm tokens 0.0.6 is older than the breaking 0.1.0 on `main`, and two of the three packages were never published. The repo and what consumers get have split.
  - [verified] Nothing automated checks that a spec record's `tokens` map matches the tokens its stylesheet actually reads. AGENTS.md says to check this in review.
- Not inspected: design ↔ code (no design leg)
- Deviations noted: no design library
- First move: same as Station 1, publish. Then add a test that compares each spec `tokens` map with the `var(--ds-…)` references in its stylesheet.

### Station 7 — Governance & version control: YELLOW (6/10)
- Inspected: CHANGELOGs, ADRs and RFCs, `.agents/skills`, `scripts/component-*.mjs`, GitHub issues, branch protection API, tags, npm versions
- Evidence level: live
- Findings:
  - [verified] The tracker is healthy: 5 open issues, none stale past 30 days, 4 of 5 labeled with domain and priority, 142 closed.
  - [verified] Changelogs keep Unreleased sections with migration notes for breaking changes (Button sizes and variants, the `--ds-` prefix).
  - [verified] The component process is documented and actually used: three phases, each with a skill, plus `component:new` and `component:status`. Decisions are recorded as ADRs.
  - [verified] No release workflow. Publishing is manual, and that is how a `v0.1.0` tag ended up with no matching npm release.
  - [verified] No branch protection on `main` (the API returns 403: the private repo is on the free plan). CI runs but nothing requires it to pass.
  - [verified] No CONTRIBUTING, PR template, or issue templates. That's acceptable for a solo maintainer, but the contribution path lives only in AGENTS.md.
- Not inspected: lived reality of the last 2–3 changes beyond merge history
- First move: add a release workflow (Changesets or a tag-triggered `pnpm publish -r`) so a version bump on `main` publishes.

### Station 8 — Feedback & adoption: YELLOW (4/10)
- Measured: nothing directly; no consumer repos reachable
- Evidence level: interview (consumer count) + live (tracker labels)
- Findings:
  - [reported] Some consumers exist; which products and which versions were not established.
  - [verified] A `feedback` label exists (1 open issue), and `docs/research/component-creation-feedback.md` shows agent-run feedback feeding the process.
  - [verified] Consumers can only be on tokens ≤ 0.0.6, because nothing else is published. Every component consumer is copying from the repo or not using components.
  - [verified] This is the first inspection; no cadence yet.
- Not inspected: consumer usage, download trends
- First move: list the consuming products and the token version each one pins. A one-page table is enough.

### Station 9 — Machine-readable docs & context: GREEN (9/10)
- Inventoried: spec YAML with schema and `validate` (24 records, no issues), 161 addressable rules (120 MUST, 41 SHOULD), DTCG token JSON, `.d.ts` per component, `llms.txt` and `llms-full.txt`, AGENTS.md, 4 agent skills · Generation test: run 2026-10-01, read the results
- Evidence level: live
- Findings:
  - [verified] Every component record has the same structure: usage do/avoid with `instead` links, anatomy, parameters, rules with levels, accessibility, tokens, rationale.
  - [verified] Generation test (`docs/research/agent-retrieval`): the baseline had 4–5 invented APIs per task. With `--impl`, and in the final run, 0 invented APIs and 0 rule mistakes across 3 tasks.
  - [verified] The machine layer is the source. Docs and `llms.txt` are generated from it, so it can't drift from the docs.
  - [verified] That test predates the knowledge → spec rename and used only the CLI. The MCP path and the 13 components added since were not tested.
  - [verified] No `custom-elements.json` manifest. IDEs and framework tooling that read it won't see the components.
- First move: re-run the generation test on today's CLI and MCP, covering newer components (Dialog, Tabs, Select). This is #261.

### Station 10 — Agent access: YELLOW (6/10)
- Surfaces mapped: `design-system-spec` MCP server, `ds-spec` CLI, `--impl web` lookup, AGENTS.md, skills · Live test: partial. A `search` for "confirm before deleting an account" returned the settings example, Dialog, and action hierarchy. `get component.dialog --implementation web` returned the tag, `define` export, attribute map, and usage.
- Evidence level: live
- Findings:
  - [verified] Inside this repo, access is excellent: the MCP server is registered in `.mcp.json`, the CLI and MCP give the same answers, and the attribute mapping removes the guessing that caused every baseline error.
  - [verified] Outside this repo, agents have no access. The spec package isn't on npm, so a consumer can't run `node_modules/.bin/ds-spec` or start the MCP server, and the docs' Getting started page doesn't mention the CLI, MCP, or `llms.txt`.
  - [verified] No Code Connect, which is expected with no design library.
  - [verified] No repeatable eval of output quality through the MCP path yet (#261).
- Not inspected: agent use inside a consumer product
- First move: publish the spec package, then add an "Use with AI agents" page to Getting started (install, `.mcp.json` snippet, `llms.txt` link).

## Next service

- Work order: `ds-inspection/work-orders/2026-10-29-work-order.md`
- Recommended cadence: deep inspection quarterly; everyday checks to wire into CI: Station 3 (axe scan), Station 5 (visual regression), Station 4 (vocabulary rule), Station 6 (spec tokens ↔ stylesheet)
- Re-inspect by: 2027-01-29
