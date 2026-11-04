# React implementation research

This log goes with `packages/react`, a second implementation of the spec built in React. The work
tests two claims:

1. The spec can support components written in a technology other than web components.
2. The spec alone is enough to build a new implementation of an existing component.

Component behavior belongs in the spec records. This document records what building from them
showed.

## Status

This is a dated log, so the findings below stay as written. Open ones are filed as issues #271
through #283. These are resolved:

- Tabs and Select now declare their sections and choices as `items`.
- `get`, `search`, and the agent guidance name every implementation equally instead of web first.
- A configured implementation folder that does not exist reads as nothing implemented.
- `format` serves the binding property names and the system-wide constants, including border and
  focus-ring geometry, so agents can reach them without reading SPEC.md.
- An event that reports a changed value carries the new value.
- A prose `instead` renders as written, not mid-sentence in capitals.

## Method

- **Spec-only implementers.** Each component is built by a fresh agent that may read only `ds-spec`
  output (`get`, `rules`, `tokens`, `links`) and the published tokens. It never reads
  `packages/components` or the web implementation files. Every guess it makes, and every time it
  needs something the spec does not say, goes in the log below.
- **Review.** The integrating agent checks each component against `rules <id>` and records a
  finding for every MUST or SHOULD rule that was missed, misread, or impossible to verify.
- **Approach bake-off.** Tabs is built three ways (native React, Base UI, React Aria Components)
  before the package commits to one approach. Each is scored on rules met, code size, how the token
  styling fits, and how directly its API maps to the spec's parameters, events, and items.

## Findings

Each finding names the area it would change (spec, implementation, tooling, docs, or process) so it
can become a labeled issue at the end.

### Setup

- **The implementation-file format only fits web components.** _Tooling._ `tagName` is required
  and must contain a hyphen, `defineExport` is required, and an API row can only be an attribute,
  property, or event. A React component has a PascalCase name, no registration function, and props,
  callback props, and children. The generated usage section also assumes a custom element. Adding a
  second implementation to `spec.config.json` works, and `get --impl react` reports that nothing is
  implemented yet, so the gap is the file format, not the lookup.
  _Resolved:_ each implementation in `spec.config.json` now declares its `technology`, and files are
  checked against that technology's fields. React files name an `export` and map `prop` and
  `callback` rows. Web files and the docs site are unchanged.
- **`component:status` assumes web is the only implementation.** _Process._ It checks fixed
  `packages/components` paths, so it cannot report the state of a React port or of a component that
  exists only in React.
- **A configured implementation folder that does not exist crashes the CLI.** _Tooling._ Before
  the folder existed, `get tabs --impl react` printed a raw `ENOENT: no such file or directory`
  error instead of saying nothing is implemented. The folder now holds a `.gitkeep`.
- **CLI tests read the repository's own `spec.config.json`.** _Tooling._ Two tests asserted that
  `web` was the only configured implementation, so adding `react` broke them. They now expect both;
  a fixture config would keep them independent of the repository's setup.

## Bake-off: Tabs

Three agents built Tabs from the spec alone in `packages/react/bakeoff/`, one each with native
React, Base UI, and React Aria Components. Each kept a `NOTES.md` of its guesses. The three builds
and their notes are in commit `256fd48`.

### Before the builds

Reading `get component.tabs` as an implementer turned up these, before any code:

- **Tabs does not model its sections as items.** _Spec._ Accordion now describes its sections as
  repeated items (ADR 0004), but Tabs still describes them only in the panel's anatomy text ("Each
  section supplies its tab's label and a unique value"). Every implementation has to invent the
  section API, and the API mapping cannot check it.
- **Token references don't say how to reach the value in code.** _Tooling._ `tokens --resolve`
  gives `semantic.color.border.subtle` and its light and dark values, but not the CSS custom
  property (`--ds-semantic-color-border-subtle`). The naming rule lives only in the token build.
- **Guidance and help text name `--impl web`.** _Tooling._ The agent guidance and the `get` help
  describe implementations as "the package, element, and attributes", which only fits web
  components.
- **An unlinked alternative renders mid-sentence in capitals.** _Docs._ "Use A step-by-step flow
  with previous and next actions instead." The renderer inserts the `instead` text as written.

### Results

All three builds pass their own tests and `tsc`. As an independent check, each build's tests were
also run against the other two builds. Every behavior test passed on every build: selection,
keyboard, change reporting, the unmatched-value fallback, accessible names, and reading direction.
Failures came only from styling guesses, warning wording, and indicator markup. The spec's behavior
rules produced three builds that behave the same. Its visual bindings did not.

| | Native | Base UI | React Aria |
| --- | --- | --- | --- |
| Rules met / partial / missed | 7 / 1 / 0 | 6 / 2 / 0 | 6 / 2 / 0 |
| Own tests | 29 | 25 | 33 |
| `Tabs.tsx` + `tabs.css` lines | 193 + 83 | 142 + 78 | 168 + 85 |
| Workarounds for library behavior | none | 6 | 3 |
| Bugs found by the cross-run | none | infinite render loop on a repeated section value | none |

The partial ratings are mostly the same two: nobody can test "short" in `labels-short-and-unique`,
and forced colors is hard to test in browser mode (native emulated it through Chromium's DevTools
protocol, the others only checked the CSS).

**Native React** has no dependencies and no workarounds. Tabs is small enough that hand-writing
roving focus and the arrow keys is cheap, but Select, Dialog, and Tooltip need much more: typeahead,
popover placement, focus trapping, and dismissal.

**Base UI** fought the spec most. It selects on Enter or Space unless told otherwise, reports its
own automatic selections, selects nothing for an unmatched value, reports one click twice in
controlled mode, ignores the page's `dir`, and measures its indicator in JavaScript to slide it,
which the spec's "nothing animates" rationale does not need. A repeated section value sent it into
an infinite render loop.

**React Aria Components** needed three workarounds. It selects nothing for an unmatched controlled
value and reports its own fallback when uncontrolled, takes arrow-key direction from its locale
instead of the page, and throws on a repeated key. Its state attributes (`data-hovered`,
`data-focus-visible`, `data-selected`) line up with the spec's states, so the CSS reads like the
token table. One run failed with a duplicate-React error on a cold Vite cache; it did not happen
again in a clean rerun.

### Decision

The package wraps React Aria Components. It needed half the workarounds Base UI did, its state
attributes map directly onto the spec's states, and it covers the behavior the harder components
need. The tradeoff: a library supplies some behavior the spec also states, so a React Aria build
tests those rules less hard than hand-written code. The cross-run eases that for Tabs, because the
behavior tests come from the spec, not the library.

The React Aria build became `src/tabs`. The other two builds were removed.

### Spec findings from the builds

The three agents worked separately and reported most of the same gaps. The number in brackets is
how many of the three reported it.

- **Visual bindings name a color but not a shape.** _Spec._ [3] The selected indicator binds only
  a fill, so thickness and placement were guessed (all three chose a 2px bar under the tab). The
  tab-list `border` names a color with no side or width. The focus ring names a color, and all three
  borrowed the global focus width and offset tokens, which the spec does not reference.
- **Binding property names are an unwritten vocabulary.** _Spec._ [3] `foreground`,
  `padding-horizontal`, `focus-ring`, and `border` are not CSS properties, and nothing defines them.
  Together with the token-to-custom-property naming, every implementer inferred the mapping.
- **`change` has no payload.** _Spec._ [3] All three passed the new value, but the spec says only
  that the selection changed.
- **One `value` parameter, two React patterns.** _Spec._ [3] React needs controlled and
  uncontrolled values. The spec does not say what happens when a product never applies a reported
  change, or what a controlled value that matches nothing looks like after a click.
- **Whether hidden panels keep their content is unstated.** _Spec._ [3] All three builds discard
  hidden panels, so form fields and scroll position in them reset when the person switches tabs.
  Nothing in the spec says whether that is allowed.
- **Reading direction has no defined source.** _Spec._ [3] Arrow keys follow "reading direction",
  but both libraries take it from their own context, not the page. Each build read the computed
  CSS direction.
- **`panel-reachable` reads two ways.** _Spec._ [2] The panel can always take a keyboard stop, or
  only when it holds nothing focusable. The panel's focus token suggests always.
- **Unspecified combinations.** _Spec._ [2–3] Hover on the selected tab, a repeated section value,
  zero sections, the panel's horizontal padding, and the focus ring's system color under forced
  colors.
- **Content rules can't be checked in code.** _Spec._ [3] "Short" in `labels-short-and-unique` and
  "a handful" in `few-tabs` have no measure. All three warn on repeated labels and an empty name
  instead.

## Components

### Tabs

- **The import line is incomplete because Tabs has no items.** _Spec._ `get tabs --impl react`
  imports only `Tabs`, because the record has no section item to name `TabsSection`. The section
  API lives only in the mapping file's prose, and the coverage check cannot see it. Modeling
  sections as items, as Accordion does, would fix both.
- **The docs site and Storybook show only the web components.** _Docs._ The React mapping is
  served by the CLI and MCP server, but no page shows it, and the docs tests only check the web
  folder.

### Batch 1: Button, Badge, Switch, Checkbox

Four spec-only agents ported these at the same time, following the Tabs conventions. All four
pass their tests (146 between them), `tsc`, and `get <name> --impl react`.

| Component | Built on | Tests | Rules met / partial / not testable |
| --- | --- | --- | --- |
| Button | React Aria `Button` | 45 | 5 / 2 / 3 |
| Badge | plain React | 26 | 3 / 1 / 0 |
| Switch | React Aria `SwitchField` | 29 | 5 / 1 / 0 |
| Checkbox | React Aria `CheckboxField` | 46 | 7 / 1 / 1 |

Badge is plain React because React Aria's tag can be focused, which `not-a-control` forbids. The
"not testable" rules are content rules, such as `label-describes-result`.

Review fixed two things. Switch used React Aria's native validation, so a submit blocked by an
error showed "Invalid value." instead of the error text; it now sets the error as the input's
validation message, as Checkbox does, and a test checks the message. Badge's empty-label warning
ran on every render.

#### Spec findings

Findings that also came up in Tabs are marked; they are now the clearest pattern in the log.

- **Bindings name colors but not shapes.** _Spec._ [All five components] Border width and style,
  focus ring width and offset, and indicator geometry are unbound everywhere. Every agent borrowed
  `semantic.border.width` and the global focus tokens, which no record references. Switch's track
  size is only in rationale prose, and its thumb size is nowhere. Binding these once, in the records
  or in a shared guideline, would remove most guesses in the log.
- **Forced colors names no system colors.** _Spec._ [Tabs, Button, Badge, Switch, Checkbox] Rules
  say what must stay visible, not which system color each part takes. Button and Badge have no
  forced-colors rule, so their variants become indistinguishable.
- **Form behavior lives in the pattern, not the records.** _Spec._ [Switch, Checkbox] "A non-empty
  error blocks submit" is only in `pattern.form-field`. Neither record says what a person sees when a
  required checkbox blocks submit with no error.
- **Form reset contradicts `programmatic-no-events`.** _Spec._ [Switch, Checkbox] `form-value` says
  reset restores the initial state, but a controlled React value can only be restored by reporting
  a change, which `programmatic-no-events` forbids. Is reset a programmatic change?
- **Optional icons have no parameter.** _Spec._ [Button, Badge] Both anatomies mention an optional
  icon, but nothing says how it is supplied, where it sits, or what size it is.
- **State that is also a parameter.** _Spec._ [Checkbox] `indeterminate` is a parameter, but
  activation clears it with no event to tell the owner.
- **Disabled focus is unstated.** _Spec._ [Button] React Aria removes a disabled button from the tab
  order, which makes `explain-disabled` harder. The spec does not say either way.
- **Two events, unclear difference.** _Spec._ [Switch, Checkbox] `input` and `change` are described
  in nearly the same words. Both agents fire both on every toggle.
- **The required marker is unspecified.** _Spec._ [Checkbox] "Conveyed by more than color" names no
  text, marker, or token. The agent added an English " (required)".
- **Unbound combinations.** _Spec._ Secondary hover and pressed bind no border, the error message
  has no disabled color while the hint does, and small buttons keep medium label type.

#### Implementation and process findings

- **Agents chose different conventions.** _Process._ Button marks its variant with a class
  (`ds-button--primary`), Badge with a data attribute (`data-variant`). Switch and Checkbox each
  wrote their own form-reset handling and chose different validation modes, which caused the Switch
  bug. The package needs a short conventions section and shared helpers for form fields before the
  next batch.
  _Resolved:_ the package README now has a conventions section, Button marks its variant, size, and
  full width with data attributes, and Switch and Checkbox share `src/internal/form-field.ts` for
  validation, native input sync, and form reset. Later briefs point agents at the conventions.
- **React Aria's own form reset reports a change.** _Implementation._ Both form controls had to
  suppress it to meet `programmatic-no-events`.
- **React Aria deprecated `Switch` and `Checkbox` in 1.22.** _Implementation._ The ports use the
  newer `SwitchField` with `SwitchButton` and `CheckboxField` with `CheckboxButton`.

### Batch 2: Select and Dialog

Two spec-only agents ported these after the conventions were written down, and both followed them
without being corrected. Both pass their tests, `tsc`, and `get <name> --impl react`. Screenshots
of the default, invalid, and disabled selects and of an open dialog matched the spec.

| Component | Built on | Tests | Rules met / partial / not testable |
| --- | --- | --- | --- |
| Select | plain React around the platform select | 40 | 3 / 0 / 0 |
| Dialog | React Aria `ModalOverlay`, `Modal`, `Dialog` | 27 | 11 / 0 / 2 |

Select is plain React because the spec rules out a custom overlay, and React Aria's Select draws
its own popover. The shared form helper was written for checkable inputs, so the agent wrote its
own reset and validity code; review widened `useNativeInput` and `useFormReset` to take a select,
and Select now uses them. Dialog needed its own code for four things React Aria does differently:
focus goes to the title on open, `aria-modal` is set, the description is linked, and Escape raises
a cancel event the owner can prevent.

#### Spec findings

- **Collections still have no shape.** _Spec._ [Select, and Tabs before it] Select has no parameter
  or anatomy part for its choices, and groups appear only inside the `form-value` rule. Every
  implementation invents the choice structure. Choices and groups are repeated items in the ADR 0004
  sense, as Tabs' sections are.
- **Open and close are owner decisions the spec does not model.** _Spec._ [Dialog] `cancel` and
  `close` follow the platform dialog, but nothing says how a dialog whose owner holds `open` asks to
  close. The agent added `onOpenChange`, which has no spec event. The spec also says `close` fires
  on a programmatic change, the one exception to the "events come from people" rule every other
  component follows; it should say so on purpose.
- **Layout values are missing.** _Spec._ [Dialog] No width, viewport gutter, or stacking order.
  Dialog hard-codes `min(32rem, 100%)` and a z-index of 1000; the system has no layer token.
- **`required` needs a placeholder the spec never defines.** _Spec._ [Select] A required select only
  blocks submit when an empty choice exists, and `named-choices` says every choice has a value.
- **Rules that conflict or read two ways.** _Spec._ [Dialog] `cancellation` mentions "only the
  active modal", but the rationale says dialogs never nest. `content-scroll` does not say which part
  scrolls. `visible-focus` requires a ring on initial focus, which means `:focus`, not the usual
  `:focus-visible`.
- **Repeated from batch 1.** Border and focus ring geometry (now seven of seven components), forced
  colors without system colors, the required marker, `input` versus `change`, and a missing
  indicator part (Select's chevron).

#### Tooling findings

- **`get` points at the web implementation first.** _Tooling._ A plain `get component.dialog` ends
  with "run `--impl web`" and lists React only in parentheses, which nudged the agent toward the web
  file it was told not to read.

## Summary so far

Seven components exist in React, each built by an agent that read only the spec, the tokens, and
the React package. All behavior rules that code can test are met, and no agent needed to read the
web components. What the spec could not supply was mostly visual and structural:

1. **Geometry.** Every component guessed border width, focus ring width and offset, and indicator
   size, and all of them reached for the same global tokens. This is the largest gap.
2. **Collections.** Tabs' sections and Select's choices are lists the records describe only in prose.
3. **Ownership of state.** Controlled values, form reset, `indeterminate`, and dialog closing all
   need the spec to say who owns a value and when a change is reported.
4. **Forced colors and layout.** The rules name what must stay visible, not the system colors or
   sizes that achieve it.

Agents working in parallel also diverged on code conventions until the package wrote them down.
After that, the second batch needed one fix: widening the shared form helper.

## React-first component: Slider

Slider is the test of the first claim: a component that starts in the spec and is built only in
React. It follows the usual phases on this branch: a draft spec reviewed before anything is built,
then the React build, which completes the spec.

### Draft

The draft names the purpose, four boundaries (Text field for exact numbers, Select for named
options, Progress bar for read-only amounts, Switch for two states), and eight anatomy parts.
`validate` and `component:status slider --phase spec` pass, and `get slider --impl react` says
there is no React implementation yet.

Open questions for the build phase, each a public API decision:

- Parameters: `min`, `max`, and `step` as numbers, and whether `value` has a default.
- How the value text is formatted, such as a unit or currency, and whether people can type in it.
- What separates `input` from `change`. A slider reports continuously while dragging, which is the
  first component where the two events clearly differ.
- Out of scope unless needed: two thumbs for a range, vertical orientation, and tick marks.

### Build

The spec now has nine parameters, two events, six states, ten rules, tokens for every part, and
fourteen rationale entries. The open questions were settled as follows:

- `min` 0, `max` 100, and `step` 1 by default, and `value` defaults to `min`. A value outside the
  range or between steps shows as the nearest allowed value (`value-in-range`).
- The value text is the number in the reader's locale. Units go in the label, and there is no
  format parameter yet. The text is not editable: an exact number is a Text field.
- `input` reports every new value while dragging or pressing a key. `change` reports once on
  release, and only when the value differs from where the person started (`change-on-release`).
- One thumb, horizontal, no ticks, each recorded in `rationale`.

The React Slider wraps React Aria's Slider, Label, SliderOutput, SliderTrack, SliderFill, and
SliderThumb. It has 46 tests named after the rules, and `get slider --impl react` serves its
mapping. React Aria fit the contract with four adaptations:

1. **Change is not React Aria's `onChangeEnd`.** `onChangeEnd` runs after every drag or key press,
   even when the value did not move, and `onChange` can repeat a value. The component keeps the
   value from before the interaction and filters both.
2. **Form reset reports `onChange`.** React Aria restores the native input on reset by calling its
   change handler. The shared `useFormReset` from the form-field helper covers it unchanged.
3. **A value prop outside the range renders outside the track.** React Aria clamps only values a
   person sets, so the component snaps the prop to the range and step before passing it on.
4. **Direction comes from React Aria's locale, not the page.** A right-to-left page left the thumb
   on the left and the fill on the right. Tabs already had a hook for this; it moved to
   `src/internal/direction.ts`, and Slider gives the locale only to the track, so the value text
   keeps the reader's number format.

### Findings

- **The draft missed a part.** _Spec._ The label and value sit on one line, which needs a
  container the draft did not name. The build added `header`. Draft review checks purpose and
  boundaries, not layout, so a missing container shows up only when someone builds it.
- **The `input` and `change` wording now has a precise version.** _Spec._ Slider is the first
  component where the two events clearly differ, and its definitions ("every new value" and "once
  on release, only when different") could replace the vague wording that Switch, Checkbox, Select,
  and Text field share.
- **Size is bound for the first time.** _Tokens._ The thumb's `size` uses `primitives.space.5`
  because there is no semantic size role (tokens ADR 0003).
- **Token categories cross.** _Tokens._ The thumb's border uses a background token
  (`background.surface`), and the disabled fill and thumb use a border token
  (`border.disabled`), because there is no disabled color for a filled indicator. The borrowed
  color works, so the rationale records it instead of a new token.
- **SPEC.md already answers several "gaps", but agents never see it.** _Tooling._ It lists the
  binding property names (including `size`) and decides that border width and focus-ring width and
  offset are system-wide constants a component does not list. Agents read the spec only through
  the CLI, which does not serve SPEC.md or name those constant tokens, so every port guessed them.
  Much of the geometry finding is a reachability problem, not missing content.
- **The spec does not say how large the press target is.** _Spec._ `drag-or-press` lets people
  press anywhere on the track, but the bound track height is 8 pixels. The React build makes the
  track as tall as the thumb and draws the line inside it. The web build will have to guess the
  same way.
- **`component:status --phase implementation` is web-only.** _Tooling._ It reports seven missing
  `packages/components` files and looks for rule tests in `packages/components/test`, so a
  React-only component can never pass it. It should check each configured implementation.
- **The docs tests required a web implementation for every built component.** _Docs._ "Not a
  draft" meant "has a web implementation file". The test now accepts an implementation in any
  configured folder, and the docs site still builds pages only for web components, so Slider has
  no docs page. A React-only component has nowhere to be read except `ds-spec get`.
- **Search hints always point at the web implementation.** _Tooling._ Every `search` result ends
  with "→ ds-spec get … --impl web", even for an agent working in React. It should list each
  implementation, or none.
