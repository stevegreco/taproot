# Avatar run: process notes

Running log while building Avatar spec-first (PR #244). Likes (+), dislikes (-), spec issues (S), observations (o).

Constraint for this run: don't touch the shared registry files (`src/index.js`, `src/index.d.ts`, the host-checks table), so the four new components don't conflict. A final PR adds them. The ready-to-apply diff is in `avatar/barrel-entries.diff`.

## Orientation
- (+) Same as before: AGENTS.md plus the three skills are enough to start without asking anything. The precedent from Card, Spinner and Accordion (their PRs and notes) made the expected shape obvious.
- (o) The "Next components" doc said Avatar depends on the size-naming decision. Nothing in the spec system records that decision or an open question about it. I found the convention by reading Button, Icon and Spinner records side by side.

## Phase 1: spec
- (+) `spec search avatar` / `"profile picture"` / `"user initials"` came back empty or unrelated, which was the right answer here, but as noted before an agent can't tell "nothing exists" from "the search missed".
- (-) While the draft still has `TODO:` placeholders, **every** `spec` command fails, including `spec list` and `spec get` for unrelated records ("Invalid spec content: …"). That means you can't query neighbors (to write `avoid` entries) while you're writing the draft unless you fill the TODOs first. Read commands should warn about the broken record and keep working.
- (S) Anatomy roles again. Avatar's `image` part is media, and there's no media/content role (Card hit the same thing and used `container`). This is the third time it's come up. A `media` role is a small schema change.
- (S) I nearly added `links.related: component.icon` as well as an `avoid` entry pointing at Icon, which duplicates it (Card and Accordion hit this too). I caught it only because of the earlier notes. `validate` should warn about a `related` link that duplicates an `instead`.
- (S) **Size naming has no home in the spec.** Button uses `sm`/`md`, while Icon and Spinner use `small`/`medium`/`large`. Each record defines its own enum values, so nothing keeps size vocabularies consistent and nothing flags a new one. A shared `size` vocabulary (a guideline, or a reusable enum the schema can reference) would stop component #4 from inventing a third. I followed Icon/Spinner and flagged it in the PR.
- (S) Same as Card: the draft's biggest open questions (size naming, whether it's named by default) live only in the PR description. An optional `open-questions` field on drafts would keep them with the record.

## Phase 2: implementation
- (+) The decide-what-it-ships checklist plus `covers:` again turned ten vague concerns into ten one-line decisions. For a non-interactive component one rationale entry covered four items (`[disabled, selected, loading, invalid]`), which felt right.
- (+) `spec tokens avatar --resolve` caught nothing wrong this time, but it was the quickest way to check contrast-relevant values (muted foreground on muted background, light and dark) before writing CSS.
- (+) The scaffold no longer removes `status: draft` early (Accordion's notes said it did). It's left for step 6, as the skill says.
- (S) No way to express **"required"** or **"present/absent"** on a string parameter. Avatar's behavior hinges on whether `name` and `image` are set (initials vs placeholder vs picture), and token conditions can't say "image set". It all lives in rule prose. This is the same gap as Card's `href.set`.
- (S) The spec has no place for **runtime state that isn't interaction state**. "Picture failed to load" is the core of Avatar's fallback, but it isn't a `states` entry (states are for styling) or a parameter. I described it in a rule. A spinner, image or async component will always have this.
- (S) Geometry again: the placeholder is 60% of the circle and initials are vertically centered. Geometry isn't a token property (gotchas say "state them as rules or rationale"), so it went into CSS only. Nothing in the spec says it, and nothing would catch a drift.
- (S) The token map can't say "this part shows a symbol in the foreground color". I used `foreground` on `placeholder`, which is fine. Avatar had no new token needs, which matches the doc's "nothing new" expectation.
- (-) **The scaffold and the status check assume you edit the shared registries.** `component:new --phase implementation` writes `index.js`, `index.d.ts` and the host-checks row in the same step as everything else. `component:status --phase implementation` exits 1 without them. Two tests (`package-root`, `host-checks`) and the docs type-check fail without them. So any "don't touch the barrel" workflow makes every component PR red. To support parallel component PRs without conflicts, two fixes would work. One: generate the barrel and the host-checks table from `src/*.js` (`package-root.test.js` already discovers components from disk). Two: a `--no-registry` scaffold flag, with status reporting those items as "deferred" instead of MISS.
- (-) Environment friction, the same as the previous three runs: the Vitest browser wants Playwright Chromium build 1234 while the cloud image has 1194, and Turbo's strict env mode drops `PLAYWRIGHT_BROWSERS_PATH`. The headless-shell directory layout changed too (`chrome-headless-shell-linux64/chrome-headless-shell` vs `chrome-linux/headless_shell`), so a plain symlink of the folder isn't enough. I had to build a shim directory. This has now cost time on four runs, so it's worth fixing once in turbo.json and AGENTS.md.
- (o) Test-writing gotcha: an `<img>` with a data URL can report `complete === true` before its `load` event has run. Polling (`expect.poll`) was the reliable way to wait for "picture is showing". This belongs in the gotchas file for any component that loads media.
- (o) Storybook a11y is still a script I had to write myself: axe over 6 stories × 2 themes, 0 violations. A `pnpm storybook:a11y` would remove this step from every run.
- (o) Without the barrel entry, Storybook's preview (which imports the package root) doesn't register `ds-avatar`. The story imports `/avatar` and calls `defineAvatar()` itself. That works, but it's a workaround caused by the registry problem above.

## Phase 3: docs
- (+) The docs scaffold plus `-t "the avatar example"` loop is still fast and its failure messages are clear.
- (-) **`eventually()` compares with `Object.is`**, so passing an array as `expected` can never pass, and the error message is misleading: `account avatar parts is ["image"], expected ["image"]`. It should deep-compare, or at least say "not the same value (compare primitives)". I switched to comma-joined strings.
- (-) The docs type-check (`example-types.test.ts`) fails for any new component until `ElementAttributes` in `src/index.d.ts` has its entry. That's the third registry-coupled failure. The scaffold hint ("check whether examples/custom-elements.d.ts needs an entry") still points at a file that says never to add entries.
- (+) Breaking each step once was easy with a 4-item substitution loop, and each failed with its step name.

## Cross-cutting
- (S) Biggest finding this run: **the spec is the single source of truth, but three hand-maintained registries outside it** (barrel, types barrel, host-checks table) **are what cause merge conflicts and red CI** when components are built in parallel. The spec system already knows every component (`spec list`) and so does `package-root.test.js`. If the registries were derived (generated, or discovered from disk), parallel component work would conflict only on genuinely shared decisions.
- (S) Second: **cross-component conventions** (size names, the `image`/`href` neutral-vs-HTML naming question, `decorative` vs Icon's "no label means decorative") aren't captured anywhere a new spec can reference. Each component re-decides them by reading its neighbors. One short "conventions" guideline record (sizes, naming of URL parameters, how a component becomes decorative) would make the fourth and fifth component specs faster and consistent. I chose `decorative` over Icon's implicit pattern because Avatar needs `name` for initials even when hidden. That's a reasonable divergence, but nothing prompts the author to think about it.
- (o) For a simple, single-element component, most of the friction was environment and registries, not the spec format.
