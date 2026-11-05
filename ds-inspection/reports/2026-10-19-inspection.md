# Multi-Point Inspection Report — Ember & Sage

_Inspected: 2026-10-19 · Technician: Claude Code (Opus 5.5) · Previous inspection: first inspection_
_Vehicle profile: `ds-inspection/GARAGE.md` (checked in 2026-10-19)_

## The short version

Ember & Sage is in good condition for a one-person, five-month-old system. What it has is built carefully: 13 components appear in the spec, code, docs, stories, and tests, contrast is checked in both themes on every build, and agents can query the system through an MCP server that is actually wired up. Three things matter most. First, the components package that every docs page and every agent tells people to install is not published on npm, so the install step fails. Second, the inventory stops short of the components most product screens need: no card, table, tooltip, toast, menu, or loading state. Third, when an agent searches for one of those missing pieces it gets an empty result and no pointer to the compose-or-propose guideline, so it will improvise. Publish the components package first.

**Overall: 75/100\*** — a conversation starter, not a grade. Fix the reds, schedule the yellows, re-run on a cadence.
\*Score is 60/80 scaled to 100. Stations 7 and 8 were left out of scope by choice; they were not scored.

## Inspection sheet

|  # | Station                         | Quality      | Light |      Score |
|---:|:--------------------------------|:-------------|:-----:|-----------:|
|  1 | Coverage & gaps                 | Complete     |  🟡   |       6/10 |
|  2 | Best practices                  | Sound        |  🟢   |       8/10 |
|  3 | Accessibility                   | Sound        |  🟢   |       8/10 |
|  4 | Shared language                 | Sound        |  🟡   |       7/10 |
|  5 | Testing & validation            | Sound        |  🟡   |       7/10 |
|  6 | Orchestration                   | Synchronized |  🟢   |       8/10 |
|  7 | Governance & version control    | Extensible   |  N/I  |        N/I |
|  8 | Feedback & adoption             | Extensible   |  N/I  |        N/I |
|  9 | Machine-readable docs & context | AI-Ready     |  🟢   |       8/10 |
| 10 | Agent access                    | AI-Ready     |  🟢   |      8/10† |
|    | **Overall**                     |              |       | **75/100**\* |

**Lights:** 🟢 5 green · 🟡 3 yellow · 🔴 0 red · 2 not inspected (out of scope)

† Provisional green: the live test on record ran on 2026-10-01 through the CLI, not the MCP server, and before Tabs existed.

**Key:** 🔴 Red (0–3) — broken or missing; the light is ON · 🟡 Yellow (4–7) — drift or gaps; schedule a fix · 🟢 Green (8–10) — healthy, no action needed · **N/I** — not inspected (no evidence access; never guessed)

## Evidence basis

- Access used this pass: code, docs, spec, and CI all live (repo files, built docs site, `pnpm spec`, the `design-system-spec` MCP server, the token audit script, the npm registry). No design library exists. GitHub issues and PRs were not read because the GitHub plugin is not authorized.
- Findings tagged `[verified]`: 46 · `[reported]`: 1
- The design leg is absent by choice, so Stations 1, 2, 3, and 6 judge spec, code, and docs only. That is a deviation this report respects, not a warning light.

## Station records

### Station 1 — Coverage & gaps: YELLOW (6/10)
- Inventory: 0 in design (no library, by choice) · 13 in code · 13 in spec · 13 documented · 13 with stories · 13 with tests (swept everything)
- Evidence level: code, spec, and docs live
- Findings:
  - [verified] All 13 components (Alert, Badge, Button, Checkbox, Dialog, Icon, Link, Radio group, Select, Switch, Tabs, Text area, Text field) appear in every place they should: a spec record, a source file in `packages/components/src`, a test file, an implementation file, an example with a Verify script, a Storybook story, and a built docs page. Nothing is half-present.
  - [verified] Missing staples from the common core: card, table, tooltip, toast, accordion or disclosure, avatar, pagination, breadcrumb, navigation, and loading, empty, and error states. Tabs' own docs page points readers to "a disclosure" and "a step-by-step flow" that the system does not ship.
  - [verified] The industry diff, from my own knowledge of Material, Carbon, Polaris, Primer, and Spectrum (no design-systems knowledge MCP connected, so lower confidence), adds menu or action dropdown, popover, combobox, progress or spinner, and a button loading state.
  - [verified] `@stevegreco/design-system-components` returns E404 on the npm registry, but every component docs page and `get --impl web` tell readers to `pnpm add` it. The tokens package `@stevegreco/design-system` is published at 0.0.5.
  - [verified] Tokens are tiered: primitives, semantic light and dark, shape, typography, and one component file (`components/button.tokens.json`) under the ADR 0003 policy.
  - [verified] Control geometry is hardcoded: 16px checkbox and radio boxes, a 32×18px switch track, an 8px radio dot, and `outline-offset: 2px` repeated in 11 of 13 component stylesheets.
- Not inspected: design library (none exists); real product needs (no consumers yet)
- Deviations noted: no design library; component tier tokens only where a contract needs them
- First move: publish the components package, or change the install instructions until it is published.

### Station 2 — Best practices: GREEN (8/10)
- Sampled: Tabs, Dialog, and Button source end to end; all 13 stylesheets scanned; the built Tabs docs page
- Evidence level: code and docs live
- Findings:
  - [verified] (format) Native elements under the custom elements: Button wraps a real button and is form-associated through `attachInternals`; Dialog uses a native `dialog` with `showModal()`; Tabs builds real `button` tabs.
  - [verified] (industry) Zero physical direction properties in 13 stylesheets: no `margin-left`, `padding-right`, `left:`, or `text-align: left`. Tabs flips its arrow keys under `direction: rtl`.
  - [verified] (format) APIs are small. The largest is Text area at 11 parameters, all of them native form concepts.
  - [verified] (org) Hardcoded focus offsets and control sizes (see Station 1) are the one break from the system's own "tokens, not magic numbers" stance.
  - [verified] (docs) Component pages follow one structure: when to use, when to avoid, preview, import, usage, then rules as must and should with do and avoid examples. Cross-links to alternatives resolve.
  - [verified] (docs) Alternatives that are not components render with a capital letter mid-sentence, for example "Use A step-by-step flow with previous and next actions instead" in `dist/components/tabs.md`. This appears in 4 of 13 built pages.
- Not inspected: design library craft (no library)
- Deviations noted: none
- First move: lowercase non-component alternatives in the docs page template.

### Station 3 — Accessibility: GREEN (8/10)
- Sampled: Tabs, Dialog, and Button source; light and dark themes · Design side: not reachable (no library)
- Evidence level: code and tokens live; ran the audit
- Findings:
  - [verified] The contrast audit ran clean: 58 pairs pass in light and 58 in dark. It runs as the last step of `pnpm build`, and a failure fails the build. The only pairs below threshold are disabled states, which are exempt (WCAG 1.4.3). Computed from the code tokens; there is no design source to compare.
  - [verified] Dialog uses `showModal()`, `aria-modal`, `aria-labelledby` and `aria-describedby`, wraps Tab focus inside, handles Escape after child controls, and returns focus to the trigger on close (2.4.3).
  - [verified] Tabs uses roving `tabindex`, Arrow, Home, and End keys, and `aria-selected`, and labels the panel by the selected tab (2.1.1, 4.1.2).
  - [verified] Tests assert keyboard behavior in 7 test files and read the browser's real accessibility tree through CDP (`test/helpers/accessibility.js`, mirrored in `examples/accessibility.js`).
  - [verified] The spec carries 61 accessibility rules out of 151 in total.
  - [verified] No axe-core or similar automated scan anywhere in the repo.
  - [verified] No screen reader test plan.
  - [reported] Whether the 16px checkbox and radio boxes meet target size (2.5.8, 24×24 minimum) depends on the label being part of the hit area. Not measured this pass.
- Not inspected: design-side accessibility (no library); real screen reader runs
- Deviations noted: none
- First move: add an axe scan to the existing Playwright Verify run over every docs example.

### Station 4 — Shared language: YELLOW (7/10)
- Swept: every spec parameter, value, and event across 13 components; `observedAttributes` in every source file; the implementation tables
- Evidence level: spec and code live
- Findings:
  - [verified] One token scheme named by role (`semantic-color-background-action-primary-default`), documented in ADRs.
  - [verified] A validator catches spec↔implementation drift: `checkImplementation` rejects an implementation table that names a parameter, value, or event the record lacks, or skips one (`packages/spec/test/implementation.test.js`), and `pnpm spec validate` passes.
  - [verified] Size values disagree: Button uses `sm | md`, Icon uses `small | medium | large`.
  - [verified] `dismissible` means the same thing on Alert and Dialog but fires `dismiss` on Alert and `cancel` then `close` on Dialog. Dialog follows the native element, so this may be intentional, but no rationale is recorded for it.
  - [verified] Parameter names and web attributes diverge in two places, `action` → `type` and `accessibleName` → `aria-label`. They are documented in the implementation files, and the agent-retrieval study shows this exact gap caused every invented API in the baseline runs.
  - [verified] Nothing checks vocabulary across components (one value set per concept).
- Not inspected: design-side names (no library)
- Deviations noted: Dialog's native event names, pending a rationale
- First move: settle one size scale and add a cross-component check to `pnpm spec validate`.

### Station 5 — Testing & validation: YELLOW (7/10)
- Sampled: CI workflow, the Tabs (17 tests), Dialog (20), and Button (6) suites, the token audits, and the docs Verify steps
- Evidence level: live
- Findings:
  - [verified] CI runs lint, format check, build, a check that generated sources are committed, and the full test suite on every PR and push to main (`.github/workflows/ci.yml`).
  - [verified] Tests assert behavior in a real browser, not just rendering: keyboard navigation, focus return, and the exposed accessibility tree.
  - [verified] The token build blocks on contrast, theme parity (109 tokens in each theme), and ramp integrity.
  - [verified] Every docs example has a `.verify.js` that runs against the built site.
  - [verified] No visual regression testing. A token change that shifts layout or color without breaking contrast goes unnoticed.
  - [verified] The agent-retrieval evaluation (`docs/research/agent-retrieval`) is a manual study last run 2026-10-01. It is not repeatable from CI and predates Tabs.
- Not inspected: design-side linting (no library)
- Deviations noted: none
- First move: add Playwright screenshot comparisons over the Storybook stories or docs examples, light and dark.

### Station 6 — Orchestration: GREEN (8/10)
- Sampled: the token pipeline, the docs page build, the spec → implementation → docs chain for Alert, Button, and Tabs
- Evidence level: live
- Findings:
  - [verified] Tokens have one source: DTCG JSON → Style Dictionary → CSS and JSON, and the components consume the CSS custom properties.
  - [verified] Docs pages are generated from the spec record plus `implementation/<name>.md`, not copied by hand, so guidance lives in one place.
  - [verified] Implementation tables are checked against spec records, and Verify steps exercise the built examples.
  - [verified] Nothing checks the web component source against its implementation table. AGENTS.md says so: "Nothing checks an implementation against a spec." An attribute added to `observedAttributes` but missing from the table, or the reverse, would pass CI.
  - [verified] Each component lands through three phase skills with `pnpm component:status` checks, so design, code, and docs follow one definition of done.
- Not inspected: design↔code diff (no library); the token three-way diff has no design side
- Deviations noted: two legs (spec plus code), not three, by choice
- First move: a test that compares each component's `observedAttributes` and dispatched events with its implementation table.

### Station 9 — Machine-readable docs & context: GREEN (8/10)
- Sampled: built docs output, spec records, the token JSON, type definitions, the agent-retrieval study
- Evidence level: live
- Findings:
  - [verified] `llms.txt`, `llms-full.txt`, and `agent-readability.json` ship with the built docs. Every page also builds as `.md`.
  - [verified] Usage rules are encoded as addressed rules with levels (151 in all, for example `component.button#a11y-icon-accessible-name`), plus when-to-avoid alternatives. These are rules, not prose.
  - [verified] Tokens ship as DTCG JSON and CSS custom properties. Every component has a `.d.ts`.
  - [verified] The generation test was run: with `get --impl web`, the final runs had 0 invented APIs and 0 rule mistakes across three tasks, down from 4–5 invented APIs per run at baseline.
  - [verified] No custom-elements manifest, which IDEs and many web tools read.
  - [verified] The test predates Tabs and the Dialog backdrop change.
- Not inspected: none
- Deviations noted: none
- First move: rerun the retrieval study against the current 13 components.

### Station 10 — Agent access: GREEN, provisional (8/10)
- Sampled: `.mcp.json`, AGENTS.md, `.agents/skills`, live MCP calls
- Evidence level: live
- Findings:
  - [verified] The `design-system-spec` MCP server is registered in `.mcp.json` and answered live: "show a dismissible success message after saving" returned `component.alert`, with the matching rules listed.
  - [verified] AGENTS.md documents the CLI and MCP, and four phase skills (`spec-component`, `implement-component`, `document-component`, `design-tokens`) make AI-assisted work repeatable.
  - [verified] A search for a missing component (`tooltip`) returns `{"results":[]}` with no pointer to `guideline.compose-or-propose`. An agent that gets an empty result builds its own.
  - [verified] No Code Connect, which does not apply because there is no design library.
- Not inspected: a fresh live build test through the MCP server (the study on record used the CLI)
- Deviations noted: no design-to-code bridge, by choice
- First move: return the compose-or-propose guideline when a search finds nothing, then rerun the live build test through the MCP server.

## Next service

- Work order: `ds-inspection/work-orders/2026-10-19-work-order.md`
- Recommended cadence: deep inspection quarterly; everyday checks to wire into CI: axe scan (3), visual regression (5), component↔implementation table parity (6), cross-component vocabulary (4)
- Re-inspect by: 2027-01-19

## Inspection cost

Measured from this session's transcript (`~/.claude/projects/…/56e08772-….jsonl`), counting each API response once. It covers the whole session up to the point the work order was written, so a few closing calls are not included.

| Measure                       |      Tokens |
|:------------------------------|------------:|
| API calls                     |          38 |
| Output                        |      23,454 |
| Input, uncached               |          76 |
| Input, written to cache       |     104,749 |
| Input, read from cache        |   4,236,684 |
| **Input, all kinds**          | **4,341,509** |
| Context window at start → end | 79,878 → 146,768 |

Plan usage moved from 3% to 8% of the 5-hour limit and from 3% to 4% of the weekly limit (Pro plan). About 98% of the input is cache reads: each call re-sends the whole conversation, roughly 80k tokens of it fixed overhead (tool schemas, system prompt, skills, memory), and the cache makes that cheap. Leaving out Stations 7 and 8 and Figma kept it smaller than a full run.
