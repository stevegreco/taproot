# Spinner: process notes (running log)

Spec-first build of Spinner through spec-component → implement-component → document-component.

## Spec phase

- LIKE: `pnpm spec search` for spinner/progress/loading returned nothing for spinner and the
  `rationale` entries in other specs ("no loading state") showed up via grep, which confirmed the
  gap quickly. But `search "loading"` only hit Alert — the CLI search does not index `rationale`
  text, so the half-dozen "no loading state" decisions across components were invisible to it.
- LIKE: `component:new --phase spec` scaffold is minimal and `spec validate` lists each TODO with a
  line number. Fast feedback loop.
- DISLIKE: `component:status spinner --phase spec` says "No required items missing" while
  `spec validate` fails on 7 TODOs. Status should run (or at least count) validate.
- SPEC-WRITING: `avoid[].instead` is a record ID *or* free prose. For a gap component, most good
  alternatives don't exist (determinate progress, skeleton/placeholders, "do nothing"). Prose works,
  but there's no way to mark "planned component" vs "never a component", so links can't be
  backfilled later by tooling.
- SPEC-WRITING: the guideline compose-or-propose doesn't clearly say which bucket Spinner is in.
  It's a "new component whose behavior comes from a standard platform control plus tokens"? Not
  quite: it's an animated graphic + live-region-ish semantics. Had to judge.
- SPEC-WRITING: a draft has no place for open questions (skill says put them in the PR). That means
  the questions that matter most for review (does Button get a loading state? does Spinner announce?)
  live outside the source of truth and are lost when the PR merges.
- SPEC-WRITING: anatomy roles are a closed list (interactive-surface, label, description,
  indicator, container). Spinner fits `indicator`, fine. A visually-hidden label has no role
  (it's an accessible name, not a part) — unclear whether to model it as anatomy.
- DISLIKE: I accidentally dropped `status: draft` while rewriting the file and `spec validate`
  said "OK". Only `component:status --phase spec` caught it. Draft-ness is a process invariant
  enforced in two different tools.
- SPEC-WRITING: prose `instead` is rendered as "Use <instead> instead." So the author has to write
  a lowercase noun phrase that reads in that template ("no indicator", not "Nothing, show the
  result"). The template is invisible from the YAML; only `get` reveals it.
- SPEC-WRITING: `avoid[].instead: component.x` creates an `alternative` link; adding the same id
  to `links.related` duplicates it in `get` output. Not documented as redundant.
- CLI: "one-word search tolerates typos" — `search lodaing` returned nothing (transposition).
- CLI: `search` only indexes some fields; rationale text ("no loading state" in 8 specs) isn't
  searchable, so you can't find "who decided against X".
- PROCESS: skill says pause for review after each commit. In an agent-driven run with an absent
  reviewer, the pause is the whole point but there's no mechanism (no review gate, label, or
  status field) — it's honor system in prose. I proceeded through all phases per the request.
- DUPLICATION: skills exist in both `.claude/skills` and `.agents/skills` (identical copies, plus
  design-tokens only in .agents). Two copies to keep in sync.

## Implementation phase

- LIKE (big): `component:new --phase implementation` reads the spec and generates a failing test
  per MUST rule named `[rule-id] statement`, property accessors with spec defaults (label →
  "Loading"), d.ts, api rows, stories with controls, index + host-check rows. This is the best
  part of the process: the spec directly drives code. Every test failed for the right reason first.
- LIKE: `component:status --phase implementation` "decide what it ships" checklist (disabled,
  loading, sizes, RTL, reduced motion, forced colors…) forced real decisions. Forced colors
  surfaced a real bug-in-waiting: arc and track would both become CanvasText and the spinner
  would look still. Fixed and tested.
- DISLIKE: the checklist accepts any rationale with a `covers` marker, so it checks that you
  *wrote something*, not that the spec and code agree. My first forced-colors rationale was wrong
  about how the CSS behaved and status said "ok".
- SPEC-FORMAT GAP: token values can't express derived values. Reduced motion = 3× the turn
  duration; stroke = size / 8. Neither fits `property: token`. Both ended up as prose in rules
  and rationale. A spinner is mostly derived geometry and timing, so the `tokens` map says little.
- SPEC-FORMAT GAP: token references must be tokens, `transparent`, or `none`, but Icon already
  uses `inherit` and I needed `linear` easing (no linear easing token exists). Validator accepts
  any string, so the documented constraint isn't enforced and the escape hatch isn't documented.
- SPEC/REPO MISMATCH: I mapped stroke to `primitives.border.thick` in the spec; `spec validate`
  passed, then `test/stylesheets.test.js` failed because CSS may not use radius/border
  primitives. The token-tier rule lives in a CSS test, not in spec validation or the gotchas.
  The spec could hold a choice the implementation is forbidden to make.
- SPEC-FORMAT: `tokens` properties are free-form (`track`, `size`) — fine for expressiveness,
  but nothing tells a reader that `track` is a border color on the same part.
- SPEC-FORMAT: anatomy forced the track into the `indicator` part (one part) since the track is
  not a separately meaningful piece; tokens for the track then live as a made-up property.
- ENVIRONMENT: browser tests fail in a fresh container: Playwright wants
  chromium_headless_shell-1234, the image has 1194. Worked around by symlinking. Also turbo
  strict env mode drops PLAYWRIGHT_BROWSERS_PATH, so `pnpm test` needs `--env-mode=loose`.
  First `pnpm test` reported spec tests as failed, but they were just cancelled when components
  failed; misleading.
- DISLIKE: "Check that the Accessibility panel reports no violations in both themes" is a manual
  UI step. Agents can't click Storybook; I scripted axe-core over the built Storybook per story ×
  theme with Playwright. That script should be a repo task.
- DISLIKE: "Point the neighbors at it" step found nothing because neighbors mention loading only
  in `rationale` (e.g. Tabs: "a panel that loads its own content shows its own progress"), and
  the step only covers `avoid` entries. Left as is.
- NOTE: implementation/icon.md doesn't follow the required three-section body (Slots, hidden,
  Framework notes) that the skill asks for; alert.md does. Inconsistent references.
- NOTE: scaffold appends index.js/index.d.ts entries at the end (not alphabetical) and puts the
  host-checks row first. Cosmetic, but a reviewer will ask.
- LIKE: visual check via screenshots caught a real design issue: track in border.default was too
  close to the arc. Switched to border.subtle. Nothing in the process asks for a visual check.

## Docs phase

- LIKE: `component:new --phase docs` writes the exact Verify header and a placeholder step that
  fails, and the "break each step once" instruction is easy to follow because `.verify.js` changes
  need no rebuild. All four steps were seen failing with their step name.
- DISLIKE: `eventually(read, 0)` is the obvious way to assert "no spinner yet", but it also passes
  for a spinner that appeared and left. Negative/timing checks need a one-shot read; the skill
  doesn't warn about this (the component gotchas do, for unit tests, in a different form).
- SPEC → DOCS: the example is where the SHOULD rule `delay-short-waits` became real (timer before
  showing). It's the only place that rule is exercised; SHOULD rules have no test requirement,
  so the docs example is effectively their test. Worth making explicit.
- NOTE: `component:status --phase docs` warns on the optional `.mdx` preview prose. A `warn` on an
  optional item is noise.
- ENV: docs tests needed the same Playwright workaround; Google Fonts fetch fails in the sandbox
  build (harmless warnings).

## Overall

- The spec-first flow worked. The draft is quick, and the implementation scaffold that turns MUST
  rules into failing tests is the strongest link between spec and code.
- The weakest part is that the spec can say things no tool checks against the implementation
  (token tier, derived timing/geometry, forced-colors behavior). The process relies on a reviewer
  to read spec and code side by side.
- The spec format is thin for motion/geometry-driven components. Spinner's tokens map carries
  color and duration, and its most important facts (stroke ratio, reduced-motion speed, arc vs
  track) live in prose.
