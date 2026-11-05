# Multi-Point Inspection Report — Ember & Sage

_Inspected: 2026-11-04 · Technician: Claude Code (Opus 5.5) · Previous inspection: 2026-10-29 (on branch `stevegreco/ds-inspection`)_
_Vehicle: `origin/main` at 136030d · Profile: `ds-inspection/GARAGE.md` (checked in 2026-11-04)_

## The short version

The biggest problem from last time is fixed: all three packages are on npm at the versions in `main`, a release workflow publishes them, and I installed them into an empty project and built a working settings form. No station is red. What remains is mostly safety nets and reach. Nothing automatic catches an accessibility or visual regression, the agent eval still hasn't run since the rename, and the repo is private, so outside teams can't open the issues the system tells them to open. Product screens also still lack a table, menu, pagination, and toast. Next, decide whether to make the repo public, because that one choice opens the proposal path and makes branch protection available without paying for GitHub Pro.

**Overall: 71/100** — a conversation starter, not a grade. Fix the reds, schedule the yellows, re-run on a cadence.

## Inspection sheet

|  # | Station                         | Quality      | Light |      Score |
|---:|:--------------------------------|:-------------|:-----:|-----------:|
|  1 | Coverage & gaps                 | Complete     |  🟡   |       7/10 |
|  2 | Best practices                  | Sound        |  🟢   |       8/10 |
|  3 | Accessibility                   | Sound        |  🟡   |       7/10 |
|  4 | Shared language                 | Sound        |  🟡   |       7/10 |
|  5 | Testing & validation            | Sound        |  🟡   |       7/10 |
|  6 | Orchestration                   | Synchronized |  🟡   |       7/10 |
|  7 | Governance & version control    | Extensible   |  🟡   |       7/10 |
|  8 | Feedback & adoption             | Extensible   |  🟡   |       5/10 |
|  9 | Machine-readable docs & context | AI-Ready     |  🟢   |      8/10† |
| 10 | Agent access                    | AI-Ready     |  🟢   |      8/10† |
|    | **Overall**                     |              |       | **71/100** |

**Lights:** 🟢 3 green · 🟡 7 yellow · 🔴 0 red · 0 not inspected

† Provisional green. I ran the generation test myself, after reading the spec and source in this session, so it was not a cold agent. A cold run is the first move for both stations.

**Key:** 🔴 Red (0–3) — broken or missing; the light is ON · 🟡 Yellow (4–7) — drift or gaps; schedule a fix · 🟢 Green (8–10) — healthy, no action needed · **N/I** — not inspected (no evidence access; never guessed)

## Evidence basis

- Access used this pass: code, published npm packages, built and deployed docs, Storybook, GitHub, npm, the local and hosted MCP servers, and a design-systems knowledge MCP were all live. There is no design library to read.
- Findings tagged `[verified]`: 58 · `[reported]`: 3
- Run on `main`: install, build, lint, and format check clean. All 1,081 tests pass (web components 522, React 293, spec 237, tokens 22, docs 7). `ds-spec validate`: 25 records, no issues. Token audits: no failures.
- Scripts, pages, and screenshots from the live checks are in `ds-inspection/evidence/2026-11-04/`.

## Station records

### Station 1 — Coverage & gaps: YELLOW (7/10)
- Inventory: 0 in design (no library, by choice) · 21 in spec · 20 web · 8 React · 20 with stories · 20 in the catalog (all components, not a sample)
- Evidence level: live (repo, npm, deployed docs, knowledge MCP)
- Findings:
  - [verified] Distribution is fixed. npm has `@stevegreco/design-system` 0.1.1, `@stevegreco/web-components` 0.1.1, and `@stevegreco/design-system-spec` 0.2.0, matching `main`.
  - [verified] Staples still missing: table, menu or dropdown, pagination, popover, toast, breadcrumb, navigation, combobox, date picker, and an empty or skeleton state.
  - [verified] Benchmark from five systems in the knowledge MCP (Dell, Gusto, Basis, Nordhealth, Audi; directory entries at medium confidence): all five ship a data table, and four each ship menus, pagination, popover, and a toast-style snackbar. Those are the most-shared gaps. The team decides which ones real products need.
  - [verified] Tokens cover color, type, space, radius, border, elevation, shadow, and motion in primitive and semantic tiers. Spacing has no semantic tier, which ADR 0003 allows.
  - [verified] Button has no loading state in its spec. Spinner exists but the two are not joined.
- Not inspected: what consumer products need (no product access)
- Deviations noted: no design library; no per-component docs pages (ADR 0007); no web Slider
- First move: list what consumers need (work order 8), then spec the top gap. Table is the likely candidate.

### Station 2 — Best practices: GREEN (8/10)
- Sampled: `select.js`, `dialog.js`, `tabs.js`, and `tooltip.js` end to end; all 20 stylesheets swept; `agents.mdx` and the built catalog
- Evidence level: live
- Findings:
  - [verified] format: Components wrap native elements (`select`, `dialog`, `button`) and use `ElementInternals` for form association. Select and Dialog keep the native behavior instead of rebuilding it.
  - [verified] format: No hex or `rgb()` values in any component stylesheet. 423 semantic references and 78 primitive references, and the primitives are spacing, motion, and one text size, which ADR 0003 allows.
  - [verified] industry: Layout uses logical properties. The only physical side is the documented accordion chevron (`accordion.css:65`).
  - [verified] org: Control geometry is still raw px: checkbox and radio 16px, radio dot 8px, switch 32×18px with a 12px thumb, tabs indicator 2px. #271 covers part of this. It won't scale with text size or density.
  - [verified] org: Implementation files restate some spec guidance. #299 tracks this.
- Not inspected: visual quality beyond the screenshots in the evidence folder
- Deviations noted: spacing primitives (ADR 0003); accordion chevron
- First move: settle control sizes through #271 and bind them to tokens.

### Station 3 — Accessibility: YELLOW (7/10)
- Sampled: all 20 web components on one page, plus the settings form, in light and dark · Design side: no library
- Evidence level: live (published packages in Chromium, token audit)
- Findings:
  - [verified] I ran axe-core 4.10 on the published packages, with the WCAG 2.0, 2.1, and 2.2 A and AA rules plus best practices. Result: 0 violations on both pages in both themes. It left two items for manual review: one `color-contrast` that axe couldn't resolve on Text area, and one `aria-prohibited-attr` on the icon-only Button inside Tooltip.
  - [verified] WCAG 1.4.3 and 1.4.11: the contrast audit passes all 58 pairs in each theme and fails the build on a miss.
  - [verified] WCAG 2.5.8: the question left open on 2026-10-19 is answered. The checkbox, radio, and switch boxes are 16 to 18px tall, but each label is a 24px hit area that covers the box. Standalone Link (17px) and Card's title link (22px) pass only through the rule's spacing exception. Axe's target-size rule reported nothing.
  - [verified] Automation gap: nothing runs axe in CI. #163 closed on 2026-10-21 with "isn't planned for now". Storybook's `a11y: { test: "error" }` has no effect because nothing runs Storybook tests. Today's clean result has nothing protecting it.
  - [verified] Forced colors: 6 of 20 stylesheets have no rules (Badge, Button, Icon, Link, Text field, Tooltip). In Chromium all six stay readable, but Button and Badge variants look identical, so Primary and Delete differ only by label (#275). Text area has rules and Text field does not.
  - [verified] #245 is still open: dark `border.subtle` is 1.06:1 on `background.surface`, recomputed today from the published tokens. Decorative, so not a WCAG failure, but a Divider in a Card disappears. It is the one open issue with no priority label.
  - [verified] Reduced motion is covered wherever there is motion: Button, Progress bar, and Spinner have rules, and Tooltip has no animation.
  - [verified] No screen reader test plan. #277 tracks how required fields are marked and announced.
- Not inspected: manual VoiceOver or NVDA runs; forced colors outside Chromium. One test step, Playwright's `locator.focus()` on Button followed by Enter, did not open Dialog. Calling `focus()` directly then pressing Enter did, and so did a click, so I treated it as a test-tool quirk, but I didn't trace the cause.
- Deviations noted: none. #163 is a recorded decision, but its wording is "for now", so it stays on the list for you to revisit.
- First move: add one axe test to `packages/components/test`, over the page in the evidence folder, light and dark.

### Station 4 — Shared language: YELLOW (7/10)
- Swept: parameters of all 21 components, API mappings of all 20 web components, event names, token names, product name
- Evidence level: live
- Findings:
  - [verified] Size words are consistent across Button, Icon, Avatar, and Spinner. `variant` is the one name for that axis on Alert, Badge, Button, and Link. Form controls share `label`, `hint`, `error`, `name`, `value`, and `disabled`.
  - [verified] Semantic tokens are named by role with one scheme, and 118 tokens match between themes.
  - [verified] The web name for `accessibleName` differs by component: `aria-label` on Button, `label` on Icon, Spinner, and Tabs. The mapping documents it, so agents get it right if they look it up. It was the source of invented APIs in the October study.
  - [verified] Alert's dismissal fires `dismiss`, while Dialog's fires `cancel` and then `close`, following the native element.
  - [verified] Guardrail gap: nothing checks that one concept keeps one name across components. Consistency depends on review.
  - [verified] Three names for one thing: READMEs say "Ember & Sage", the docs site and `llms.txt` say "Design System", and the tokens package is `@stevegreco/design-system`.
  - [verified] Rule and event wording is still being settled: #273, #280, and #272.
- Not inspected: design-side names (no library)
- First move: add a `validate` rule for shared value sets, starting with size and status words.

### Station 5 — Testing & validation: YELLOW (7/10)
- Inspected: `ci.yml`, `release.yml`, the Select and Switch tests, test helpers, all suites run on a clean checkout, the agent eval
- Evidence level: live
- Findings:
  - [verified] CI runs lint, format check, build with blocking token audits, a check that generated files are committed, and all tests, on every PR and push to `main`. The latest five runs on `main` that I sampled succeeded.
  - [verified] Tests assert behavior in a real browser: Switch checks keyboard activation and event order, Select checks form submit and reset, and 13 test files exercise the keyboard. The accessibility helper reads Chrome's real tree and guards against reading the wrong frame.
  - [verified] When the docs examples were removed, their checks moved into component tests (4320609), so that coverage wasn't lost.
  - [verified] No visual regression anywhere. A token change that keeps contrast but shifts a look ships unseen.
  - [verified] The agent eval hasn't run since 2026-10-01. It predates the rename, seven or more components, and the MCP path. #261 has the plan and no comments.
  - [verified] CI passing is not enforced, because `main` has no branch protection (see Station 7).
- Not inspected: coverage percentages; design-side linting (no library)
- First move: add screenshot tests over the Storybook stories, light and dark, before fixing #245.

### Station 6 — Orchestration: YELLOW (7/10)
- Diffed: spec tokens against stylesheets (20 components), web API tables against source (20), `main` against npm, catalog against spec, docs config paths against the installed packages
- Token diff: not run against a design side (no library). Code tokens have one source, DTCG JSON through Style Dictionary.
- Evidence level: live
- Findings:
  - [verified] The repo and npm no longer disagree. Every published version matches `main`, and the docs' CDN page takes its versions from `package.json`.
  - [verified] Spec token maps match stylesheets today. My one-off sweep found the only differences are the system-wide constants from `format` (border width, focus width and offset) and one Tooltip size, `primitives.space.32` at `tooltip.css:30`, which isn't in its spec.
  - [verified] Web API tables match source today. Every attribute and dispatched event in the 20 tables lines up with its component.
  - [verified] Neither sweep is a test, and AGENTS.md says nothing checks behavior or styling against the spec. They are clean because of care, and the first rushed change can break them unnoticed.
  - [verified] The docs' agent setup is accurate: every path in its `spec.config.json` exists in the installed packages.
  - [verified] Slider is in the spec and React only. Search offers it to everyone, while the web lookup returns a clear `ERR_NO_IMPLEMENTATION`. `component:status slider` reports 8 missing items because it only checks web (#282).
- Not inspected: design to code (no design leg); how a recent change traveled beyond the merge history
- Deviations noted: no design leg; React as a partial second implementation
- First move: turn the two sweep scripts in the evidence folder into tests.

### Station 7 — Governance & version control: YELLOW (7/10)
- Inspected: release workflow, changesets, tags, npm versions, changelogs, tracker, branch protection API, last 5 merged PRs
- Evidence level: live
- Findings:
  - [verified] The release gap is closed. Merging to `main` opens or updates a Version Packages PR, and merging that publishes through npm trusted publishing with no stored token.
  - [verified] Paper matches reality on changesets: all 3 PRs that changed published package content since Changesets arrived carried one (#294, #302, #304). Tags exist for the current releases.
  - [verified] The tracker is healthy: 16 open, none older than 14 days, 15 labeled, 53 closed since 2026-10-19.
  - [verified] The component process is real and in use. Tooltip landed as a draft spec commit and then an implementation commit, as AGENTS.md describes.
  - [verified] `main` has no branch protection. The API returns 403 because the repo is private on the free plan.
  - [verified] The repo is private, but `guideline.compose-or-propose` tells consumers to "open an issue", and the npm packages link to the repo. Someone outside can't do either. This is a paper-versus-reality gap, and it only shows up now that the packages are public.
  - [verified] No CONTRIBUTING file or PR template. The path is in AGENTS.md, which is enough for one maintainer but not findable for outsiders.
  - [reported] Ownership is clear: one maintainer.
- Not inspected: support channels (none known)
- Deviations noted: no PR reviews on a solo project
- First move: decide public or private (work order 1).

### Station 8 — Feedback & adoption: YELLOW (5/10)
- Measured: npm downloads, tracker labels, git history of the inspections
- Evidence level: live for downloads and tracker; interview from 2026-10-29 for consumers
- Findings:
  - [reported] Some consumers exist. Which ones, and on which versions, is still unknown.
  - [verified] npm downloads last week: tokens 166, components 281. The API has no number yet for the spec package. These include releases made that week and possibly CI, so they show activity, not adoption.
  - [verified] A feedback loop is alive, but it is internal: 67 issues labeled `feedback`, all opened by the maintainer's account. No outside voice is in the tracker, and the private repo prevents one.
  - [verified] Four inspections in a month show a habit, but none of them are on `main`. Reports live on the unmerged branch `stevegreco/ds-inspection`, in commit 37ad6aa, and in a Codex worktree, so the history is easy to lose. The 2026-10-29 report calls itself a "first inspection", probably for this reason.
  - [verified] Fresh installs during a release window can mismatch. A plain `pnpm add` today gave spec 0.2.0 with web components 0.0.1 and tokens 0.0.6, apparently from pnpm's release-age setting. Web components 0.0.1 has no `implementation` folder, so `get --impl web` returned nothing useful. It should clear as versions age, and exact versions installed fine.
- Not inspected: consumer repos, usage by component
- First move: a one-page table of consumers, the versions they pin, and what they want.

### Station 9 — Machine-readable docs & context: GREEN, provisional (8/10)
- Inventoried: 25 validated records, 172 addressed rules (130 MUST, 42 SHOULD; 62 on accessibility), DTCG and CSS tokens, `.d.ts` per component, `llms.txt`, `AGENTS.md`, skills · Generation test: run by the technician, not cold
- Evidence level: live
- Findings:
  - [verified] Generation test: using only spec lookups and the published packages, I built an account settings form with a danger zone and a confirmation dialog. All component names and attributes were right the first time. No console errors, axe found 0 violations, the form validates and submits its values, Tab order is correct, and Dialog opens, keeps Tab on its buttons, closes on Escape, and returns focus. See `evidence/2026-11-04/settings-dark.png`.
  - [verified] One stumble, and it is a real context gap: I guessed `--ds-semantic-typography-body-font-family`, but the real token is `body-md`. CSS failed silently and page text fell back to serif, visible in the screenshot. `tokens.css` sets no page defaults, and `search "page text heading typography"` returned Accordion, Link, and Card. Components look right, while the page around them doesn't, and no record explains it.
  - [verified] The spec is the machine layer itself, and the docs catalog and `llms.txt` are generated from the build, so they can't drift apart by hand.
  - [verified] Example coverage is thin: one example record across 21 components.
  - [verified] No `custom-elements.json`, which IDEs and framework tools read.
- Not inspected: a cold agent run; `llms-full.txt` line by line
- First move: run #261 with cold agents, then add a record on page foundations (base font, text color, background, heading recipes).

### Station 10 — Agent access: GREEN, provisional (8/10)
- Surfaces mapped: hosted MCP, local MCP, CLI from npm, docs setup page, `AGENTS.md`, skills · Live test: run by the technician, graded at Station 9
- Evidence level: live
- Findings:
  - [verified] Outside-the-repo access now works. The hosted server answered over HTTP with 7 tools and 21 components, and needs no sign-in or install. The CLI from the npm package answered `search`, `get --impl web`, and `tokens --resolve` in an empty project.
  - [verified] The docs now have a "Use with AI agents" page covering hosted MCP, CLI, and local MCP, with Claude Code and Cursor setup. It is listed in `llms.txt`.
  - [verified] Dead ends are handled. A search with no results names `guideline.compose-or-propose`, and "date picker" returns weak matches marked as weak. This fixes a 2026-10-19 work-order item.
  - [verified] Tool responses point to the next step: results name the next command, and repo workflows are shared as skills (`spec-component`, `implement-component`, `design-tokens`).
  - [verified] No Code Connect, which doesn't apply without a design library.
  - [reported] Use in real product work is not established, because consumers aren't known (Station 8).
- Not inspected: agents working in a consumer repo; Cursor (only the config was read)
- Deviations noted: no design-to-code bridge, by choice
- First move: the same cold eval as Station 9, through the hosted MCP as well as the CLI.

## What changed since last inspection

Compared with 2026-10-29 (66/100). That report sits on `stevegreco/ds-inspection` at 5a23e60, and I read its scores only after gathering this pass's evidence. Earlier passes: 2026-10-06 and 2026-10-19 (75/100 scaled, 8 stations).

| Station                 | 10-29 | 11-04 | Why |
|:------------------------|------:|------:|:----|
| 1 Coverage              |     6 |     7 | Published; staples unchanged |
| 2 Best practices        |     8 |     8 | No change |
| 3 Accessibility         |     7 |     7 | Axe clean and target size answered, but still no automation |
| 4 Shared language       |     7 |     7 | No change |
| 5 Testing               |     7 |     7 | More tests; same gaps |
| 6 Orchestration         |     6 |     7 | Repo and npm agree; parity still unchecked by tests |
| 7 Governance            |     6 |     7 | Release workflow; private repo is a new finding |
| 8 Feedback              |     4 |     5 | Downloads visible and a live internal loop |
| 9 Machine-readable      |     9 |    8† | Page-foundations gap found by actually building a page |
| 10 Agent access         |     6 |    8† | Reachable from outside the repo |
| **Total**               | **66**| **71**|     |

**Lights off:** Station 10 went yellow to green (provisional).
**New lights:** private repo blocks the proposal path; page-foundations gap; inspection history not on `main`.

Work order from 2026-10-29:

| # | Item | Status |
|:--|:-----|:-------|
| 1 | Publish all packages, automate releases | ✅ Done |
| 2 | Axe in CI | ⬜ Open; #163 closed as not planned for now |
| 3 | Fix #245 | ⬜ Open |
| 4 | Visual regression | ⬜ Open |
| 5 | Document agent access | ✅ Done |
| 6 | Automate the agent eval (#261) | ⬜ Open |
| 7 | Vocabulary and token-map guardrails | ⬜ Open; both are clean today by hand |
| 8 | Know the consumers | ⬜ Open |
| 9 | Plan the next components | 🟡 Partly; Slider shipped in React, no staple specs |
| 10 | Geometry tokens, manifest, branch protection | ⬜ Open |

## Next service

- Work order: `ds-inspection/work-orders/2026-11-04-work-order.md`
- Recommended cadence: deep inspection quarterly; everyday checks to wire into CI: axe (3), visual regression (5), spec tokens and API tables against source (6), shared vocabulary (4)
- Re-inspect by: 2027-02-04
