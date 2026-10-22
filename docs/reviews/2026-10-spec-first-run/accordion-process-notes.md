# Accordion run: process notes

Running log while building Accordion spec-first. Likes (+), dislikes (-), spec issues (S), observations (o).

## Orientation
- (+) AGENTS.md is short and tells me exactly where to start: query the CLI, three phases, one skill each.
- (o) Skills live in `.agents/skills/`, symlinked from `.claude/skills/`. Works fine; `design-tokens` is not symlinked into `.claude/skills` (only in `.agents`).
- (o) Tabs already exists as a compound component, so Accordion is the second, not the first. Issue #204 describes the gaps Tabs hit.

## Phase 1: spec
- (+) `compose-or-propose` is quick to read and gives a clear decision order. It names Tabs as "owns a composite keyboard model", which helped decide Accordion is a genuine proposal (it owns expand/collapse state and heading semantics).
- (-) The search index has no synonyms: `search "expand collapse sections"` and `search disclosure` both return only Tabs (via its tag). Fine here, but an agent can't tell "nothing exists" from "the search missed it" without `list`.
- (+) `component:new --phase spec` scaffold plus `validate` reporting each `TODO:` by file and line is a great loop. Zero guesswork about which fields a draft needs.
- (-) `component:status accordion --phase spec` said "No required items missing" while seven `TODO:` placeholders were still in the file. Status should run the TODO check (or say "not checked").
- (S) Writing `avoid` entries was the real design work, as the skill promises. But `instead` must be either a record ID or prose; there's no way to say "Headings in one scrolling page" is a known non-component approach other than free text, so it isn't searchable or linkable.
- (S) An `avoid` entry pointing at Tabs already creates an `alternative` link. I also added `links.related: [component.tabs]` per the skill's advice, and `get` then lists Tabs twice. The skill could say "don't also add `related` for something you already named in `instead`", or `validate` could warn.
- (S) The draft is supposed to leave out parameters, but Accordion's identity depends on one: whether sections open independently or one at a time. I had to commit to "independently" in the description to distinguish it from Tabs. Drafts may need a place for "decisions that define the component" short of a full `parameters` block (maybe `rationale` is allowed early, or an `open-questions` field).
- (S) Tabs' own avoid entry says "A disclosure that expands in place" as prose. Once Accordion ships, that should become `component.accordion`, but the skill says not to edit other records during the draft, so it is a deferred to-do that nothing tracks.
- (-) Process friction for an agent run: the skill says "Ask for review and stop" after each commit. In a spec-first run where the person asked me to go through all phases, I opened the PR after the spec commit and kept going, noting this. A flag like "continue without pause when the requester asked for all phases" would remove the ambiguity.

## Phase 2: implementation
- (+) `component:status --phase implementation` turns the "decide what it ships" checklist into concrete questions (disabled, loading, RTL, forced colors...). It made me write ten rationale entries I would otherwise have skipped. `covers:` is a nice way to close each one.
- (+) `component:new --phase implementation` generating one failing test per MUST rule, named `[rule-id] statement`, is the best part of the process. Writing the tests from rule text made the rules sharper (I reworded two before coding).
- (-) The implementation scaffold breaks on a hyphenated parameter name. `heading-level` became `get heading-level()` in JS, `heading-level: number` in the .d.ts, and `heading-level:` as an object key in the stories file: three syntax errors. It needs a camelCase step for property names.
- (-) The scaffold also removed `status: draft` from the spec immediately, while the skill says to remove it in step 6 "Ship it". Not harmful but surprising; I almost missed that it had touched the spec.
- (-) The scaffold appended index.js / index.d.ts entries at the end instead of in alphabetical order, and the generated CSS defaults to `display: inline-block` (wrong for most containers). "Could not run oxfmt" was printed; `pnpm format` fixed it.
- (-) `component:status` prints `ok  0 of 6 MUST rule(s)` in the "ok" column before any test exists. Should be warn.
- (S) Compound component gap (#204) is still real, and the spec format is where it starts: parameters can only describe the whole component, so the per-section `label` and `expanded` (the main API people use) cannot be parameters. They live in prose in the anatomy description, a rationale entry, and the web implementation file. Tabs hit the same thing. A `parts.<name>.parameters` or a "child item" concept in the schema would fix it for Accordion, Tabs, Menu, Select options, Radio group options...
- (S) No min/max for `kind: number`. `heading-level` is 2–6, which I had to say in the description and enforce in code with nothing checking the two agree.
- (S) `validate` does not check token references. I typed `semantic.border.widthx` on purpose: `validate` said OK and `spec tokens --resolve` printed empty light/dark cells with no warning. The config already knows the token sets, so this is an easy, high-value check.
- (S) Token "properties" have no way to say "the indicator's foreground is its border color" (a chevron drawn with borders). `foreground` + `border-width` is the closest; a reader can't tell.
- (o) Host checks (#204): the shared trigger() helper can't fire a `toggle` from a button (it types "a" into it), so like Tabs I set `events: []` and test toggle in the component file. Sections get no shared host checks. The checks did all pass for the parent with `fixtureContent`.
- (o) `exposedNodes()` returns only role and name, so heading level and expanded state are checked via shadow DOM attributes rather than the accessibility tree. Returning CDP's `properties` (level, expanded) would make those tests stronger.
- (-) Environment: `pnpm test` runs Turbo in strict env mode, which drops PLAYWRIGHT_BROWSERS_PATH, and the repo's Playwright wants a different Chromium build than the one installed in cloud sessions. I had to symlink the browser and run `turbo run test --env-mode=loose`. Worth a line in AGENTS.md or `passThroughEnv` in turbo.json.
- (+) `spec tokens component.accordion --resolve` is excellent for review: one table of every part/condition/token with light and dark values.
- (+) The repo's stylesheet guard test caught a hand-written `2px` border on the chevron and sent me back to the token. Good guardrail.
- (o) Ran axe on the built Storybook stories (Default, Exclusive, RightToLeft) in light and dark: no violations. Took a script, since the skill's check assumes a person looking at the Storybook Accessibility panel. An agent-runnable `pnpm storybook:a11y` would fit the agent-first goal.

## Phase 3: docs
- (+) The docs scaffold is tiny and correct: exact Verify header, a `data-accordion-subject` handle, and a step that throws until written. `custom-elements.d.ts` needed nothing because types come from `ElementAttributes`.
- (+) The Verify runner's step names in failures ("accordion example, step "…": heading level is "3", expected "2"") are clear, and running one example with `-t "the accordion example"` after one build is fast.
- (+) This phase caught a real bug that 357 unit tests and the host checks missed: on the server-rendered docs page every section rendered collapsed. Chromium drops manual slot assignments made before the slot is in the shadow root, and only markup parsed before registration hits it. Unit tests always define first, then render. I added a regression test, and a gotcha line, since it belongs in #204's "how to build a compound component" guidance.
- (-) "Break each step once" is good discipline but manual: I scripted six mutations. A `--mutate` helper, or a note that one break per step is enough, would help agents.
- (-) The docs test needs the site built first, and a change to the component needs a full docs rebuild (about a minute) before the Verify steps see it. Fine, but easy to forget; the error message for a missing build is good.
- (o) Preview prose (`docs/components/<name>.mdx`) is optional and status shows it as `warn`. I skipped it; the spec renders the page.

## Cross-cutting
- (+) One branch, one PR, one commit per phase reads well in history.
- (-) The process assumes a human review pause between phases. For an agent asked to do every phase, the PR is effectively reviewed all at once at the end.
- (S) Biggest spec-format issue: there is no first-class way to describe child items (sections, tabs, options). It shows up in the draft (can't name the per-section state), the spec (prose instead of parameters), the implementation `api` rows (can't list `ds-accordion-section` attributes), and host checks (no checks for the child element).
- (S) Second: validation is structural only. Token references, number ranges, and "rule text matches test" are not checked, so drift between spec and code is caught only by review.
