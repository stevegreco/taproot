# Work Order — Ember & Sage

_From inspection: `reports/2026-10-29-inspection.md` · Written: 2026-10-29_

Reds get fixed now. Yellows get scheduled. Greens get left alone (and celebrated). Every item cites its station and evidence. The team owns prioritization; this is the technician's recommendation.

## 🔴 Fix now (reds)

None. No station scored red.

## 🟡 Schedule (yellows)

### 1. Publish all three packages and automate releases
- **Station:** 1, 6, 7, 10 · **Evidence:** [verified] npm tokens latest 0.0.6 vs `main` 0.1.0 (tag `v0.1.0`, 2026-10-21, 87 commits since); components and spec return 404
- **First move:** add Changesets (or a tag-triggered `pnpm -r publish` workflow), then publish tokens 0.1.0, components, and spec together. Components require tokens 0.1.0.
- **Done when:** `npm view` shows each package at the version in `main`, and a merged version bump publishes without manual steps.
- **Effort:** M · **Suggested timing:** this sprint (it unblocks 6 and 7)

### 2. Run axe in CI
- **Station:** 3 · **Evidence:** [verified] no axe scan in `ci.yml`; Storybook's `a11y.test: "error"` has no runner
- **First move:** in the docs Verify harness, run `@axe-core/playwright` on each example page in light and dark.
- **Done when:** a PR that adds a WCAG violation to any example fails CI.
- **Effort:** S · **Suggested timing:** this sprint

### 3. Fix dark `border.subtle` on surfaces (#245)
- **Station:** 3 · **Evidence:** [verified] 1.06:1 on `background.surface` in dark
- **First move:** move dark `border.subtle` one step up the gray ramp, and add the pair to `audit-contrast.js` as a parity check (not a WCAG gate).
- **Done when:** a divider inside a card is visible in dark mode, and the audit prints the pair.
- **Effort:** S · **Suggested timing:** this sprint, after #4 if possible

### 4. Add visual regression
- **Station:** 5 · **Evidence:** [verified] no screenshot tests anywhere
- **First move:** Playwright `toHaveScreenshot` over the 20 docs examples in both themes, with baselines committed.
- **Done when:** changing a semantic color token produces a reviewable screenshot diff in CI.
- **Effort:** M · **Suggested timing:** before the next token change

### 5. Document agent access for consumers
- **Station:** 10 · **Evidence:** [verified] Getting started has no CLI, MCP, or `llms.txt` mention
- **First move:** add a "Use with AI agents" page: install the spec package, an `.mcp.json` snippet, the `llms.txt` URL, and the `get --impl web` rule.
- **Done when:** a consumer can wire up the MCP server using only the docs site.
- **Effort:** S · **Suggested timing:** right after #1

### 6. Automate the agent eval (#261)
- **Station:** 5, 9, 10 · **Evidence:** [verified] the only generation test is from 2026-10-01, CLI only, before the rename
- **First move:** script the three existing tasks plus Dialog, Tabs, and Select tasks under CLI, MCP, and no-tools conditions.
- **Done when:** one dated report under `docs/reviews/` covers all three conditions.
- **Effort:** M · **Suggested timing:** this quarter

### 7. Vocabulary and token-map guardrails
- **Station:** 4, 6 · **Evidence:** [verified] size and variant drift caught only by manual review; no check that spec `tokens` match the stylesheet
- **First move:** add a spec validation rule for shared value sets (sizes, statuses), plus a test that compares each record's `tokens` map with its stylesheet's `var(--ds-…)` references.
- **Done when:** reintroducing `size="sm"` or a stylesheet token missing from the spec fails `pnpm test`.
- **Effort:** M · **Suggested timing:** this quarter

### 8. Know the consumers
- **Station:** 8 · **Evidence:** [reported] "some consumers," not enumerated
- **First move:** a one-page table of consuming products, the token version each one pins, and the components each one wants.
- **Done when:** the next inspection can score Station 8 from evidence.
- **Effort:** S · **Suggested timing:** before next inspection

### 9. Plan the next components
- **Station:** 1 · **Evidence:** [verified] no table, pagination, breadcrumb, navigation, menu, popover, toast, combobox, date picker, or skeleton
- **First move:** rank the gaps against #8's consumer needs; spec the top two through `spec-component`.
- **Done when:** the top two have draft specs.
- **Effort:** L · **Suggested timing:** this quarter

### 10. Smaller items
- Tokenize checkbox, radio, and switch geometry (Station 2, S).
- Generate `custom-elements.json` (Station 9, S).
- Turn on branch protection requiring CI. It needs GitHub Pro, or the repo made public (Station 7, S).

## 🔧 Access upgrades (sharper next inspection)

- Access to consumer repos, or a list of them (Station 8).
- Connect a design-systems knowledge MCP (`claude mcp add --transport http design-systems https://design-systems-mcp.southleft.com/mcp`) so Station 1's benchmark is cited, not recalled.

## 🟢 Keeping the greens green

- **Station 2:** keep `stylesheets.test.js` growing. Each new shared decision becomes a semantic-token assertion.
- **Station 9:** keep docs and `llms.txt` generated from the spec, and re-run the agent eval whenever the spec format changes.

## Cadence

- Re-inspect (deep, all stations): 2027-01-29
- Everyday checks to wire into CI now: axe (#2), visual regression (#4), vocabulary and token-map rules (#7)
- Owner of this work order: Steve Greco · Review: file items 1–9 as issues with domain and P labels
