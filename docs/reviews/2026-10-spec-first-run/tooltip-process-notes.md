# Tooltip run: process notes

Running log while building Tooltip spec-first (PR #243). Likes (+), dislikes (-), spec issues (S), observations (o).

## Orientation
- (+) Same as the earlier runs: AGENTS.md plus the three skills was enough to start. Nothing new to learn after Card, Spinner and Accordion.
- (o) The brief said Tooltip "needs a semantic shadow token first". It doesn't: `semantic.elevation.{xs,sm,md,lg,xl,inset}` has existed since #114, and `elevation.md` is described as "Popovers, menus…". The "Next components" doc and the earlier research doc both said there were no elevation tokens. Nothing in the spec tooling surfaces tokens, so an agent (or a planning doc) can't find them without grepping token JSON.
- (S) `spec search` only searches records, not tokens. `spec search shadow` or `spec search popover` returning the elevation tokens would have prevented the wrong premise. A `spec tokens --search <word>` (descriptions are already good) is a small, high-value addition.
- (+) compose-or-propose decided Tooltip cleanly this time: "a component that owns … an overlay" is named in the propose list.

## Phase 1: spec
- (-) `spec search tooltip` returns "No results" with no hint. Same complaint as Card. `search "hint on hover"` returns every form field (matches "hint").
- (S) The biggest decision (label tooltip vs description tooltip) defines the component, and like Accordion's "independent sections" it had to go into the description prose. Drafts still need a small place for "decisions that define this component" or open questions.
- (S) Prose `instead` renders as "Use … instead". "No tooltip" becomes "Use no tooltip instead." Spinner has the same ("Use no indicator instead."). Either allow a `none` value for `instead`, or render prose without the "Use … instead" wrapper.
- (+) `validate` + `component:status --phase spec` was a 30-second loop; the scaffold's TODOs are the right size.

## Phase 2: implementation
- (+) The decide-what-it-ships checklist again forced useful decisions (touch has no hover, disabled triggers can't show a tooltip to keyboard users, reduced motion → no animation at all).
- (S) `accessibility.keyboard` is a map (`Escape: …`), not a list. I wrote a list first; `validate` caught it ("`keyboard` must be object") but didn't say the expected shape. The error could show the expected form, or SPEC.md could have a one-line example next to the field.
- (S) Timing has no home. The hover delay (about 300 ms) and close grace period are behavior, not motion, so no duration token fits and token properties exclude geometry/timing. They live in a rule ("for a moment") plus a rationale entry plus a JS constant, with nothing tying them together.
- (S) Positioning is also outside the format: the gap between trigger and bubble and the max width are "geometry", so they're only in CSS. Fine for a v1, but every floating component (Menu, Toast, Popover) will hit this.
- (S) Required-ness again: `label` is required, written as "Required." in prose (same as Card).
- (S) There's no anatomy role for a supplied part. Tooltip's trigger is the consumer's control; I used `interactive-surface`, Card used `container` for supplied actions. A `supplied` flag or role would make "the component does not draw this" explicit.
- (-) `component:status --phase implementation` marks the barrel entries as `MISS` and exits 1, so in this run (barrel deferred to a final PR) status can never pass. A `--skip-barrel` flag, or treating barrel entries as `warn`, would let parallel runs use it as a gate.
- (-) The barrel is more than a merge-conflict file: `test/package-root.test.js` requires every `src/*.js` to be exported and registered by the root, the docs site and Storybook register components only through the root, and the docs type-check test needs the root `ElementAttributes` entry. Deferring the barrel means: CI red on one test, a subpath `defineTooltip()` call in the stories and the example, and a local `ElementAttributes` augmentation in the example. All three are harmless after the barrel lands, but a new agent would not expect them.
- (-) Merge-conflict root cause is the scaffolds: `component:new` inserts the host-checks row at the top of the table and appends index entries at the end. Every parallel component edits the same lines. Alphabetical insertion (or one file per component that the barrel globs) would remove the conflict without a separate barrel PR.
- (o) Single-element was the right call for this round, but Tooltip still wraps a child (the trigger). The host checks' `render()` puts text, not an element, in the slot, so no shared check exercises the trigger. Same family of gap as #204.
- (o) `ds-link` does not forward `aria-label`, so it can't be a tooltip trigger. Button does. Nothing in the spec says which components accept an external name; a rule like "every control accepts an accessible name from outside" would make composition predictable.
- (-) Environment, same as before: Playwright wants Chromium build 1234, the image has 1194, and turbo's strict env mode drops `PLAYWRIGHT_BROWSERS_PATH`. Symlinks plus `--env-mode=loose` again. Third run in a row to hit this.
- (-) The Storybook a11y step still needs a hand-written axe script. Five stories × two themes, 0 violations.
- (+) The tests-first loop worked well. Stubbing out the event handling made 13 of 16 tests fail for the right reason.

## Phase 3: docs
- (+) Scaffold and `-t "the tooltip example"` loop: fast and clear failure messages.
- (-) The scaffold still says "check whether examples/custom-elements.d.ts needs a ds-tooltip entry", but that file says never to add one. In this run the real answer was "the root `ElementAttributes` needs it", which is a barrel file.
- (-) "Break each step once" can give a false pass with `eventually`: expecting the bubble to stay open still passed, because the read happens before the 100 ms close delay. The skill could say "break it so the expected state never occurs", not "flip the expected value".
- (o) Preview prose skipped; the spec renders the page.

## Cross-cutting
- (+) Three phases, three commits, one PR. The process is now predictable.
- (S) The spec system has no way to say "this component needs a change elsewhere" (Link should forward an accessible name; Button's icon-only rule could point at Tooltip). Those ended up in the web API file and the PR. A `follow-ups` list on a record, or issues linked from it, would keep them with the source of truth.
- (S) Most useful next small fixes for spec UX, in order: token search in the CLI; `validate` errors that show the expected shape; scaffold inserting alphabetically; a `required` flag on parameters.
