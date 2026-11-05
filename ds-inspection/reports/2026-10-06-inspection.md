# Multi-point inspection report: Ember & Sage

Inspected: 2026-10-06. Technician: Codex. First inspection in this folder.
Vehicle profile: [GARAGE.md](../GARAGE.md). Baseline: `f902a0f`.

## The short version

The local system is substantially better tested and documented than its public installation path suggests. All 11 components have specs, implementation docs, examples, verification steps and stories, and a fresh run passed 436 tests. The components package nevertheless returns 404 on public npm, so the generated component-page install instructions cannot currently work for an external consumer. The contrast audit silently skips missing pairs, and a fresh agent using the spec CLI could not find the required token stylesheet import. Make distribution usable first, then close those two gaps before adding more components.

**Overall: 62/100**, a conversation starter, not a grade. Fix the red, schedule the yellows, re-run on a cadence. All stations have some evidence; none is N/I. This is a solo, code-first assessment with limited evidence for product coverage and adoption.

## Inspection sheet

|  # | Station                         | Quality      | Light  |      Score |
|---:|:--------------------------------|:-------------|:------:|-----------:|
|  1 | Coverage & gaps                 | Complete     |  RED   |       3/10 |
|  2 | Best practices                  | Sound        | GREEN  |       8/10 |
|  3 | Accessibility                   | Sound        | YELLOW |       7/10 |
|  4 | Shared language                 | Sound        | YELLOW |       7/10 |
|  5 | Testing & validation            | Sound        | YELLOW |       7/10 |
|  6 | Orchestration                   | Synchronized | YELLOW |       6/10 |
|  7 | Governance & version control    | Extensible   | YELLOW |       5/10 |
|  8 | Feedback & adoption             | Extensible   | YELLOW |       5/10 |
|  9 | Machine-readable docs & context | AI-ready     | YELLOW |       7/10 |
| 10 | Agent access                    | AI-ready     | YELLOW |       7/10 |
|    | **Overall**                     |              |        | **62/100** |

**Lights:** 1 green, 8 yellow, 1 red, 0 not inspected.

Red is 0–3, broken or missing. Yellow is 4–7, a gap to schedule. Green is 8–10, healthy in the inspected scope. N/I means no evidence, never a guessed score.

## Evidence basis

- Live repository and generated documentation files; spec CLI queries; full uncached Turbo build/test run; token audits; lint; authenticated GitHub CLI reads; public npm metadata; one fresh-agent generation probe.
- Station finding bullets: 30 `[verified]`, 0 `[reported]`. Intake contains two reported facts, no design library and one maintainer, kept separate from technical findings.
- Code sample read fully: Button, Checkbox, Dialog, Select and Text field. API sweep: all 11 `.d.ts` files and implementation mappings. Full inventory, build and automated tests cover all 11 components; that does not mean every implementation was manually reviewed.
- Fresh checks: 23 token tests, 221 component tests, 159 spec tests and 33 documentation tests. Eight Turbo tasks succeeded with zero cache hits. [Saved test log](../evidence/2026-10-06/tests.log).
- [Spec validation](../evidence/2026-10-06/spec-validation.log): 14 records, no issues. [Token audit](../evidence/2026-10-06/tokens.log): 45 configured pairs per theme, including two disabled exemptions, 108 matching semantic tokens, 20 interaction states and eight ramps. [Lint](../evidence/2026-10-06/lint.log) passed.
- [GitHub snapshot](../evidence/2026-10-06/ds-inspection-issues.json): all 13 open issues returned by a limit-30 query. [CI snapshot](../evidence/2026-10-06/ds-inspection-ci.json): three latest runs successful, including inspected HEAD.
- Industry component benchmark uses the skill's staple list and the inspector's general knowledge, with lower confidence. No design-system knowledge MCP was available; Carbon's official overview could not be fetched. Missing categories are candidates, not proof that consumers need them.
- Accessibility reference: [W3C contrast minimum guidance](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) supports the 4.5:1 ordinary-text threshold and inactive-control exemption. This is not a whole-system WCAG conformance audit.
- Initial tooling failed because dependencies were absent. Locked dependencies were installed and aligned with pinned pnpm 11.22.0. An initial Turbo run replayed cached results; the reported verification is the subsequent `pnpm exec turbo run test --force` run.

## Station records

### Station 1: Coverage & gaps. RED, 3/10

- Inventory: design N/A; 11 code components; 11 spec component records; 11 implementation files; 11 live examples, Verify scripts and Storybook story files. Local set is Badge, Button, Checkbox, Dialog, Icon, Link, Radio group, Select, Switch, Text area and Text field.
- Evidence: live repository inventory, CLI and public registry.
- Findings:
  - [verified] Public distribution is incomplete. `npm view @stevegreco/design-system version` returned `0.0.5`; `npm view @stevegreco/design-system-components version` returned E404. The [component-page generator](../../apps/documentation/lib/component-pages.ts) emits installation of both packages. Package metadata declares public access but does not prove publication. The red is for this unusable consumer path, not for the component count.
  - [verified] Local code/spec/docs membership agrees for all 11 components. Button and Checkbox completeness scripts report no required items missing. [Runtime exports](../../packages/components/src/index.js), [documentation implementations](../../apps/documentation/implementation/), and `spec list --json` establish the set.
  - [verified] Tokens cover color, typography, spacing, radii, elevation and motion, with primitive/semantic tiers and an optional Button component tier. The 14-record spec has one pattern, one guideline and one worked example. It has no dedicated Tabs, Menu, Table, Alert, Tooltip, loading/empty/error pattern or form-validation pattern records. [Spec inventory command](../../AGENTS.md) is the authoritative query route. Field shell is already tracked in [#101](https://github.com/stevegreco/design-system/issues/101).
- Not inspected: actual product needs, design parity and full published token tarball contents. Native layout and composed token recipes can cover some absent names.
- Deviations: no Figma requirement; optional component tokens and fixed checkbox geometry are accepted decisions.
- First move: make the documented component installation succeed in a clean consumer project, or explicitly document a supported preview installation path.

### Station 2: Best practices. GREEN, 8/10

- Sample: five components named in the evidence basis; Button/Checkbox/Dialog implementation guidance; installation page; compose-or-propose guideline.
- Evidence: live code and CLI.
- Findings:
  - [verified] Format: the sample uses native `button`, `input`, `select` and `dialog` semantics, scoped shadow styles and shared focus forwarding. Form controls use ElementInternals for submit/reset behavior. [Shared implementation](../../packages/components/src/internal/element.js), [Button](../../packages/components/src/button.js), [Select](../../packages/components/src/select.js).
  - [verified] House conventions: component CSS consumes published semantic/component tokens, with permitted primitive use. Checkbox's 16px size is component geometry documented by `spec get checkbox#rationale`; Dialog uses logical dimensions and responsive viewport bounds. [Checkbox CSS](../../packages/components/src/checkbox.css), [Dialog CSS](../../packages/components/src/dialog.css), [token ADR 0003](../../packages/tokens/docs/adr/0003-token-tier-consumption.md).
  - [verified] Documentation: component pages consistently assemble intent, preview, usage, API and accessibility from the spec and implementation mapping, rather than manually repeating contracts. [Page generator](../../apps/documentation/lib/component-pages.ts).
- Not inspected: design-tool craft, every runtime end to end, vertical writing-mode behavior or all supported browser engines.
- Deviations: primitive spacing/motion and optional component aliases are allowed. Fixed control geometry is not automatically a token defect.
- First move: retain the existing native-control and token-consumption review discipline.

### Station 3: Accessibility. YELLOW, 7/10

- Sample: five interactive components; light and dark code tokens. Design side N/A.
- Evidence: source, executed audits and browser suite.
- Findings:
  - [verified] Dialog tests exercise real Tab/Shift+Tab containment, focus restoration, nested shadow controls and Escape cancellation. Checkbox tests cover label activation, Space, error descriptions and forced colors; shared host checks cover visible keyboard focus. [Dialog tests](../../packages/components/test/dialog.test.js), [Checkbox tests](../../packages/components/test/checkbox.test.js), [host checks](../../packages/components/test/host-checks.test.js).
  - [verified] The configured contrast audit passed both themes, but deleting `color.foreground.on.action.primary` in an isolated copy printed six missing pair checks and returned zero failures. `report()` returns only `failures.length`. [Audit source](../../packages/tokens/scripts/audit-contrast.js), [reproduction result](../evidence/2026-10-06/missing-pair-result.txt), existing [#171](https://github.com/stevegreco/design-system/issues/171). A passing audit does not cover every rendered pairing.
  - [verified] Storybook enables the accessibility addon and `a11y.test = error`, but CI runs no Storybook axe traversal. No manual screen-reader plan was found in the inspected guidance. [Preview config](../../apps/storybook/.storybook/preview.js), [CI](../../.github/workflows/ci.yml), existing [#163](https://github.com/stevegreco/design-system/issues/163).
- Not inspected: manual assistive-technology behavior, touch-target exceptions and whole-product conformance. No current contrast failure was established for the audited pairs.
- Deviations: disabled contrasts are computed but exempt; no animation needs no reduced-motion override.
- First move: close #171, then automate #163 and document a short human screen-reader pass.

### Station 4: Shared language. YELLOW, 7/10

- Sweep: all 11 typed APIs and implementation maps; five component traces through CLI mappings and runtime.
- Evidence: live source and spec queries.
- Findings:
  - [verified] Form controls share `label`, `hint`, `error`, `name`, `value`, `disabled` and applicable `required`, with input/change events. Button's `action` to `type`, `accessibleName` to `aria-label`, and activate to click mappings are explicit. [Types](../../packages/components/src/index.d.ts), [Button mapping](../../apps/documentation/implementation/button.md).
  - [verified] Two size vocabularies coexist: Button `sm/md`, Icon `inherit/small/medium/large`. Both contracts and runtimes agree individually, but no cross-component size convention was found. [Button types](../../packages/components/src/button.d.ts), [Icon types](../../packages/components/src/icon.d.ts). Do not rename a released API merely to make it uniform; document the correspondence or plan a versioned change.
  - [verified] Record/link and implementation-map validation catch unknown references and incomplete mappings, but runtime APIs are maintained separately. They do not enforce a shared naming vocabulary across components. [Implementation checks](../../packages/spec/test/implementation.test.js), [creation workflow](../../.agents/skills/create-component/SKILL.md).
- Not inspected: design token naming parity. Distinct variant vocabularies for different concepts are not treated as defects.
- Deviations: technology-neutral parameter names intentionally differ from web attributes.
- First move: document a short size vocabulary policy and add a focused check for future components.

### Station 5: Testing & validation. YELLOW, 7/10

- Inspected: CI, all executed package suites, and behavioral assertions for Checkbox, Text field and Dialog.
- Evidence: live source and uncached execution.
- Findings:
  - [verified] CI runs lint, formatting, build, generated-source cleanliness and tests on PRs and main pushes. The fresh local run passed all 436 tests and built documentation and Storybook. [CI](../../.github/workflows/ci.yml), [test log](../evidence/2026-10-06/tests.log).
  - [verified] Tests assert form submit/reset, invalid states, disabled fieldsets and keyboard behavior; docs test all 11 example Verify scripts against the built site and type-check examples. [Text field tests](../../packages/components/test/text-field.test.js), [docs tests](../../apps/documentation/test/examples.test.ts), [type test](../../apps/documentation/test/example-types.test.ts).
  - [verified] No screenshot baseline gate was found in the inspected suites/CI. The retrieval research has a defined invented-API/rule-error rubric, but no CI generation evaluator. The component-completeness script is a manual step, not a CI gate. [Retrieval evaluation](../../docs/research/agent-retrieval/README.md), [status script](../../.agents/skills/create-component/scripts/status.mjs), existing [#161](https://github.com/stevegreco/design-system/issues/161).
- Not inspected: historical flakes or coverage percentages; passing assertions are not visual validation.
- Deviations: a solo maintainer needs a small set of stable visual compositions, not a large screenshot platform.
- First move: add light/dark visual baselines for a settings form and modal composition, and run completeness checks in CI.

### Station 6: Orchestration. YELLOW, 6/10

- Compared: Button, Checkbox, Dialog, Select and Text field spec/web mappings versus source; token-source flow and generated docs.
- Token design/code diff: not applicable, no design library. Code light/dark parity is 108/108 semantic tokens.
- Evidence: live source, CLI, tests and recent PR.
- Findings:
  - [verified] Specs and docs share a reader and validated implementation mappings. A real change in [PR 177](https://github.com/stevegreco/design-system/pull/177) updated neutral contracts and web guidance together; commit `a91cfbb` changed Checkbox spec and docs in one change. [Page generator](../../apps/documentation/lib/component-pages.ts), [implementation reader](../../packages/spec/src/implementation.js).
  - [verified] Documentation still says light applies by default without explaining system dark preference. README, token CSS behavior and Storybook describe following the OS preference. [Installation page](../../apps/documentation/docs/getting-started/installation.mdx), [README](../../README.md), [theming tests](../../packages/tokens/test/css-theming.test.js), existing [#173](https://github.com/stevegreco/design-system/issues/173).
  - [verified] Token ADR 0003 still points at `packages/knowledge/content/components/`; the actual canonical package is `packages/spec`. The contrast script's opening comment still says report-only although audit.js blocks real failures. These references escaped synchronization checks. [ADR](../../packages/tokens/docs/adr/0003-token-tier-consumption.md), [audit wrapper](../../packages/tokens/scripts/audit.js), existing [#175](https://github.com/stevegreco/design-system/issues/175). Runtime behavior still relies on review/tests rather than automatic full spec conformance.
- Not inspected: design mappings, non-web platforms, full npm artifact/source diff or a complete workflow interview.
- Deviations: separate authored contract and runtime are intentional; testable links do not imply generated implementation.
- First move: close the tracked theme/comment drift and correct the obsolete ADR path; gate the specific contracts that have drifted.

### Station 7: Governance & version control. YELLOW, 5/10

- Inspected: contribution guideline, creation workflow, ADRs/RFCs, package versions, changelog, 13 open issues, recent PR and release/tag queries.
- Evidence: local files and authenticated GitHub/npm reads.
- Findings:
  - [verified] Compose-or-propose specifies composition, issue and larger design decisions; the creation workflow spans spec, runtime, tests, docs and Storybook. Changes land through merged PRs with validation evidence. `spec get guideline.compose-or-propose`, [workflow](../../.agents/skills/create-component/SKILL.md), [PR 177](https://github.com/stevegreco/design-system/pull/177).
  - [verified] No CONTRIBUTING, CODEOWNERS or PR/issue templates were found in the repository inventory. Token/components packages have no changelog. README's publish checklist says to bump and publish the root package, but root `package.json` is private. It does not explain workspace package ordering or publishing the components dependency. [README](../../README.md), [root package](../../package.json), [package manifests](../../packages/components/package.json).
  - [verified] Spec CHANGELOG's Unreleased section still names `loadKnowledge`, `knowledge` CLI/config and `knowledge://` resources, while the current README/server use `loadSpec`, `ds-spec`, `spec.config.json` and `spec://`. The open tracker contains actionable acceptance criteria, including #163 and #171, so absence of process files does not mean an abandoned backlog. [Changelog](../../packages/spec/CHANGELOG.md), [current MCP](../../packages/spec/src/mcp.js).
- Not inspected: branch protection, formal ownership beyond the reported solo maintainer, full issue age/duplicate analysis or breaking-change communications to consumers.
- Deviations: no committee or release bureaucracy is recommended for a one-person system.
- First move: write one accurate workspace release checklist with package names, versioning, changelog and smoke-test steps.

### Station 8: Feedback & adoption. YELLOW, 5/10

- Measured: one system repo, 13 open issues, component-creation research and retrieval evaluation. Zero external consumer repos or product teams inspected.
- Evidence: live issue bodies and local research, partial for this station.
- Findings:
  - [verified] Internal build feedback reaches the backlog. Issue #163 describes a concrete accessibility/composition problem found while building Icon and defines acceptance; #161 and #162 propose stronger completeness and accessibility test workflows. [Tracker snapshot](../evidence/2026-10-06/ds-inspection-issues.json), [#163](https://github.com/stevegreco/design-system/issues/163).
  - [verified] Agent retrieval research records 14 invented APIs and two rule mistakes at baseline, then zero of each after implementation retrieval improvements. Saved outputs and a method exist. This demonstrates an internal feedback loop, not product-team adoption. [Research](../../docs/research/agent-retrieval/README.md).
  - [verified] The inspected repository contains no consumer/version register, adoption dashboard or recurring inspection record. Token npm publication establishes availability only. Consumer counts, upgrades, workarounds and product-roadmap influence could not be measured from the provided access. [GARAGE access map](../GARAGE.md).
- Not inspected: real adoption rate, satisfaction, design detachment or whether private feedback channels exist. These are unknown, not absent by assertion.
- Deviations: a small consumer/version list is enough to start; no analytics platform is required.
- First move: record known consumers, component usage, current versions and one unmet need per consumer, or explicitly record that there are none yet.

### Station 9: Machine-readable docs & context. YELLOW, 7/10

- Inventory: JSON token artifacts, TypeScript APIs, validated spec/schema/rules, implementation maps, generated Markdown, llms.txt/full and agent JSON. Fresh generation test run; partial pass.
- Evidence: live CLI, generated docs and [fresh-agent trace](../evidence/2026-10-06/self-audit.md).
- Findings:
  - [verified] Deliberate machine context includes purpose, alternatives, anatomy, states, accessibility, rules and token queries. Schema validation passed all 14 records. [CLI/API README](../../packages/spec/README.md), [spec validation](../evidence/2026-10-06/spec-validation.log).
  - [verified] Built docs produced `llms.txt`, `llms-full.txt`, page Markdown and `/api/docs/pages/*.json`, with component guidance assembled from the same records. [Blume AI config](../../apps/documentation/blume.config.ts), [build evidence](../evidence/2026-10-06/tests.log). Generated output was inspected locally; public reachability was not tested.
  - [verified] The fresh agent selected correct tags, packages, registration functions and form attributes with zero invented component APIs. It could not discover `@stevegreco/design-system/css` via list/help/search/get and left the required import missing. The installation page knows the path; no setup record in the spec CLI does. [Generated snippet](../evidence/2026-10-06/profile-settings.html), [trace](../evidence/2026-10-06/self-audit.md), [installation page](../../apps/documentation/docs/getting-started/installation.mdx). This reproduces the remaining bootstrap gap in the older retrieval research.
- Not inspected: every composition task or all agent models; the incomplete snippet was not claimed as a rendered success.
- Deviations: a deliberate authored spec can stay current through validation and review; generation from runtime is not required where it would erase intent.
- First move: make web setup queryable, including token package/export and bundler expectations, then rerun this same proof.

### Station 10: Agent access. YELLOW, 7/10

- Mapped: local spec CLI, registered stdio MCP, source README/AGENTS instructions and creation workflow. Live CLI composition test run; incomplete bootstrap.
- Evidence: queries, fresh-agent trace and fresh MCP tests.
- Findings:
  - [verified] Search, get with web implementation, links, rules and resolved token lookup work through the CLI. The MCP suite passed transport/search/get/token/resource checks in the fresh spec tests. [.mcp.json](../../.mcp.json), [MCP tests](../../packages/spec/test/mcp.test.js), [test log](../evidence/2026-10-06/tests.log).
  - [verified] AGENTS and the spec README explain discovery and implementation lookup; the component-creation skill documents a repeatable build workflow. The fresh agent used this access to produce correct component markup, then stopped at the missing stylesheet setup context. [Agent instructions](../../AGENTS.md), [generation trace](../evidence/2026-10-06/self-audit.md).
  - [verified] This session did not expose repository MCP tools directly, although the configured server is executable and tested. The spec package publishes only its own files; repository config points implementations at `apps/documentation/implementation`, which is not bundled in that package's `files`. External implementation access therefore needs an explicit packaging/configuration path; it was not verified in a clean consumer. [Spec manifest](../../packages/spec/package.json), [config](../../spec.config.json).
- Not inspected: every IDE integration, consumer onboarding in practice or design-to-code access. No Code Connect requirement applies without a design library.
- Deviations: CLI is a valid agent access route; the station is not downgraded merely for using it.
- First move: close the setup-context gap and test the documented retrieval path in a clean consumer project after distribution is usable.

## Next service

- [Separate prioritized work order](../work-orders/2026-10-06-work-order.md).
- Deep inspection quarterly; suggested next date 2027-01-06. This is a recommendation, not a created automation.
- CI priorities: missing-token audit failure, both-theme axe, component completeness, selected visual compositions and a setup-aware generation smoke test. Existing build, spec validation and behavior gates should stay in place.
