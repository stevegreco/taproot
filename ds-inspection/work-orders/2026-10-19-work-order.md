# Work Order — Ember & Sage

_From inspection: `reports/2026-10-19-inspection.md` · Written: 2026-10-19_

Reds get fixed now. Yellows get scheduled. Greens get left alone (and celebrated). Every item cites its station and evidence — no vibes-based work items. The team owns prioritization; this is the technician's recommendation.

## 🔴 Fix now (reds)

No red stations. One yellow finding works like a red, because it breaks the first step for every reader and every agent, so it goes first.

### 1. Make the components install step work
- **Station:** 1, Coverage & gaps (affects 9 and 10) · **Evidence:** [verified] `npm view @stevegreco/design-system-components` returns E404; every component docs page and `get --impl web` say to `pnpm add` it
- **Why it's first:** the agent-retrieval study got invented APIs down to 0, but the package that correct markup imports does not exist, so a perfect agent still ships markup that fails to install
- **First move:** publish 0.0.1 to npm, or until then change the docs Import block to say it is a workspace package
- **AI assist:** the agent can prepare the publish config and changelog. Whether to publish at all is your call
- **Done when:** `npm view @stevegreco/design-system-components version` returns a version
- **Effort:** S

## 🟡 Schedule (yellows)

### 2. Point agents to compose-or-propose when a search finds nothing
- **Station:** 10, Agent access · **Evidence:** [verified] MCP `search "tooltip"` returns `{"results":[]}`
- **First move:** when `search` returns no results, return `guideline.compose-or-propose` with a one-line note that no component matches · **Done when:** an empty search in the CLI and the MCP server names the guideline · **Effort:** S
- **Suggested timing:** this sprint

### 3. Add an automated accessibility scan
- **Station:** 3, Accessibility · **Evidence:** [verified] no axe-core or similar anywhere in the repo
- **First move:** run `@axe-core/playwright` inside the existing docs Verify run, over every example in light and dark · **Done when:** CI fails on a new axe violation · **Effort:** S
- **Suggested timing:** this sprint

### 4. Add visual regression
- **Station:** 5, Testing & validation · **Evidence:** [verified] no screenshot comparison in any package or workflow
- **First move:** Playwright `toHaveScreenshot` over the Storybook stories, light and dark, with baselines committed · **Done when:** a token value change shows up as a failed screenshot diff in CI · **Effort:** M
- **Suggested timing:** this quarter

### 5. Check component source against its implementation table
- **Station:** 6, Orchestration · **Evidence:** [verified] AGENTS.md: "Nothing checks an implementation against a spec"; `checkImplementation` stops at the Markdown table
- **First move:** a test in `packages/components/test` that reads each `implementation/<name>.md` and compares its attributes and events with the element's `observedAttributes` and dispatched events · **Done when:** removing an attribute from one side fails CI · **Effort:** M
- **Suggested timing:** this quarter

### 6. One value set per concept
- **Station:** 4, Shared language · **Evidence:** [verified] Button `size: sm | md`, Icon `size: small | medium | large`; Alert fires `dismiss` while Dialog fires `cancel` for `dismissible`
- **First move:** choose one size scale, record the Dialog event choice in its `rationale`, then add a `pnpm spec validate` check that a parameter name shared across components uses one value set · **Done when:** validate flags a size value outside the chosen scale · **Effort:** S (decision) + S (check)
- **Suggested timing:** before the next component ships

### 7. Fill the staples gap, by need
- **Station:** 1, Coverage & gaps · **Evidence:** [verified] no card, table, tooltip, toast, menu, disclosure, or loading state; Tabs docs already point to a disclosure and a stepper that do not exist
- **First move:** rank the gaps (my suggestion: disclosure, tooltip, toast, card, loading state), then run `spec-component` for the top one · **Done when:** the top two ship through all three phases · **Effort:** L
- **Suggested timing:** this quarter, one component per cycle

### 8. Tokenize control geometry and focus offset
- **Station:** 1 and 2 · **Evidence:** [verified] `outline-offset: 2px` in 11 of 13 stylesheets; 16px boxes, 32×18px switch track, 8px radio dot
- **First move:** add a semantic focus offset token and control size tokens, then replace the literals · **Done when:** a grep for `[0-9]px` in `packages/components/src/*.css` finds only comments and 1px borders · **Effort:** S
- **Suggested timing:** this quarter

### 9. Docs polish: lowercase non-component alternatives
- **Station:** 2, Best practices · **Evidence:** [verified] "Use A step-by-step flow … instead" in 4 of 13 built pages
- **First move:** lowercase the first letter of alternatives that are not links in the page template · **Done when:** no built page has "Use A " or "Use Headings " mid-sentence · **Effort:** S
- **Suggested timing:** this sprint

## 🔧 Access upgrades (sharper next inspection)

- Authorize the GitHub plugin so Station 7 (governance, versioning, changelog) and issue history can be inspected when they come into scope.
- Connect a design-systems knowledge MCP (`claude mcp add --transport http design-systems https://design-systems-mcp.southleft.com/mcp`) so the Station 1 benchmark is sourced and cited, not recalled.
- If a Figma library ever exists, Stations 1, 2, 3, and 6 gain a third leg to check.

## 🟢 Keeping the greens green

- **2 Best practices:** keep the zero-physical-properties result. Add an oxlint or stylelint rule that rejects `left`, `right`, and `margin-left` style properties.
- **3 Accessibility:** keep contrast blocking in `pnpm build`. Add a pair to `audit-contrast.js` every time a component uses a new color pairing (as #218 did).
- **6 Orchestration:** keep docs generated from spec. Never hand-copy rule text into an implementation file.
- **9 Machine-readable docs:** rerun the agent-retrieval study after each new component and add a custom-elements manifest.
- **10 Agent access:** rerun the live build test through the MCP server, not only the CLI, to confirm the provisional green.

## Cadence

- Re-inspect (deep, all stations in scope): 2027-01-19
- Everyday checks to wire into CI now: axe scan (#3), component↔table parity (#5), vocabulary check (#6)
- Owner of this work order: Steve Greco · Review: triage into GitHub issues with area and priority labels
