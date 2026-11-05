# Work Order — Ember & Sage

_From inspection: `reports/2026-11-04-inspection.md` · Written: 2026-11-04_

Reds get fixed now. Yellows get scheduled. Greens get left alone (and celebrated). Every item cites its station and evidence — no vibes-based work items. The team owns prioritization; this is the technician's recommendation.

## 🔴 Fix now (reds)

None. No station scored red.

## 🟡 Schedule (yellows)

### 1. Decide whether the repo is public (#305)
- **Station:** 7, 8 · **Evidence:** [verified] `gh api` reports the repo private; `guideline.compose-or-propose` says "open an issue"; branch protection returns 403 on this plan
- **First move:** choose public, or Pro plus a separate intake path. Public also makes branch protection available on the free plan. Check the history for anything sensitive first.
- **Done when:** someone outside can follow the proposal path as written, and `main` requires CI to pass
- **Effort:** S (decision), then S · **Suggested timing:** this sprint. Your call, and hard to undo once public.

### 2. Add one axe test (#306)
- **Station:** 3, 5 · **Evidence:** [verified] no axe in the repo or CI; #163 closed as "isn't planned for now"; Storybook's `a11y.test` has no runner; a one-off run today found 0 violations
- **First move:** the Verify harness that earlier work orders named is gone, so add one test in `packages/components/test` over one page with all components, in both themes. `evidence/2026-11-04/all.html` and `run.mjs` are a working start. This reverses #163 only if you agree, and costs one dev dependency.
- **Done when:** a PR that adds a WCAG violation fails CI
- **Effort:** S · **Suggested timing:** this sprint, while the baseline is clean

### 3. Add visual regression (#307), then fix #245
- **Station:** 3, 5 · **Evidence:** [verified] no screenshot tests; dark `border.subtle` on `background.surface` is 1.06:1; #245 has no priority label
- **First move:** label #245. Add Playwright screenshots over the stories in both themes, then move dark `border.subtle` up the gray ramp and review the diff.
- **Done when:** changing a semantic color produces a reviewable diff in CI, and a Divider in a Card is visible in dark mode
- **Effort:** M · **Suggested timing:** before the next token change

### 4. Run the agent eval with cold agents (#261)
- **Station:** 5, 9, 10 · **Evidence:** [verified] last study 2026-10-01; today's generation test was not cold, so Stations 9 and 10 are provisional
- **First move:** start small: the settings form task, plus Dialog, Tabs, and Select tasks, under hosted MCP, CLI, and no tools, by hand if scripting would delay it
- **Done when:** one dated report covers all conditions, and each finding is fixed or filed. A pass confirms the greens.
- **Effort:** M · **Suggested timing:** this quarter

### 5. Give agents the page foundations (#308)
- **Station:** 9 · **Evidence:** [verified] a mistyped token failed silently and page text fell back to serif; `tokens.css` sets no page defaults; `search "page text heading typography"` found nothing relevant
- **First move:** add a guideline record covering base font, text color, page background, and heading recipes, and name it in `get --impl web`'s Styles section. Consider whether the tokens package should offer an optional base stylesheet.
- **Done when:** a cold agent's page text and headings use the type recipes with no guessing
- **Effort:** S · **Suggested timing:** this sprint, and before item 4 if you want the eval to test it

### 6. Turn the one-off checks into tests (#309, #310)
- **Station:** 4, 6 · **Evidence:** [verified] spec tokens match stylesheets and API tables match source today, but only by manual sweep; no vocabulary check
- **First move:** adapt `evidence/2026-11-04/spec-tokens-vs-css.mjs` and `impl-table-vs-source.mjs`, then add a `validate` rule for shared value sets. Add `primitives.space.32` to Tooltip's spec, or record why not.
- **Done when:** removing an attribute, changing a token on one side, or adding `size="sm"` fails `pnpm test`
- **Effort:** M · **Suggested timing:** this quarter

### 7. Keep the inspections on `main` (#311)
- **Station:** 8 · **Evidence:** [verified] `git log origin/main -- ds-inspection` is empty; reports are on `stevegreco/ds-inspection`, in 37ad6aa, and in a Codex worktree
- **First move:** collect all four reports into one PR, based on `main`
- **Done when:** `ds-inspection/reports/` on `main` holds the history, and each new run compares against the true last report
- **Effort:** S · **Suggested timing:** this sprint

### 8. Know the consumers (#312)
- **Station:** 1, 8 · **Evidence:** [reported] "some consumers", not enumerated, across two inspections; [verified] downloads of 166 and 281 last week say nothing about who
- **First move:** a one-page table: each product, the versions it pins, what it wants next
- **Done when:** Station 8 can be scored from evidence, and item 9 has a ranking
- **Effort:** S · **Suggested timing:** before next inspection

### 9. Spec the next components, by need (#313)
- **Station:** 1 · **Evidence:** [verified] no table, menu, pagination, popover, toast, breadcrumb, navigation, combobox, date picker, or skeleton; all five benchmark systems ship a data table, four ship each of menus, pagination, popover, and toast
- **First move:** rank with item 8's table, then run `spec-component` for the top one. Without consumer input, I'd start with Table, then Menu.
- **Done when:** the top two have draft specs
- **Effort:** L · **Suggested timing:** this quarter, one per cycle

### 10. Smaller items
- **Forced colors (#275):** give Button and Badge variants a difference beyond the label (#275), and decide whether Text field should match Text area (Station 3, S).
- **Control geometry (#314):** bind checkbox, radio, switch, and tabs sizes to tokens, building on #271 (Station 2, S).
- **Web name for `accessibleName` (#315):** choose `label` or `aria-label`, or record why they differ (Station 4, S).
- **Slider (#316):** decide whether web gets one, and resolve #282 and #283 (Station 6, S).
- **Product name (#317):** choose how "Ember & Sage" and "Design System" relate, and align the docs site (Station 4, S).
- **Manifest (#318):** generate `custom-elements.json` (Station 9, S).
- **Screen reader plan (#319):** a short manual checklist for the overlay and form components (Station 3, S).

## 🔧 Access upgrades (sharper next inspection)

- A list of, or access to, consumer repos (Stations 1, 8, 10).
- If a Figma library ever exists, Stations 1, 2, 3, and 6 gain a third leg. It would need a seat with edit access, since `whoami` shows a View seat.

## 🟢 Keeping the greens green

- **Station 2:** keep `stylesheets.test.js` growing, so each shared decision becomes an assertion.
- **Station 9:** keep the spec as the source, and add each new stumble from the eval to the context.
- **Station 10:** re-run the eval through the hosted server after each spec format change, and keep the docs setup page paths under a test.

## Cadence

- Re-inspect (deep, all stations): 2027-02-04
- Everyday checks to wire into CI now: axe (2), visual regression (3), source parity and vocabulary (6)
- Owner of this work order: Steve Greco · Review: triage into GitHub issues with domain and P labels
