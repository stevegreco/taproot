# Spec-first run report

October 22, 2026. Run against main `eacd841`.

Three components, Card, Spinner, and Accordion, were each built by a separate agent through the
three component skills (`spec-component`, `implement-component`, `document-component`). All three
finished with green tests: Card in #237, Spinner in #238, and Accordion in #236. This report
compares their notes and gives the most weight to problems with the spec format and with writing a
spec. It also adds an agent-experience pass over the `ds-spec` CLI and MCP server. The three
running logs ([Card](card-process-notes.md), [Spinner](spinner-process-notes.md),
[Accordion](accordion-process-notes.md)) are kept for their full evidence.

## Verdict

- **Spec-first works.** All three agents said the spec drove the build. Every MUST rule became a
  failing test, and the docs page needed no extra prose. The Accordion docs phase caught a
  server-render bug that 357 unit tests missed.
- **The format falls short in the same places every time.** Drafts have nowhere to put open
  questions, `validate` doesn't check token references, parameters can't say "required" or give a
  range, and prose `instead` text runs through a hidden template. All three agents hit at least
  three of these.
- **Writing the spec took longer than writing the code** (Card said so directly). The time goes
  into judgment calls the format leaves open: rule or rationale, how to word an `instead`, and
  which compose-or-propose bucket applies.
- **The CLI is fast and well shaped for agents**, but empty results look like success, and search
  sounds just as confident when nothing fits as when something does.

## Recommendations

Ordered by impact over cost. Size is a rough guess: S is under a day, M is a few days, and L needs
an RFC. Most are small, which fits a first iteration that is meant to stay simple. Runs: C is Card,
S is Spinner, A is Accordion, and CLI is the agent-experience pass.

| # | Recommendation | Evidence | Priority | Size | Runs |
| --- | --- | --- | --- | --- | --- |
| 1 | **Make `validate` check token references.** Resolve every token value against the sets `spec.config.json` already lists. Fail on unknown names, allow a short documented keyword list (`transparent`, `none`, `inherit`, `linear`), and apply the token-tier rule that today lives only in `test/stylesheets.test.js`. | Accordion's typo `semantic.border.widthx` passed validation and showed blank cells under `--resolve`. Spinner's `primitives.border.thick` passed validation and then failed a CSS test. Card only found a misleading typography token by running `--resolve` by hand. | High | S | C, S, A |
| 2 | **Add `open-questions` to the record and show it in `get`.** An optional list on drafts (each item a question and, once answered, a decision), rendered at the top of `get`. On ship, answered items move to `rationale`. | The skill says to note open questions in the pull request, so the key questions (is the whole card clickable? does Spinner announce? independent or exclusive sections?) disappear from the source of truth when the PR merges. | High | S | C, S, A |
| 3 | **Stop templating prose `instead`, and flag duplicate links.** Render prose as written and wrap only record ids in "Use [X] instead". Have `validate` warn when an id appears in both `avoid[].instead` and `links.related`, and say in the skill that an `avoid` entry already creates the link. | Live output today: "Use A disclosure that expands in place instead" (Tabs) and "Use Headings in one scrolling page instead" (Accordion). All three runs listed a record twice in `get`. | High | S | C, S, A |
| 4 | **Add `required`, `min`, and `max` to parameters.** Render them in the parameters table, and have the implementation scaffold produce a test for each range. | Card (`label` required, `headingLevel` 2–6) and Accordion (`heading-level` 2–6) wrote these in description prose and enforced them in code, with nothing checking that the two agree. | High | S | C, A |
| 5 | **Make `component:status` honest about the spec phase.** Run `validate` inside status and count TODOs, require `status: draft` in the spec phase, show "0 of N MUST rules tested" as a warning, and stop warning about optional items. Have the implementation scaffold leave `status: draft` alone. | Spinner and Accordion both saw "No required items missing" with seven TODOs left. Spinner dropped `status: draft` by accident and `validate` said OK. Accordion's scaffold removed it early. | High | S | S, A |
| 6 | **Say what the review pause means when an agent runs every phase.** One paragraph per skill: if the requester asked for all phases, open the PR as a draft after the spec commit, record open questions (item 2), and continue. Otherwise, stop. | All three resolved the conflict the same way, by guessing. Spinner called the pause "honor system in prose". | High | S | C, S, A |
| 7 | **Write an RFC for child items (sections, tabs, options).** Let a part declare its own parameters and events (for example `anatomy.section.parameters`), and carry that through to API rows and host checks. This is the one change here that grows the schema much, so make it a deliberate decision. Issue #204 is the natural home. | A section's `label` and `expanded` are the API people use most, and today they live in anatomy prose, a rationale entry, and the implementation file. Tabs hit the same gap. Radio group options, Select options, and a future Menu will too. | High | L | A |
| 8 | **Search: admit when nothing fits.** When the best score is weak, print "No strong match", mark weak hits, and point to `ds-spec list` and `guideline.compose-or-propose`. Index `rationale` text and token descriptions. Make typo tolerance handle transpositions. | Before these components existed, "toast notification" returned Tabs and Dialog, and "show loading state" returned Alert, Checkbox, Icon, and Select. "loading" matched Alert through a rule id containing "load", and "lodaing" returned nothing. Eight specs record "no loading state" in rationale, and search can't see any of them. | Medium | M | C, S, A, CLI |
| 9 | **Make the CLI fail loudly.** Exit 1 on empty results, as the help text already says. Reject unknown filter values with the valid list (for example, `--topic a11y` → "Topics: content, behavior, accessibility"). List allowed values and the condition syntax in `help <command>`. Accept global flags before the command. | An agent can't tell "no match" from "wrong flag" from "nothing exists", because all three exit 0 with a similar message. | Medium | S | CLI |
| 10 | **Make cloud test runs work the first time, and script the a11y check.** Add `PLAYWRIGHT_BROWSERS_PATH` to `passThroughEnv` in `turbo.json`, pin Playwright to the image's Chromium or note the workaround in AGENTS.md, and add `pnpm storybook:a11y` (axe over every story in both themes). | All three lost time to the Playwright build mismatch and turbo's strict env mode. All three wrote their own axe script. | Medium | S | C, S, A |
| 11 | **Fix the implementation scaffold's sharp edges.** Convert parameter names to camelCase for properties, insert registry rows alphabetically (fewer parallel merge conflicts), default container CSS to `display: block`, and point link-like components at Link's event mapping. | Accordion's `heading-level` produced three syntax errors. All three appended to the same lines of `index.js`, `index.d.ts`, and the host-checks table. | Medium | S | C, S, A |
| 12 | **Pick naming conventions and lint them.** One case for parameter names (camelCase, as Button's `fullWidth`) and one size scale, checked in `validate`. Decide whether `href` is allowed or becomes `destination` before Card copies it further. | This run added `heading-level` (kebab case) beside `fullWidth`. Button uses `sm`/`md`, while Icon and Spinner use `small`/`medium`/`large`. Card raised `href`. | Medium | S | C, A, CLI |
| 13 | **Give the guidance a few worked examples.** In `spec-component`, show a weak and a strong rule statement side by side, give a one-line test for "rule or rationale?" (a rule is something you can test or review against; rationale explains a choice), and add container and graphic examples to compose-or-propose. | Card couldn't place a container in compose-or-propose, and Spinner couldn't place an animated graphic. Accordion found it clear. Card found rule versus rationale the main source of slow writing. | Medium | S | C, S |
| 14 | **Small token-map additions.** A `set` condition for optional string parameters (`href.set + hover`), an optional `note` on a binding for derived values ("3× motion-duration", "size ÷ 8"), and `shadow` and `track` in SPEC.md's property list. Leave a full expression language out of v1. | Card's "hover only when linked" and Spinner's stroke and reduced-motion speed ended up in rationale prose. | Low | S | C, S, A |

## Spec format issues

What the record format can and cannot say. When independent agents building very different
components run into the same gap, the gap is real.

| Issue | Runs | What happened | Fix |
| --- | --- | --- | --- |
| Token references are not validated | C, S, A | Typos, tier violations, and undocumented keywords (`inherit`, `linear`) all pass. `--resolve` prints blank cells without a warning. | Item 1 |
| No place for open questions on a draft | C, S, A | The key review questions live only in the PR. Accordion also had to commit to a parameter that defines the component (independent or exclusive) at a stage where drafts forbid parameters. | Item 2. Let open questions name parameters before a `parameters` block exists. |
| Prose `instead` has no status | C, S, A | There is no way to mark "planned component" or "never a component", so prose like Tabs' "a disclosure" never gets upgraded to `component.accordion`, and nothing records the follow-up. | An optional `planned: true` on an avoid entry, so `validate` can list prose that now matches a record title. |
| Hidden render template on `instead` | C, S, A | Authors only learn from `get` output that prose must be a lowercase noun phrase. | Item 3 |
| Redundant links not flagged | C, S, A | An avoid entry plus `links.related` lists the same record twice. The skill recommends adding both. | Item 3 |
| Parameters can't be required or ranged | C, A | "Required." and "from 2 to 6" are written in descriptions and enforced only in code. | Item 4 |
| No child items | A | The section-level API can't be a parameter, so it is split across three files. This is the biggest gap for compound components (Tabs too, #204). | Item 7 (RFC) |
| Draft status is enforced by two tools | S, A | `validate` doesn't know about phases, `component:status` does, and the scaffold edits status itself. | Item 5 |
| Token map can't express conditional or derived values | C, S, A | Card: hover only when a destination is set. Spinner: stroke is size ÷ 8 and reduced motion is 3× duration. Accordion and Spinner: free-form properties (`track`, a chevron drawn with a border) don't say what they mean. | Item 14. Keep it to a `note`, not expressions. |
| Anatomy roles are a short closed list | C, S | No fitting role for media or mixed body content (Card), and no answer on whether a visually hidden label is a part (Spinner). | Add `media` and `content`. Say in SPEC.md that an accessible name is not a part. |
| Technology-neutral rule already broken | C | Link's `href` is an HTML attribute name, and Card copied it for consistency. | Item 12. Decide once. |
| Naming conventions drift | A, CLI | Parameters now mix kebab and camel case, and two size scales coexist. The scaffold broke on the kebab-case name. | Item 12 |
| Checklist checks presence, not truth | S | Any rationale with `covers` closes an item. Spinner's first forced-colors entry was wrong and still passed. | Accept it, since this is what review is for. Ask for a test tag where one is possible. |
| SPEC.md lags the corpus | C, S | `shadow` (used by Dialog) and `inherit` (used by Icon) are not in the documented lists. | Generate the lists from the validator so they can't drift. |

## Writing a spec

How it felt to author a record: where the time went and where judgment had no support.

| Observation | Runs | Detail |
| --- | --- | --- |
| Spec took longer than the runtime | C | Most of the time went into prose that the format constrains loosely: rule wording, rule versus rationale, and phrasing `instead`. The schema is permissive where judgment is needed, and there are few worked examples. |
| compose-or-propose is uneven | C, S, A | Clear for Accordion, because it names "owns a composite keyboard model". It doesn't decide containers (Card), which fall between "layout styled with tokens" and the propose list. Spinner, an animated graphic with announcement semantics, fit neither bucket. |
| Decisions scatter | C, S, A | Card's three API-changing decisions were spread across rules, rationale, and the PR description. Spinner's key decisions (stroke ratio, reduced-motion speed) sit in prose because the token map can't hold them. |
| Neighbor updates go untracked | C, S, A | "Point the neighbors at it" only covers `avoid` entries. Mentions in other records' `rationale` (Tabs: "a panel that loads its own content shows its own progress") are missed. Drafts may not edit other records, so the follow-up has nowhere to live. |
| Writing tests from rule text sharpens rules (liked) | C, S, A | Accordion reworded two rules before coding, because the generated `[rule-id]` test made vague wording obvious. This is the strongest argument for spec-first. |
| SHOULD rules have no home in tests | S | Spinner's `delay-short-waits` is exercised only by the docs example. Say so explicitly: the Verify steps are where SHOULD rules get tested. |

## Process and tooling

### Keep (praised by all three runs)

- The implementation scaffold that writes one failing `[rule-id] statement` test per MUST rule. All
  three called it the best part.
- The "decide what it ships" checklist with `covers`. It forced real decisions: Spinner found a
  forced-colors bug, and Card wrote down its loading and selected choices.
- `spec tokens --resolve` as a review table in both themes.
- The spec-phase scaffold, plus `validate` listing each TODO by line.
- A fast Verify loop with step-named failures, and the "break each step once" rule.
- A short AGENTS.md, one skill per phase, and one commit per phase in one PR.
- The component gotchas file and the stylesheet guard test.

### Fix

- The review pause conflicts with an autonomous all-phases run (item 6).
- `component:status` reports ok too easily (item 5).
- Scaffold bugs, and registry merge conflicts in parallel runs (item 11).
- The Storybook a11y step assumes a person at the panel (item 10).
- Host checks assume the focus ring is on the focused element (Card added `focusRingPart`), and
  child elements get no checks (Accordion).
- Reference files disagree with the skill: `link.md` and `icon.md` don't follow the required
  three-section body, and the docs scaffold points at `custom-elements.d.ts`, which never needs an
  entry.
- `eventually(read, 0)` also passes for a spinner that appeared and then left. Add a
  negative-assertion note to the docs skill.
- Skills exist twice (`.claude/skills` and `.agents/skills`), and `design-tokens` is only in one of
  them.

## Using the CLI as an agent

Every kind of record (components, sections, rules, links, tokens, patterns, guidelines, and
examples) was queried through `pnpm spec` and through the MCP server over stdio. The queries ran
first on main, then on a scratch copy with the three new specs merged in. Each call takes about
0.4 s. A fresh clone's first `pnpm spec` runs a 17 s install before it answers.

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
- With the new components in place, search worked: "loading", "waiting for data", and "show
  progress" → Spinner; "collapse content" → Accordion; "spiner" → Spinner.

### Trips agents up

- **Silent empties.** Empty `search`, `list`, `rules`, `tokens`, and `links` results all exit 0,
  though the help says 1. So do `--type bogus`, `--kind bogus`, `--topic a11y`, and `--impl ios`.
- **Hidden vocabularies.** Valid topics, levels, link kinds, and the condition syntax appear
  nowhere in the help. `--condition "primary hover"` matches nothing. Only the exact
  `"variant.primary + hover"` works.
- **No token lookup.** You can't `get` a token or ask which components use
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
$ ds-spec search "toast notification"     # main; Alert is the right answer
- component.tabs — Tabs: Use Tabs to switch between a few related views …
- component.dialog — Dialog: Use Dialog for a focused task …
(exit 0, no sign these are weak matches)

$ ds-spec search "show loading state"     # main, before Spinner existed
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

All three cloud runs hit the same two problems. Playwright wanted Chromium headless build 1234, the
image had 1194, and turbo's strict env mode then dropped `PLAYWRIGHT_BROWSERS_PATH`. As a result,
`pnpm test` reported "no tests", or showed spec tests as failed when they had only been cancelled.
The workaround was a symlinked browser plus `turbo run test --env-mode=loose`. Item 10 removes the
need for it.

## How this fits the spec review

The spec review in [`../2026-10-spec-review/`](../2026-10-spec-review/README.md) (#235) came from
reading the corpus. This run confirms several of its findings from use: mixed size naming,
confident wrong search answers, inconsistent plain-text `instead`, and token maps as the heaviest
authoring burden. It adds what only building turns up: the missing open-questions field, unchecked
token references, the child-item gap, the scaffold and status bugs, and the conflict between review
pauses and autonomous runs.
