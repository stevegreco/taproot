# Card: process notes (spec-first run)

Running log kept while building Card through spec → implementation → docs. Likes (+), dislikes (−), and spec issues (!).

## Spec phase

+ AGENTS.md is short and points at the right things. The three-phase split and the skill per phase were clear in one read.
+ `pnpm component:new card --phase spec` was the right size: a TODO per required field, and `validate` lists each one with a line number.
+ `spec get guideline.compose-or-propose` is a good first stop. Token descriptions ("Cards, panels, popovers…" on background.surface, radius.surface, elevation.sm) made it obvious the token layer already expects a Card.
− `spec search card` returned "No results" with no hint (no "did you mean", no suggestion to try `list`). An agent can't tell "nothing exists" from "search is too narrow". Searching tokens or record bodies for "card" would have found the token descriptions and the action-hierarchy pattern.
− `spec search "group related content"` returned Radio group, Tabs, Select, Checkbox, Link: matched on the word "group"/"related", not meaning. Multi-word search is noisy; results don't say why they matched.
! compose-or-propose doesn't clearly decide Card. Step 3 ("product layout and chrome styled with semantic tokens") arguably covers a card, while the "propose" list names only controls, overlays, and field shells. Container/surface components fall between the two lists. I justified Card on repetition and on the linked-card accessibility trap, but the guideline doesn't name either reason.
! Anatomy roles are only interactive-surface, label, description, indicator, container. Card's media part has no fitting role (used `container`). `body` is mixed content (text, badges), so `description` is a stretch. A content/media role, or "slot-like region" role, is missing for container components.
! A draft has no way to record the single biggest open question (is the whole card clickable?). The skill says "note open questions in the pull request", so the question lives outside the source of truth and is lost after merge. An optional `open-questions` field on drafts would keep it with the record.
! `avoid[].instead` must be a record ID or prose. Accordion is being built in parallel, so I couldn't point at it; a future link silently stays prose and nothing reminds anyone to upgrade it later.
− Prose `instead` renders as "Use Product layout styled with … instead." The renderer wraps prose in "Use … instead", so the author has to know to write a lowercase noun phrase. The skill/SPEC don't say so (Alert's "The field's own error message" has the same capital-letter problem).
− I listed Badge and Button under `links.related` and also as `avoid[].instead`. `get` then showed them twice (alternative and related). `validate` doesn't flag a redundant link; easy to fix, but nothing caught it.
+ `get` output for a draft is readable and the "do not build with it" status note is right where an agent will see it.

## Implementation phase: completing the contract

+ The "decide what it ships" checklist in `component:status` is excellent. Ten questions, each with the question it answers, and `covers:` makes closing them mechanical. It forced me to write down disabled/selected/loading decisions I'd otherwise have skipped.
+ `spec tokens card --resolve` resolved every reference in both themes. That's the check that catches a nonexistent token (the earlier research doc says validate didn't), and it worked well as a self-check. But `validate` still doesn't run it, so an agent has to know to.
! Token conditions can only name an enum or boolean value, a state, or a preference. Card's hover only applies when it has a destination (`href`, a string), and there's no way to write "linked + hover". I had to put it in rationale. A "present/absent" condition for optional string parameters (e.g. `href.set`) would close this.
! The spec is supposed to be technology-neutral, but Link's destination parameter is called `href`. I reused `href` for consistency, so the neutral contract now has two HTML attribute names in it. Either the neutrality rule needs an exception list or Link should be renamed (`destination`).
! "Required" isn't expressible for a parameter. Card's `label` is required; I wrote "Required." in the description prose. Same for number ranges: `headingLevel` 2–6 lives in prose because `number` has no min/max.
! There's no `shadow`/`elevation` in the recommended property list, though Dialog already uses `shadow`. Small, but the list in SPEC.md lags the corpus.
− Typography token naming misled me: `semantic.typography.title.*` resolves to Source Sans, while the README says Lora is for "card titles". I only caught it with `--resolve`. Switched to `heading.sm`.
! Rationale vs rules overlap: some decisions (hover only when linked) are both a rule (no-destination-no-link) and a rationale entry. The format doesn't say which one owns it; I cross-referenced by rule id in prose.

## Implementation phase: code, tests, stories

+ The implementation scaffold is the best part of the process. It wrote accessors from parameters, one failing test per MUST rule named `[rule-id] statement`, the API table, the stories, and the three registry entries. Most of the "integration has several manual registries" pain from the earlier research log is gone.
+ The gotchas file is accurate and worth reading first (ElementInternals vs. attributes, `exposedNodes()` frame trap, `expectRendered` for negative tests). It saved me at least one false-pass.
− I wrote the runtime before the tests, then proved the tests failed by stubbing the shadow DOM. The skill order (tests first) is right, but nothing enforces it and an agent naturally drafts the runtime while designing. One test (`destination-named-by-label`) still passed against my stub because the stub kept the anchor; "watch it fail" depends on what you stub.
− The scaffold mapped the spec event `activate` to a web event named `activate` and put `focusPart: null` in the host-check row. For a link-like component the web event is native `click` (as Link does). The scaffold can't know that, but a comment pointing at Link's row would help.
! The host checks assume the focus ring is drawn on the focused element. Card draws it around the whole surface, so I added an optional `focusRingPart` to the shared table. That's a shared-file change in a parallel run.
− Shared files are a merge-conflict magnet: the scaffold inserts Card at the top of the host-checks table and at the end of `index.js`/`index.d.ts`, which is exactly where Spinner and Accordion's scaffolds insert too. Inserting alphabetically would spread parallel components apart.
− The skill says "three sections: Slots, The hidden attribute, and Framework notes", but `implementation/link.md` (a reference it points at elsewhere) uses a "Navigation" section. Minor, but the references disagree.
− Environment: the Vitest browser provider wanted a Playwright build (1234) that isn't installed in the cloud image (1194). I worked around it with a symlinked `PLAYWRIGHT_BROWSERS_PATH`; then turbo's strict env mode dropped that variable, so `pnpm test` failed with "no tests" until I used `turbo run test --env-mode=loose`. Neither is the design system's fault, but a `.env`/`passThroughEnv` for PLAYWRIGHT_BROWSERS_PATH in turbo.json would make cloud agents' first test run work.
− "Check that the Accessibility panel reports no violations in both themes" assumes a human with Storybook open. An agent has to script axe over the built Storybook itself. A `pnpm storybook:a11y` script would make this step agent-runnable. (I did: 4 stories × 2 themes, 0 WCAG A/AA violations.)
+ `component:status --phase implementation` as a final check was reassuring: required files, checklist decisions, and MUST-rule test coverage in one view.

## Docs phase

+ The docs scaffold plus `-t "the card example"` loop is fast: build once, edit `.verify.js`, rerun in ~5s. Failure messages name the step and show actual vs. expected, which is exactly what an agent needs.
+ "Break each step once" is a good rule and cheap to follow. All four Verify steps failed with their step name when broken.
− The scaffold says "check whether examples/custom-elements.d.ts needs a ds-card entry", but that file's own header says new components never add entries there (they come from `ElementAttributes`). The hint sends agents to a file they can't usefully change.
− `pnpm format` reflowed my Verify file, so a text-substitution "break the step" script missed. Trivial, but formatting before the break-each-step pass is the order to recommend.
− There's no guidance on how much of the spec the example should exercise. I covered heading/link naming, whole-card activation, the separate action, and the surface focus ring, which overlaps the component tests. The skill could say "prove what a person would notice in this example; component tests own the rest".

## Across all three phases

+ The spec really did drive the build. Every MUST rule became a test, every checklist item a decision, and the docs page needed no prose because it renders from the record.
− Each phase's skill says "ask for review and stop" after its commit. In an autonomous run that instruction directly conflicts with "go through every phase". I opened the PR as a draft after the spec commit and kept going; the skills could say what to do when review is deferred (e.g. "open as draft, list open questions, continue only if the requester said so").
! The most important design decisions (title link stretched over the card, heading owned by the component, no text selection on linked cards) ended up split across rules, rationale, and the PR description. There's no single place a reviewer reads "the three decisions in this spec that change public API". A `decisions`/`open-questions` view in `spec get` would help reviewers of draft specs.
! Writing the spec took longer than writing the runtime. Most of the time went into prose that the format constrains loosely (rule statement wording, rationale vs. rule overlap, how to phrase prose `instead`). The schema is permissive where judgment is needed and there are few worked examples of good vs. weak rule statements.
