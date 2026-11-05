# Work order: Ember & Sage

From [2026-10-06 inspection](../reports/2026-10-06-inspection.md). Written 2026-10-06.

The team owns prioritization. These are recommendations for a solo maintainer. S means roughly half a day, M means one to three days, L means several days or more; estimates are planning judgments, not measured delivery times. Existing issue links are reused rather than duplicated. No implementation or publication is authorized by this inspection alone.

## Fix now: red

### 1. Make the component installation path work

- Station: 1, coverage and distribution.
- Evidence: [verified] Public npm returns E404 for `@stevegreco/design-system-components`, while the [docs generator](../../apps/documentation/lib/component-pages.ts) instructs installing it. Tokens are available at 0.0.5.
- Why first: consumers and agents cannot use the components through the advertised install path, regardless of local quality.
- First move: prepare and inspect a package tarball, verify its CSS assets, types, registrations and token dependency, and decide whether to publish or document a supported preview installation. Perform publication only with the maintainer's authorization.
- AI assist: prepare a clean consumer fixture and check the package. The maintainer decides release readiness and publication.
- Done when: a clean project can follow the published installation instructions, render Button/Text field/Checkbox, and submit their values. The documented distribution method actually resolves.
- Effort: M, including release verification.

## Schedule: yellow

### 2. Fail contrast checks when tokens disappear

- Stations: 3 and 5.
- Evidence: [verified] An isolated copy with an on-action foreground deleted in both themes reports six missing pairs but returns zero failures. [Reproduction](../evidence/2026-10-06/missing-pair-result.txt), [audit source](../../packages/tokens/scripts/audit-contrast.js), existing [#171](https://github.com/stevegreco/design-system/issues/171).
- First move: count missing pairs as failures and add a deletion/rename regression. Review the pair list against actual component color combinations.
- Done when: a missing pair makes the token build fail; current light/dark tokens pass; exemptions remain explicit.
- Effort: S. Suggested timing: first sprint, before further token changes.

### 3. Add stylesheet setup to agent retrieval

- Stations: 9 and 10.
- Evidence: [verified] The [fresh-agent trace](../evidence/2026-10-06/self-audit.md) cannot discover the tokens CSS export from CLI records; the [installation page](../../apps/documentation/docs/getting-started/installation.mdx) already names it. The generated composition is incomplete.
- First move: expose the existing web setup guidance through the implementation/query route, including `@stevegreco/design-system/css`, registration and bundler requirements. Keep web names out of the technology-neutral contract.
- Done when: a fresh agent with only documented retrieval access produces a complete, renderable settings form with zero invented imports or attributes. Save the command trace and run the page.
- Effort: S to M. Suggested timing: first sprint, alongside distribution.

### 4. Run accessibility checks in both themes

- Stations: 3 and 5.
- Evidence: [verified] Storybook config enables axe reporting, but [CI](../../.github/workflows/ci.yml) does not traverse stories. Existing [#163](https://github.com/stevegreco/design-system/issues/163) defines acceptance; [#162](https://github.com/stevegreco/design-system/issues/162) covers accessibility-tree helpers.
- First move: execute every story with axe in light and dark themes and include a realistic composition. Add a short manual screen-reader checklist for forms and Dialog.
- Done when: a deliberate story violation fails CI; both themes run; manual checks document browser, assistive technology, date and result.
- Effort: M. Suggested timing: this month, after item 2.

### 5. Add a small visual regression gate and enforce completeness

- Station: 5.
- Evidence: [verified] Behavioral tests pass but no screenshot baselines exist in the inspected suites. The [completeness script](../../.agents/skills/create-component/scripts/status.mjs) is manual. Existing [#161](https://github.com/stevegreco/design-system/issues/161).
- First move: add stable light/dark screenshots of a settings form and Dialog with composed actions; run completeness for all discovered components in CI.
- Done when: a missing required artifact or a meaningful visual change fails a reviewable gate. Baselines avoid unstable external fonts/network behavior.
- Effort: M. Suggested timing: this month, before the next broad token/style change.

### 6. Reconcile stale guidance with current behavior

- Stations: 6 and 7.
- Evidence: [verified] Installation guidance omits automatic system theme selection; ADR 0003 still points at `packages/knowledge`; contrast comments say report-only; spec CHANGELOG advertises old public names. [Inspection station 6](../reports/2026-10-06-inspection.md#station-6-orchestration-yellow-610), existing [#173](https://github.com/stevegreco/design-system/issues/173) and [#175](https://github.com/stevegreco/design-system/issues/175).
- First move: update theme instructions, obsolete paths and current Unreleased API names. Preserve historical release entries as history. Add focused checks for setup/theming examples and current command references.
- Done when: current docs agree with OS-theme behavior, current package/API names and blocking audit behavior; links and examples resolve.
- Effort: S. Suggested timing: first sprint.

### 7. Write one accurate workspace release and contribution guide

- Station: 7.
- Evidence: [verified] [README](../../README.md) says to publish at the private root. Tokens/components have no changelogs; no contribution/ownership templates were found. Existing creation rules and merged PRs show a working development process.
- First move: document which packages ship, their ordering and version policy, the maintainer, required checks, migration notes and a clean consumer smoke test. Add a compact contribution entry point linking compose-or-propose and the creation workflow.
- Done when: someone can follow the guide without inferring package names, permissions, version changes or release ordering; release notes describe public changes.
- Effort: S to M. Suggested timing: before the next release; coordinates with item 1.

### 8. Establish a consumer baseline before expanding coverage

- Stations: 1 and 8.
- Evidence: [verified] Internal feedback issues and retrieval research exist, but no consumer/version register or product evidence was available. The inventory has 11 components and three guidance/example records. Existing [Field shell #101](https://github.com/stevegreco/design-system/issues/101) is a concrete candidate, not automatic permission to build it.
- First move: record consumer project, package version, components used, bespoke replacements and one upcoming need. If there are no external consumers yet, record that explicitly. Review prospective missing components against this evidence and compose-or-propose.
- Done when: coverage and actual adoption have separate counts, the top unmet needs have supporting examples, and feedback identifies a concrete next backlog decision.
- Effort: S for intake; M for a few consumer scans. Suggested timing: this month, before adding a broad staple set.

### 9. Settle the size vocabulary without casual breaking changes

- Station: 4.
- Evidence: [verified] [Button](../../packages/components/src/button.d.ts) uses `sm/md`; [Icon](../../packages/components/src/icon.d.ts) uses `small/medium/large`. Current mappings are individually correct.
- First move: record whether these are intentionally distinct APIs, document their correspondence, and define a convention for new components. If renaming is chosen, plan versioning and migration first.
- Done when: new components have an explicit vocabulary decision and validation detects unexpected drift. Existing consumers retain a documented upgrade path.
- Effort: S for the policy; M if migration is chosen. Suggested timing: before the next component with sizes.

### 10. Verify agent retrieval outside this repository

- Station: 10.
- Evidence: [verified] Local CLI and MCP tests pass, but [spec package files](../../packages/spec/package.json) omit the web implementations in `apps/documentation/implementation`; [repository config](../../spec.config.json) depends on that local path.
- First move: document how a consumer gets implementation mappings, then test that route in a clean project through CLI or stdio MCP. Reuse the settings-form generation task after item 3.
- Done when: a consumer agent can search, retrieve web mappings and resolve setup without access to this monorepo checkout. Record the supported integration and actual result.
- Effort: M. Suggested timing: with the first usable public components release.

## Access upgrades

- No design-tool connection is needed unless a design library is introduced.
- GitHub CLI reads worked; reconnecting the connector is optional convenience, not a prerequisite.
- Consumer repositories and a named consumer baseline would sharpen Stations 1 and 8.
- Public docs URL and a clean installed-package fixture would verify distribution and external agent access.
- Branch-protection settings and recent release communications would sharpen Station 7. These remain unknown, not asserted failures.

## Keep the green healthy

- Station 2: continue native semantics, shared focus/form utilities and token-intent review. Respect recorded geometry and token-tier exceptions rather than replacing them blindly.

## Cadence

- Suggested deep re-inspection: 2027-01-06. Recheck Station 1 as soon as the distribution work is complete.
- Existing everyday gates: build, lint, formatting, spec validation through tests, browser behavior, example verification and token audits.
- Add now: missing-pair failure. Add this month: both-theme axe, small visual baselines and completeness checks. Add with release: clean consumer and agent setup smoke tests.
- Proposed owner: solo maintainer, assignment unconfirmed. Review this work order during release planning and monthly backlog review.
- No automation has been created; this file is the saved follow-up record.
