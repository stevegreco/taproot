# Spec-first run report

October 22, 2026. Two rounds, each run against the main of its day.

- **Round 1** (main `eacd841`): Card (#237), Spinner (#238), and Accordion (#236), built one after
  another.
- **Round 2** (main `5663874`): Divider (#241), Progress bar (#242), Tooltip (#243), and Avatar
  (#244), built in parallel. None of them touched the shared registry files. A final PR adds all
  four to the package root.

Each component was built by a separate agent through the three component skills
(`spec-component`, `implement-component`, `document-component`), and all seven finished with
green tests. This report compares their notes and gives the most weight to problems with the spec
format and with writing a spec. It also adds an agent-experience pass over the `ds-spec` CLI and
MCP server. The running logs are kept for their full evidence:
[Card](card-process-notes.md), [Spinner](spinner-process-notes.md),
[Accordion](accordion-process-notes.md), [Divider](divider-process-notes.md),
[Progress bar](progress-bar-process-notes.md), [Tooltip](tooltip-process-notes.md), and
[Avatar](avatar-process-notes.md).

In the tables, runs are abbreviated as C (Card), S (Spinner), A (Accordion), D (Divider), P
(Progress bar), T (Tooltip), V (Avatar), and CLI (the agent-experience pass).

## Verdict

- **Spec-first works.** All seven agents said the spec drove the build. Every MUST rule became a
  failing test, and the docs page needed no extra prose. The Accordion docs phase caught a
  server-render bug that 357 unit tests missed. Divider found a dark-theme contrast bug in a token
  (#245).
- **Round 2 confirmed the round 1 ranking.** Every top spec-format issue from round 1 came up again,
  from agents who had read the round 1 notes and still could not work around them. Unchecked token
  references were hit by five of seven runs. The missing open-questions field was hit by six.
- **The biggest blocker to parallel work is not the spec.** It is three hand-maintained registries
  outside it: `src/index.js`, `src/index.d.ts` (the `ElementAttributes` map), and the host-checks
  table. Leaving them out made every round 2 PR knowingly red on three or four tests. Including them
  made the PRs conflict with each other in round 1.
- **The format's cost is fixed per component, not proportional to complexity.** Divider's spec (145
  lines) is longer than its runtime and CSS together, mostly rationale for checklist items that don't
  apply.
- **The CLI is fast and well shaped for agents**, but empty results look like success, search sounds
  equally confident when nothing fits, tokens can't be searched, and one invalid draft breaks every
  read command.

## What changed between rounds

Fixed or better in round 2:

- `component:status --phase spec` now tells you to run `pnpm spec validate`, though it still doesn't
  run it.
- The implementation scaffold no longer removes `status: draft` early (V).
- A prose `instead` worked as a to-do: Spinner's "a determinate progress indicator" was upgraded to
  `component.progress-bar` (P).
- compose-or-propose decided Tooltip cleanly, because overlays are in its propose list (T).
- The `known-issues` field fit a problem found mid-build that wasn't the component's to fix (D).
- Search tags did real work: Divider was found by "separator" and "horizontal rule" right after the
  draft added them (D).
- `exposedNodes({ properties: true })` now returns accessibility properties, opt-in (D). The
  docs-site copy of the helper didn't get the option.

New in round 2:

- Hand-maintained registries are what break parallel work (all four runs).
- While any draft still has `TODO:` placeholders, every `spec` command fails, including `list` and
  `get` for other records (V).
- Tokens can't be searched. Tooltip's brief assumed a shadow token was missing, but
  `semantic.elevation.md` ("Popovers, menus…") already existed (T).
- There is no contrast check between tokens a component places next to each other (D, #245).
- There is no shared vocabulary for sizes, URL parameter names, or how a component becomes
  decorative (V).
- Timing, positioning geometry, and runtime state like "image failed to load" have no home in the
  format (T, V).
- The Playwright workaround got worse: the headless-shell folder layout changed between builds, so a
  folder symlink no longer works (D, P, V, and the barrel PR).

## Recommendations

Ordered by impact over cost. Size is a rough guess: S is under a day, M is a few days, and L needs
an RFC. Most are small, which fits a first iteration that is meant to stay simple.

| # | Recommendation | Evidence | Priority | Size | Runs |
| --- | --- | --- | --- | --- | --- |
| 1 | **Derive the registries instead of hand-maintaining them.** Generate `index.js`, `index.d.ts`, and the host-checks rows from `src/*.js` (or keep one host-checks file per component and glob them, as `package-root.test.js` already discovers components from disk). Until then, have the scaffold insert entries alphabetically and have `component:status` report deferred registry items as warnings, not MISS. | Round 1 PRs conflicted on the same lines of all three files. Round 2 PRs left them out and each carried three or four expected red tests (package root, host checks, docs type-check, Verify), plus stopgap `define*()` calls in stories and examples. `component:status` exits 1 without them, so it can't be used as a gate. | High | M | C, S, A, D, P, T, V |
| 2 | **Make `validate` check token references.** Resolve every token value against the sets in `spec.config.json`. Fail on unknown names, allow a short documented keyword list (`transparent`, `none`, `inherit`, `linear`), and apply the token-tier rule that today lives only in `test/stylesheets.test.js`. | Accordion's typo `semantic.border.widthx` and Progress bar's guess `primitives.duration.normal` both passed validation and showed blank cells under `--resolve`. Spinner's `primitives.border.thick` passed and then failed a CSS test. | High | S | C, S, A, D, P |
| 3 | **Add `open-questions` to the record and show it in `get`.** An optional list on drafts (each item a question and, once answered, a decision), rendered at the top of `get`. Allow it to name the parameter that defines the component before a `parameters` block exists. On ship, answered items move to `rationale`. | Every defining decision (independent or exclusive sections, vertical or not, determinate only, label or description tooltip, size naming) went into description prose. The open questions went into the PR description and are lost on merge. | High | S | C, S, A, D, P, T, V |
| 4 | **Keep read commands working when one record is invalid.** `list`, `search`, and `get` should warn about the broken record and serve the rest. | While Avatar's draft had TODOs, every command failed with "Invalid spec content", so the agent couldn't query neighbors to write its `avoid` entries. | High | S | V |
| 5 | **Stop templating prose `instead`, and flag duplicate links.** Render prose as written, and wrap only record ids in "Use [X] instead". Have `validate` warn when an id appears in both `avoid[].instead` and `links.related`, and say in the skill that an `avoid` entry already creates the link. | Live output: "Use A disclosure that expands in place instead", "Use no tooltip instead", "Use a meter, or the value as text instead". Five runs hit or nearly hit the duplicate link. | High | S | C, S, A, D, P, T, V |
| 6 | **Add `required`, `min`, and `max` to parameters.** Render them in the parameters table, and have the scaffold write a test for each range. | Card, Progress bar, and Tooltip wrote "Required." in descriptions. Accordion's and Card's level 2–6 and Progress bar's 0..max live in prose and code, with nothing checking they agree. | High | S | C, A, P, T, V |
| 7 | **Add one conventions guideline record.** Cover size values, parameter casing, URL parameter naming (`href` or `destination`), `label` versus `accessibleName`, and how a component becomes decorative. Lint the mechanical parts in `validate`. | Button uses `sm`/`md`, while Icon, Spinner, and Avatar use `small`/`medium`/`large`. Accordion added kebab-case `heading-level` beside `fullWidth`. Card copied Link's HTML-named `href`. Avatar chose `decorative` where Icon infers it from a missing label, and nothing prompted the choice. | High | S | A, C, V, CLI |
| 8 | **Make `component:status` honest.** Run `validate` inside status and count TODOs, require `status: draft` in the spec phase, show "0 of N MUST rules tested" as a warning instead of ok, and stop warning about optional items. | Spinner and Accordion saw "No required items missing" with seven TODOs left. Spinner dropped `status: draft` by accident and `validate` said OK. | High | S | S, A, P, T, V |
| 9 | **Say what the review pause means when an agent runs every phase.** One paragraph per skill: if the requester asked for all phases, open the PR as a draft after the spec commit, record open questions (item 3), and continue. Otherwise, stop. | All of round 1 resolved this conflict the same way, by guessing. | High | S | C, S, A |
| 10 | **Let the CLI search tokens and show contrast.** Add `spec tokens --search <word>` over token names and descriptions, and a contrast column in `--resolve` for a foreground against the surface its part sits on. | Tooltip's plan assumed a missing shadow token that already existed. Divider's dark-theme line is 1.06:1 on `background.surface` (#245), found only by a screenshot. | Medium | S | T, D |
| 11 | **Search: admit when nothing fits.** When the best score is weak, print "No strong match", mark weak hits, and point to `ds-spec list` and `guideline.compose-or-propose`. Index `rationale` text and token descriptions. Make typo tolerance handle transpositions. | "toast notification" returned Tabs and Dialog, "how far along" returned Tabs, "hint on hover" returned every form field, and "lodaing" returned nothing. Eight specs record "no loading state" in rationale, and search can't see any of them. | Medium | M | C, S, A, P, T, V, CLI |
| 12 | **Make the CLI fail loudly.** Exit 1 on empty results, as the help text already says. Reject unknown filter values with the valid list. List allowed values and the condition syntax in `help <command>`. Accept global flags before the command. Show the expected shape in `validate` errors. | An agent can't tell "no match" from "wrong flag" from "nothing exists". Tooltip's `keyboard must be object` error didn't say a map was expected. | Medium | S | CLI, T |
| 13 | **Make cloud test runs work the first time, and script the a11y check.** Pin Playwright to the image's Chromium or document the shim, add `PLAYWRIGHT_BROWSERS_PATH` to `passThroughEnv` in `turbo.json`, and add `pnpm storybook:a11y` (axe over every story in both themes). | All seven runs lost time to the Playwright build mismatch and turbo's strict env mode, and all seven wrote their own axe script. | Medium | S | C, S, A, D, P, T, V |
| 14 | **Fix the test helpers that gave false results.** Return range and state properties from `exposedNodes()` in both copies of the helper, make `eventually()` deep-compare, and tell the docs skill to break a step so the expected state never occurs, not by flipping the expected value. | Progress bar wrote its own range reader. `eventually()` failed with `["image"], expected ["image"]` (V). A flipped expectation still passed because the read beat a 100 ms close delay (T). Spinner's negative check passed for a spinner that appeared and left. | Medium | S | A, D, P, S, T, V |
| 15 | **Fix the scaffold's remaining sharp edges.** Convert parameter names to camelCase for properties, default container CSS to `display: block`, point link-like components at Link's event mapping, and replace the misleading `custom-elements.d.ts` hint with "add the `ElementAttributes` entry". | Accordion's `heading-level` produced three syntax errors. Card, Divider, Tooltip, and Avatar were all sent to a file that says never to add entries. | Medium | S | A, C, D, T, V |
| 16 | **Give the guidance worked examples and a not-applicable shorthand.** In `spec-component`, show a weak and a strong rule statement, give a one-line test for rule versus rationale, and add presentational components (containers, graphics, separators) to compose-or-propose. Let one rationale entry close several checklist items as not applicable with one reason. | Card, Spinner, and Divider couldn't place themselves in compose-or-propose. Divider spent most of its 145 lines on items that don't apply to a line. | Medium | S | C, S, D |
| 17 | **Write an RFC for child items (sections, tabs, options, wrapped triggers).** Let a part declare its own parameters and events, and carry that through to API rows and host checks. This is the one change here that grows the schema much, so make it a deliberate decision. Issue #204 is the natural home. | A section's `label` and `expanded` live in anatomy prose, rationale, and the implementation file. Tooltip wraps the consumer's trigger, and no shared check exercises it. | High | L | A, T |
| 18 | **Small format additions, kept to notes rather than new machinery.** A `set` condition for optional string parameters (`href.set + hover`, `image.set`), an optional `note` on a token binding for derived values and timing, a whole-component part for gaps between parts, `media` and `graphic` anatomy roles, and `shadow` and `track` in SPEC.md's property list. | Card's hover-only-when-linked, Avatar's initials-or-picture fallback, Spinner's stroke ratio, Tooltip's hover delay, and Progress bar's label gap all ended up in prose or CSS only. Card, Spinner, Divider, and Avatar all forced a part into the wrong role. | Low | S | C, S, A, D, P, T, V |

## Spec format issues

What the record format can and cannot say. When independent agents building very different
components run into the same gap, the gap is real.

| Issue | Runs | What happened | Fix |
| --- | --- | --- | --- |
| No place for open questions on a draft | C, S, A, D, P, T, V | The defining decision of each component went into description prose, and the open questions went into the PR. | Item 3 |
| Prose `instead` renders through a hidden template | C, S, A, D, P, T | Authors only learn from `get` output that prose must be a lowercase noun phrase. "No X" reads as "Use no X instead". | Item 5 |
| Redundant links not flagged | C, S, A, V | An avoid entry plus `links.related` lists the same record twice. The skill recommends adding both. | Item 5 |
| Token references are not validated | C, S, A, D, P | Typos, tier violations, and undocumented keywords all pass. `--resolve` prints blank cells without a warning. | Item 2 |
| Anatomy roles are a short closed list | C, S, D, T, V | No role for media (Card, Avatar), a decorative line or arc (Divider, Spinner), or a part the consumer supplies (Tooltip's trigger). Progress bar found the list a good fit. | Item 18 |
| Parameters can't be required or ranged | C, A, P, T, V | "Required." and "from 2 to 6" are written in descriptions and enforced only in code. | Item 6 |
| Token conditions can't test whether a string is set | C, V | Card's hover only applies with a destination, and Avatar's look depends on whether `name` and `image` are set. Both live in rules. | Item 18 |
| Derived values, timing, and geometry have no home | S, D, T, V | Spinner's stroke is size ÷ 8. Tooltip's hover delay is behavior, not motion. Divider's and Avatar's geometry are stated as rules or only in CSS. | Item 18. Keep it to a `note`, not expressions. |
| Properties can land on the wrong part | A, P, S, D | There is no whole-component part for a gap between parts, and no property for "this part's border is the component". | Item 18 |
| No cross-record conventions | A, C, V, CLI | Two size scales, mixed parameter casing, an HTML attribute name in a neutral contract, and two ways to become decorative. | Item 7 |
| No child items | A, T | The section-level API can't be a parameter. Tooltip's trigger has no contract. | Item 17 (RFC) |
| Runtime state is neither a state nor a parameter | V | "Picture failed to load" drives Avatar's fallback but has no field. | Describe it in a rule for now. Revisit with item 17. |
| No place for follow-ups to other records | A, T | Tabs' prose `instead` and Link's missing name forwarding were deferred to-dos that nothing tracks. | List them in `open-questions` (item 3) until a pattern emerges. |
| Draft status is enforced by two tools | S, A | `validate` doesn't know about phases, while `component:status` does. | Item 8 |
| Checklist checks presence, not truth | S | Any rationale with `covers` closes an item. Spinner's first forced-colors entry was wrong and still passed. | Accept it, since this is what review is for. Ask for a test tag where one is possible. |
| SPEC.md lags the corpus | C, S | `shadow` (used by Dialog) and `inherit` (used by Icon) are not in the documented lists. | Generate the lists from the validator so they can't drift. |

## Writing a spec

How it felt to author a record: where the time went and where judgment had no support.

| Observation | Runs | Detail |
| --- | --- | --- |
| The spec costs more than the runtime | C, D | Card's prose took longer than its code. Divider's 145-line spec is longer than its runtime and CSS together. The cost is fixed per component, mostly rationale for checklist items that don't apply. |
| compose-or-propose is uneven | C, S, D | It decides components that own behavior (Accordion, Tooltip) and those built on existing intent (Progress bar). It doesn't decide presentational ones: a container (Card), an animated graphic (Spinner), or a line with a semantic role (Divider). |
| Decisions scatter | C, S, A, T | Card's three API-changing decisions were spread across rules, rationale, and the PR description. Tooltip's hover delay sits in a rule, a rationale entry, and a JS constant. |
| Neighbor updates go untracked | C, S, A, T | "Point the neighbors at it" only covers `avoid` entries. Mentions in other records' `rationale` are missed, and needed changes to other components (Link forwarding a name) live in the PR. |
| Each spec re-derives conventions from neighbors | V, A | Avatar read Button, Icon, and Spinner side by side to pick a size scale. |
| Writing tests from rule text sharpens rules (liked) | C, S, A, D, P, T, V | Accordion reworded two rules before coding, because the generated `[rule-id]` test made vague wording obvious. Tooltip's stub made 13 of 16 tests fail for the right reason. This is the strongest argument for spec-first. |
| SHOULD rules are tested only by docs examples | S, P | Spinner's `delay-short-waits` and Progress bar's `only-moves-forward` are proven only by Verify steps. Say so in the docs skill. |

## Process and tooling

### Keep (praised by every run)

- The implementation scaffold that writes one failing `[rule-id] statement` test per MUST rule.
- The "decide what it ships" checklist with `covers`. It forced real decisions: Spinner found a
  forced-colors bug, and Tooltip settled touch, disabled triggers, and reduced motion.
- `spec tokens --resolve` as a review table in both themes.
- The spec-phase scaffold, plus `validate` listing each TODO by line.
- A fast Verify loop with step-named failures.
- A short AGENTS.md, one skill per phase, and one commit per phase in one PR. Round 2 agents needed
  nothing beyond them and the round 1 notes.
- The component gotchas file, the stylesheet guard test, and the `known-issues` field.

### Fix

- Hand-maintained registries (item 1).
- The review pause conflicts with an autonomous all-phases run (item 9).
- `component:status` reports ok too easily, and MISS for deferred registry entries (items 1 and 8).
- Scaffold bugs (item 15).
- The Storybook a11y step assumes a person at the panel (item 13).
- Host checks assume the focus ring is on the focused element (Card added `focusRingPart`), and
  child elements and wrapped triggers get no checks (Accordion, Tooltip).
- Reference files disagree with the skill: `link.md` and `icon.md` don't follow the required
  three-section body.
- Test-helper traps in `exposedNodes()` and `eventually()` (item 14). A media-loading gotcha belongs
  in the gotchas file: an `<img>` with a data URL can report `complete` before its `load` event (V).
- Leftover scaffold `// TODO` comments outside the spec go unnoticed (Spinner's host-checks row) (P).
- Skills exist twice (`.claude/skills` and `.agents/skills`), and `design-tokens` is only in one of
  them.

## Using the CLI as an agent

Every kind of record (components, sections, rules, links, tokens, patterns, guidelines, and
examples) was queried through `pnpm spec` and through the MCP server over stdio. The queries ran
first on main, then on a scratch copy with the round 1 specs merged in. Each call takes about 0.4 s.
A fresh clone's first `pnpm spec` runs a 17 s install before it answers.

### Works well for agents

- `get buton` → "Did you mean: component.button?" Plain names work everywhere.
- A bad section address lists every valid address, including rule ids.
- Each search hit shows the command to run next, and `rules` says how to read a rule in full.
- `get --impl web` gives the package, tag, import, and an API table that flags mismatches
  (`action` → `type`).
- `get` leaves out the 50 token bindings and names the command that filters them, which keeps the
  context window small.
- The MCP server has the same seven tools, a `spec://` resource per record, and useful server
  instructions.
- Once a component exists, search finds it: "loading", "waiting for data", and "show progress" →
  Spinner; "collapse content" → Accordion; "spiner" → Spinner; "separator" → Divider.

### Trips agents up

- **One broken draft breaks everything.** While any record has `TODO:` placeholders, every command
  fails with "Invalid spec content" (V).
- **Silent empties.** Empty `search`, `list`, `rules`, `tokens`, and `links` results all exit 0,
  though the help says 1. So do `--type bogus`, `--kind bogus`, `--topic a11y`, and `--impl ios`.
- **Hidden vocabularies.** Valid topics, levels, link kinds, and the condition syntax appear
  nowhere in the help. `--condition "primary hover"` matches nothing. Only the exact
  `"variant.primary + hover"` works.
- **No token lookup.** You can't `get` or search a token, or ask which components use
  `semantic.color.border.focus`. `search "color token"` returns Link, Icon, and Checkbox.
- **Mixed formats.** `get button#parameters.variant` returns raw YAML, while the full `get` renders
  a table.
- **Flag order.** `ds-spec --config x validate` fails with "Unknown command --config".
- **Rendering.** Variant lines run together ("Example: Save changes Guidance: …"), the description
  column is often empty, there are two "Accessibility" headings, and `alternative-to` is a
  confusing name for the inverse link.
- **Parity.** MCP `get` takes `target` and `implementation`, but the CLI takes `<id>` and `--impl`.
- `component:new --help` crashes with a Node stack trace. Example image paths (`assets/…`) can't be
  resolved from the output.

### How search behaves when nothing fits

```text
$ ds-spec search "toast notification"     # Alert is the right answer
- component.tabs — Tabs: Use Tabs to switch between a few related views …
- component.dialog — Dialog: Use Dialog for a focused task …
(exit 0, no sign these are weak matches)

$ ds-spec search "show loading state"     # before Spinner existed
- component.alert … - component.checkbox … - component.icon … - component.select …
(exit 0, no pointer to compose-or-propose)
```

Proposed:

```text
No strong match for "show loading state". Weak matches: Alert, Checkbox.
  → ds-spec list --type component
  → ds-spec get guideline.compose-or-propose
(exit 1)
```

## Environment

Every cloud run hit the same problem. Playwright 1.62.1 wants Chromium headless shell build 1234,
the image has 1194, and turbo's strict env mode drops `PLAYWRIGHT_BROWSERS_PATH`. In round 1 a
folder symlink plus `turbo run test --env-mode=loose` was enough. In round 2 the build's folder
layout had changed (`chrome-headless-shell-linux64/chrome-headless-shell` instead of
`chrome-linux/headless_shell`), so each run built a shim folder by hand. The barrel PR's
integration run needed the same shim. Item 13 removes the need for it.

## How this fits the spec review

The spec review in [`../2026-10-spec-review/`](../2026-10-spec-review/README.md) came from reading
the corpus. These runs confirm several of its findings from use: mixed size naming, confident wrong
search answers, inconsistent plain-text `instead`, and token maps as the heaviest authoring burden.
They add what only building turns up: the hand-maintained registries, the missing open-questions
field, unchecked token references, the child-item gap, the scaffold, status, and test-helper bugs,
and the conflict between review pauses and autonomous runs.
