# Tabs on React Aria Components: bake-off log

Built from `ds-spec get component.tabs`, `rules --id component.tabs`, `tokens component.tabs --resolve`,
`links component.tabs`, `tokens.css`, ADR 0003 in `packages/tokens/docs/adr/`, and React Aria's
type definitions and source in `node_modules`. Result: 33 tests pass, `tsc` passes.

## 1. API

```tsx
<Tabs accessibleName="Account settings" value={v} onChange={setV}>
  <TabsSection value="profile" label="Profile">…</TabsSection>
  <TabsSection value="billing" label="Billing">…</TabsSection>
</Tabs>
```

- **Sections are children**, one `TabsSection` per section with `value`, `label` (a string), and
  the panel content as its children. The spec says "Sections are ordered content, not a parameter"
  and "each section supplies its tab's label and a unique value", so a child per section reads the
  closest. `TabsSection` renders nothing; `Tabs` reads its props and builds React Aria's `TabList`,
  `Tab`, and `TabPanel` from them. Callers never see React Aria's split of tabs and panels.
- **`label` is a string**, not a node: the rationale says every tab has a text label.
- **`value` / `defaultValue` / `onChange(value)`**: controlled and uncontrolled, the usual React pair.
  The spec has one `value` parameter and a `change` event. `onChange` receives the new value, which
  the spec does not say (it only says change is reported).
- **`accessibleName` is required** in the type, since the MUST rule says the set has a name. It maps
  to `aria-label` on the tab list.
- No orientation, activation mode, disabled, or size props, because the rationale rules each out.
- Dev-time `console.warn` for an empty `accessibleName`, an empty label, and repeated labels or
  values. A repeated value is also dropped, because React Aria throws on a duplicate key.

## 2. Guesses, ambiguities, and gaps in the spec

1. **What `change` carries** (Events). The spec says change is reported, not with what. I pass the
   new value. Would remove the guess: an event payload line, such as "detail: the new value".
2. **Controlled versus uncontrolled** (Parameters, `value`). The spec has one `value`. React needs
   to know whether the component owns the state. I offered both. A note on whether `value` is an
   initial value or a live binding would settle it per technology.
3. **What an unmatched controlled value looks like after a click** (`one-selected`,
   `selection-reports-change`). With `value="missing"` the first tab shows as selected. Clicking it
   reports nothing, since it is "the tab that is already selected". I chose that; the spec could
   say it outright.
4. **panel-reachable when the panel holds a focusable control** (`#panel-reachable`). "The panel is
   the next keyboard stop" can mean the panel element itself always takes a stop, or that the next
   stop lands in the panel. React Aria (like the APG) makes the panel focusable only when it holds
   nothing tabbable, so with a button inside the next stop is the button. I kept that; it satisfies
   the "so its content can be reached" clause. The panel `focus` token binding hints the panel is
   always focusable. Would remove the guess: "the panel takes a stop only when it holds nothing
   focusable" or "always".
5. **Selected indicator shape** (Anatomy `selected-indicator`, tokens). Only its color is bound.
   Position (bottom edge? under the label?), thickness, and length are unspecified. I drew a bar
   along the bottom of the tab with `primitives.border.thick` (2px). Would remove the guess: a
   `size`/`thickness` binding and one sentence on placement.
6. **Tab-list border side and width** (tokens `tab-list base border`). The binding gives a color only.
   I guessed a bottom rule with `semantic.border.width`. A border-width binding and a side would fix it.
7. **Focus ring width and offset** (tokens `tab focus focus-ring`, `panel focus focus-ring`). Only
   the color is bound. I used `semantic.focus.width` and `semantic.focus.offset`, which exist in
   `tokens.css` but not in the spec's bindings. I drew the tab ring inset (negative offset) because
   the sideways-scrolling row clips an outside ring. The spec could bind width and offset, or say the
   focus-ring property implies the system focus tokens.
8. **Hover on the selected tab** (States). Does the hover background apply to the selected tab? I
   apply it. A `selected + hover` row (or a note that conditions compose) would settle it.
9. **Panel horizontal padding** (tokens `panel base padding-vertical`). Only vertical is bound, so I
   read horizontal as zero.
10. **Indicator colour under forced colors** (rationale "takes the system highlight"). The rationale
    names `Highlight` for the indicator but not for the focus ring; it says rings "keep their
    outline". I also set ring color to `Highlight` so it is a system color. A forced-colors row in the
    token table would make this checkable.
11. **Reading direction source** (rationale, `keyboard-tabs`). "Reading direction" is clear in
    intent; for React Aria it matters where direction comes from (see section 3).
12. **labels-short-and-unique is a content rule.** Nothing in code can judge "short". I warn on
    repeats and empty names only. The rule mixes a content check with "the set has an accessible
    name", which overlaps `accessible-tabs`.
13. **few-tabs scroll behavior.** "A row that overflows scrolls sideways" is stated inside a SHOULD
    content rule, though scrolling is the component's behavior, not the author's. Nothing says
    whether the selected tab scrolls into view on load. React Aria scrolls a focused tab into view; I
    did nothing extra.

No need to read web implementation files came up; nothing here required `packages/components`.

## 3. React Aria defaults versus the spec

- **Unmatched or empty value.** React Aria differs in both modes. Controlled with a key that matches
  no tab: nothing is selected and no panel renders (breaks `one-selected`). Uncontrolled: it falls
  back to the first tab by calling `setSelectedKeys` in an effect, which fires `onSelectionChange`
  (breaks `selection-reports-change`, "setting the value programmatically reports nothing"). Read in
  `react-stately/private/tabs/useTabListState.mjs`. **Overrode**: I resolve the value myself (match
  or first section) and always run React Aria controlled with the resolved key, keeping my own state
  for the uncontrolled case.
- **Reading direction.** React Aria takes arrow direction from its locale (`useLocale`, default the
  browser language), not from the `dir` the page renders in. Under `<div dir="rtl">` without an
  `I18nProvider`, ArrowLeft moved backwards. **Overrode**: a layout effect reads the tab list's
  computed `direction` and, when it disagrees with the locale, wraps only the tab list in an
  `I18nProvider` with an `ar` or `en-US` locale. Confirmed by removing the wrapper: the RTL test
  fails. This costs one extra render on mount in a mismatched page.
- **Duplicate keys throw** ("Duplicate key … found in collection"). Overrode by dropping repeats.
- **Matches with configuration**: automatic activation (`keyboardActivation="automatic"`, the
  default), horizontal orientation, wrapping arrows, Home/End, roving tabindex so Tab enters at the
  selected tab, `aria-labelledby`/`aria-controls` between tab and panel, only the selected panel
  mounted, and no `onSelectionChange` when the selected tab is pressed again.
- **Panel tab stop**: React Aria's rule (focusable only without tabbable content) is one reading
  of `panel-reachable`; see guess 4.
- **Unused surface I had to keep out**: disabled tabs, vertical orientation, manual activation,
  link tabs, `shouldForceMount`. My API exposes none of them.
- **State selectors**: `[data-hovered]` (mouse only, no sticky hover on touch), `[data-focus-visible]`,
  `[data-selected]`. These map cleanly to the spec's states.

## 4. Token references to CSS

- The name mapping is mechanical: `semantic.color.border.subtle` becomes
  `--ds-semantic-color-border-subtle`, and camelCase segments go kebab
  (`label.md.fontFamily` to `--ds-semantic-typography-label-md-font-family`). Not written down in the
  spec output; I inferred it from `tokens.css`.
- Compound properties (`border`, `focus-ring`) bind one color token, while CSS needs width, style,
  and side too. See guesses 5 to 7.
- `padding-horizontal` / `padding-vertical` map to `padding-inline` / `padding-block`; logical
  properties keep RTL right without extra rules.
- `foreground` is `color`, `background` on `selected-indicator` is the pseudo-element's
  `background`. The indicator is a part with no element of its own in React Aria, so it is
  `::after` on the tab; `getComputedStyle(tab, "::after")` checks it.
- Forced colors: an `::after` background is replaced in forced colors unless
  `forced-color-adjust: none`; with it the bar keeps `Highlight`.

## 5. Rules

| Rule | Level | Result | Tests |
| --- | --- | --- | --- |
| component.tabs#one-selected | MUST | met | `component.tabs#one-selected (MUST)` block: exactly one selected, no/empty/unmatched value, stays single |
| component.tabs#selection-reports-change | MUST | met | `component.tabs#selection-reports-change (MUST)` block: pointer, keyboard, already selected, fallback, programmatic, controlled |
| component.tabs#keyboard-tabs | MUST | met (with the RTL override) | `component.tabs#keyboard-tabs (MUST)` block: Tab in/out, arrows wrap, Home/End, RTL |
| component.tabs#panel-reachable | MUST | met for an empty panel; partial reading for a panel with controls (guess 4) | `component.tabs#panel-reachable (MUST)` block |
| component.tabs#accessible-tabs | MUST | met | `component.tabs#accessible-tabs (MUST)` block |
| component.tabs#forced-colors | MUST | met (emulated via CDP `Emulation.setEmulatedMedia`) | `component.tabs#forced-colors (MUST)` block |
| component.tabs#labels-short-and-unique | MUST | partial: repeats and missing name warn; "short" is a content judgment | `component.tabs#labels-short-and-unique (MUST)` block |
| component.tabs#few-tabs | SHOULD | met for the behavior part (row scrolls, no wrap) | `component.tabs#few-tabs (SHOULD)` |

Token spot checks (in `token bindings`): tab base colour, font size and weight, padding, radius;
selected foreground and indicator fill; hover background and foreground; tab and panel focus ring
colour; tab-list border colour and gap; panel padding.

## 6. Effort

- Longest: finding React Aria's behavior for unmatched keys and the fallback that reports a change,
  which needed reading `useTabListState` source, and the RTL direction source.
- Second: the token gaps for compound properties (indicator size, border side, focus width).
- Test harness: the first run in a fresh Vite cache failed every test with "Cannot read properties
  of null (reading 'useSyncExternalStore')", a duplicate React from Vite discovering
  `react-aria-components` mid-run. The second run passed. Adding it to `optimizeDeps.include` in
  `vitest.config.ts` would likely prevent it; I did not change the config. Failure screenshots land
  in `packages/react/.vitest/attachments/failure-screenshots/tabs.test.tsx/` (gitignored), a folder
  name the other bake-off folders may share.
- Forced-colors testing needed `cdp()` from `vitest/browser`, which works only in Chromium.
