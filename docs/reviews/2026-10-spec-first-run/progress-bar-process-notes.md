# Progress bar run: process notes

Running log while building Progress bar spec-first (PR #242). Likes (+), dislikes (-), spec issues (S), observations (o). Items already raised by the Card, Spinner or Accordion runs are marked "(again)" and kept short.

## Orientation
- (+) AGENTS.md plus the three skills are still enough to start. No other reading was needed.
- (o) The brief asked me not to touch the shared index files to avoid merge conflicts. The process has no notion of this: the implementation scaffold writes `src/index.js`, `src/index.d.ts` and the host-checks row itself (see Phase 2).

## Phase 1: spec
- (+) `compose-or-propose` plus Spinner's own avoid entry ("a determinate progress indicator ... The system has no determinate indicator yet") made the case for the component in one step. A prose `instead` worked as a to-do marker here, by accident.
- (-) Search has no sense of meaning: `search "how far along"` returns Tabs; `search progress` returns only Spinner (by tag). Fine here, but an agent can't tell a miss from a gap.
- (+) `component:status --phase spec` now prints "run `pnpm spec validate` for the schema and links". Better than the earlier silent "No required items missing", but it still doesn't run the check itself.
- (S) (again) Prose `instead` is rendered as "Use <instead> instead.", so "a meter, or the value as text" became "Use a meter, or the value as text instead." I only saw it in `get` output and had to shorten it to "a meter". The template is invisible from the YAML.
- (S) The defining decision of this component (determinate only, not indeterminate) had nowhere to go in a draft except the description. Same gap Accordion hit with "independent vs one at a time". Open questions went into the PR description, which is lost after merge.
- (S) Anatomy roles fit well: label / container (track) / indicator (fill). The role list being small helped.

## Phase 2: implementation
- (S) (again, top fix) `validate` still accepts a token that doesn't exist. I guessed `primitives.duration.normal` (the scale is fast/base/slow/xslow): `validate` said OK and only `spec tokens --resolve` showed empty light/dark cells. Third run in a row to hit this; it is the single highest-value check to add.
- (+) The "decide what it ships" list again forced good decisions, and `covers:` let one rationale settle three items. All ten went green on the first try.
- (S) `kind: number` has no min/max (again). Value is 0..max and max must be positive; both live in prose in the parameter description and in a rule, with nothing checking they agree.
- (S) No way to mark a parameter required. Label is required for this component; the schema only has `default`, so "Required" is a word in the description. Card/Spinner sidestepped it with defaults.
- (S) A gap between two parts (label above track) has no home: there's no part for the whole component, so `gap` sits on `label`, which reads as the label's inner gap. A root/`host` part, or allowing a top-level condition map, would fix it. Spinner and Accordion had the same "property on the wrong part" problem.
- (-) **Biggest process friction this run: there is no way to add a component without editing the shared files.** `component:new --phase implementation` writes the `src/index.js`, `src/index.d.ts` and `test/host-checks.test.js` entries itself, `component:status` fails until they exist, and two tests (`package-root` "registers every component" and host-checks "has a row for every component in src/") fail without them. So "don't touch the barrel" means the component branch is knowingly red on those checks until the barrel PR lands. Fixes, simplest first: (a) generate the barrel from `src/*.js` at build time instead of hand-maintaining it, (b) keep one file per component in `test/host-checks/<name>.js` and glob them, like `package-root` already does for components. Either removes the conflict entirely.
- (o) I kept the entries out of the commits and saved them as a patch for the final barrel PR: `progress-bar/barrel-entries.patch` in project files.
- (-) (again) The scaffold puts the new host-checks row at the top of the table and appends index entries at the end. Spinner's row on main still has the scaffold's `// TODO` comments, so nothing catches leftover TODOs outside the spec.
- (+) The failing-test-per-MUST-rule scaffold again made the rules sharper. All 18 tests failed for the right reason before the runtime existed, then passed on the first runtime pass.
- (S) `exposedNodes()` returns only role and name (again). A determinate progress bar's whole point is its value and range, so I wrote a local `exposedRange()` that re-reads the tree for `valuenow/min/max`. The shared helper should return these properties; I didn't change it to avoid conflicts with the parallel threads.
- (+) "Point the neighbors at it" worked well this time: Spinner's avoid entry "a determinate progress indicator" became `component.progress-bar`. That prose `instead` was effectively a TODO left for this component. A way to mark prose `instead` as "planned" would make these findable without grep.
- (o) Storybook a11y check is still manual in the skill. I scripted axe-core over the built Storybook, 5 stories x light/dark: no component violations (only page-level landmark/heading rules that Storybook's own panel disables).
- (o) Environment (again): Playwright wants headless shell 1234, the container has 1194, and the directory layout differs too (`chrome-headless-shell-linux64/chrome-headless-shell` vs `chrome-linux/headless_shell`). A plain directory symlink no longer works; I had to link the files and the binary name. `--env-mode=loose` still needed.

## Phase 3: docs
- (+) The docs scaffold and "break each step once" loop are still quick: four mutations, each failed with its step name, no rebuild needed for `.verify.js` changes.
- (-) Docs depend on the barrel too: the example imports the package root, and the type-check test reads `ElementAttributes` from `index.d.ts`. So without the shared entries the docs test fails twice more (type-check and the Verify run). Four red tests total on this branch, all from one missing barrel.
- (o) Locator gotcha worth a line in the skill: `locator.getAttribute()` waits up to 30s when the element is gone, so a loop that samples a value until the element leaves needs `{ timeout }`. I hit this writing the "only moves forward" step.
- (S) The SHOULD rule `only-moves-forward` is only proven by the docs Verify step, same as Spinner's `delay-short-waits`. The docs example is effectively the test for SHOULD rules; the process could say so.
- (o) Preview prose `.mdx` still shows as `warn (optional)`. Noise for an optional item (again).

## Summary for the spec system
1. **Make components addable without touching shared files** (generate the barrel; one host-check file per component). This was the only real blocker for parallel work, and it is a tooling fix, not a spec-format change.
2. **Validate token references** in `spec validate`. Hit again (third run).
3. **Small schema additions that keep it simple:** `required: true` and `min`/`max` on parameters; a whole-component part (or top-level tokens) for gaps between parts. Each removes prose that nothing checks.
4. **Give drafts one optional `open-questions` list**, so the defining decision (determinate only) and the open API questions live in the record, not only in a PR description.
5. Test helper `exposedNodes()` should return range/state properties (value, min, max, level, expanded), so progress, accordion and future range components don't each write their own tree reader.

What worked without changes: the three-skill flow, the spec scaffold plus validate loop, the "decide what it ships" checklist with `covers`, failing tests per MUST rule, and `spec tokens --resolve` for review.
