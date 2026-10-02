# Component creation feedback

This log accompanies the spec-first addition of Radio group, Switch, Text area, Select, and Dialog on October 2, 2026. Component behavior belongs in the knowledge records; this document records observations about creating them.

## Review sequence

Three agents drafted contracts before implementation. The integrating agent reviewed each draft and ran knowledge validation before authorizing runtime work. Review caught a collection modeled as a string parameter, copied examples from Text field, and an off-state Switch thumb token that would lack contrast against the surface.

## Findings

- **Option collections need a modeling decision.** The current schema supports scalar parameters but cannot describe labeled options with values and disabled state. Radio group and Select express choices through anatomy and rules, with the concrete composition API in implementation documentation. A future schema change should be driven by these two examples rather than treating a collection as a string.
- **Validation does not establish contract fidelity.** A valid record can still contain copied examples or a token condition that does not describe the intended state. Review needs to compare the spec, CSS, runtime, and tests explicitly.
- **Shared tests assume one simple control.** The host-check table begins with text-only fixtures and a generic typing trigger. Choice collections and a closed modal require setup and interaction hooks to join shared checks without misleading exclusions.
- **Integration has several manual registries.** Runtime exports, type exports, JSX attribute maps, package-root tests, and shared host-check rows all need entries. The completeness script is useful, but these edits need a single owner during parallel work.
- **Clean worktree dependencies affect the first query.** This worktree had no node_modules. After installing locked dependencies, the direct knowledge entry point worked. The pnpm launcher stalled in the sandbox; invoking the existing Node CLI preserved the same query and validation behavior.

- **Inventory assumptions appear outside the checklist.** Knowledge content tests hard-code record counts and IDs, and a docs test used Dialog as its unknown component. New components require updating these fixtures too. The status script does not detect them.
- **Token references need validation beyond schema shape.** The schema accepted a nonexistent Dialog font-weight token. Auditing against the published token JSON caught the error before completion.

- **Browser activation can leak between tests.** PR review found that Dialog’s initial Escape test passed after unrelated interactions gave Chromium permission to cancel its native event. A fresh-document regression now covers repeated Escape with no prior activation.

- **Document keyboard handlers need ownership and composition tests.** Follow-up review caught lower dialogs handling the active modal’s Escape and capture listeners overriding child controls. Regressions cover modal stacking, child default prevention, stopped propagation, and IME composition. Stopped propagation also needs native automatic dismissal disabled; the web binding documents the resulting `closedby` requirement.

- **Desktop keyboard workarounds must preserve platform close requests.** A later review found the event-path guard ignored body-focus Escape, and unconditional `closedby="none"` removed system back dismissal. The active-dialog stack now owns keyboard handling without requiring focus inside the host. Dismissible dialogs enable native close requests. The stopped-propagation guarantee from the prior iteration is withdrawn; child controls must prevent Escape’s default behavior. Native requests and focus fallback have regressions; Android hardware behavior remains unverified.

## Component notes

Detailed observations live in [Radio group and Switch](component-creation-radio-switch.md), [Text area and Select](component-creation-textarea-select.md), and [Dialog](component-creation-dialog.md).

## Verification

- All five creation-status checks report no required items missing. Optional preview prose and navigation ordering remain optional.
- Knowledge validation passes for all 14 records. Token references were checked against the published token JSON; every reference resolves.
- The full repository build passes, including documentation and Storybook.
- The full test run passes: 221 Chromium component tests, 148 knowledge tests, 32 documentation tests, and 23 token tests. The documentation run exercises all 11 examples, including the five additions, and checks JSX types and API mappings.
- An axe audit of all 27 new Storybook stories in light and dark themes reports zero WCAG A/AA violations across 54 scans. Default states and the open Dialog were also inspected visually. Browser behavior was verified in Chromium; this is not a Firefox or Safari compatibility audit.
- Lint, formatting, and diff whitespace checks pass.

Independent review found and corrected Radio group focus loss on host updates, unsafe focus calls for empty or disabled groups, stale form values during Switch input events, and missing disabled styling on Radio group messages. Regression tests cover those findings. Existing Checkbox and Text field alternatives now resolve to the new component records.
