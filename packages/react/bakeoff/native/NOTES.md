# Tabs, native React: bake-off notes

Built from `ds-spec get component.tabs`, `rules --id component.tabs`, `tokens component.tabs --resolve`,
`links component.tabs`, and `packages/tokens/dist/css/tokens.css`. No behavior library: only react
and react-dom. I did not read `--impl web`, `packages/components`, `apps`, `docs`, or the other bake-off
folders.

## 1. API

```tsx
<Tabs accessibleName="Account settings" defaultValue="profile" onChange={(value) => …}>
  <TabsSection value="profile" label="Profile">…</TabsSection>
  <TabsSection value="billing" label="Billing">…</TabsSection>
</Tabs>
```

- `Tabs` props: `accessibleName` (required string), `value` (controlled), `defaultValue`
  (uncontrolled), `onChange(value: string)`, `className`. `Tabs.Section` is an alias of `TabsSection`.
- Sections are children, not an array prop. The spec says "sections are ordered content, not a
  parameter" and each carries a label, a value, and rich content, so JSX children read naturally.
  `TabsSection` renders nothing; `Tabs` reads its props with `Children.forEach`. This is simple and
  works with SSR, but sections must be direct children (no wrapper components or fragments of
  sections built elsewhere). A context-registration API would lift that limit at the cost of an
  extra render and ordering logic.
- Both controlled and uncontrolled. The spec has one `value` parameter with no default and says
  "a product can still read and set the value itself", which in React means controlled; most uses
  just want a starting tab, which means `defaultValue`.
- `onChange` receives the value string, not an event. The spec event has no payload description;
  the value is the only useful thing.
- `accessibleName` maps to `aria-label` on the tab list. I kept the spec's name rather than
  `aria-label` / `aria-labelledby` so the parameter is visible in the API; there is no way to point
  at a visible heading by id (see gaps).
- Only the selected panel is rendered (one `tabpanel` element). Other panels are unmounted.

## 2. Guesses, ambiguities, and gaps

1. **One panel or one per section?** Accessibility section says "one tab panel for the selected tab";
   `one-selected` says "only its panel is shown or exposed". I render one panel and unmount the
   rest, so panel state (form inputs, scroll) is lost on switch. Could have kept every panel mounted
   with `hidden`. *Would remove the guess:* a sentence on whether unselected panel content is kept
   (state preserved) or discarded.
2. **`aria-controls` on unselected tabs.** With one panel, only the selected tab gets
   `aria-controls`. The spec does not say. *Would remove:* follows from (1).
3. **Payload of `change`.** Events section says only "The selected tab changed from user
   interaction." I pass the new value. *Would remove:* "reports the new value".
4. **Content rule enforcement (`labels-short-and-unique`).** "Short" has no measure. I warn in the
   console on duplicate labels (case-insensitive, trimmed), duplicate values, and an empty
   accessibleName, and do not check length. *Would remove:* whether implementations must check
   anything, and a length guideline if so.
5. **Duplicate values.** Anatomy says each section supplies "a unique value" but no rule covers it
   or says what happens on duplicates. I warn and the first match wins.
6. **accessibleName vs. a visible heading.** The parameter description says a visible heading
   "usually says the same thing", which suggests labelling by the heading, but the parameter is a
   string. I use `aria-label`. *Would remove:* whether a reference to existing visible text is an
   allowed alternative.
7. **Reading direction.** `keyboard-tabs` and rationale say arrows follow reading direction. I read
   `getComputedStyle(tablist).direction` at keydown. Up/Down arrows are not mentioned; "arrow keys
   along the row" implies only Left/Right, so Up/Down do nothing.
8. **Panel focusability.** `panel-reachable` says the panel is the next stop "even when it holds
   nothing focusable". I always give it `tabIndex=0`. The spec does not say whether it should stay a
   stop when the panel does have focusable content (APG makes that optional). Always-on is the
   simplest reading.
9. **Controlled mode with a parent that ignores `onChange`.** Arrow keys move focus but selection
   stays put. The spec says focus and selection move together; it cannot cover a parent that
   refuses. Noted, not handled.
10. **Selected tab re-click / hover on the selected tab.** Hover and selected both set foreground to
   default; hover also sets a background. I let hover apply on the selected tab too. The spec does
   not list combined conditions (`selected + hover`).
11. **Zero sections.** Not covered. I render an empty tab list and no panel.
12. **Focus ring geometry.** Token bindings give only the ring color. Width and offset came from the
   global `--ds-semantic-focus-width` / `--ds-semantic-focus-offset` tokens, which the spec does not
   bind. For the tab I used a negative offset (ring inside the tab) so it is not clipped by the tab
   list's `overflow-x: auto`; that is my choice, not the spec's.
13. **Indicator geometry.** The selected-indicator binding is a `background` color only. Thickness,
   position (bottom edge), width (full tab or label), and shape are guesses: a 2px bar along the
   bottom of the tab, full width. The anatomy says "mark on the selected tab" and rationale mentions a
   "sliding indicator" being rejected, which implies a bar. *Would remove:* a size token or a short
   visual description.
14. **Tab-list border.** Binding is `border` with a color token. Which side and what width are not
   given. I used the bottom edge and `--ds-semantic-border-width`.
15. **Radius on the tab vs. the bottom bar.** Radius applies to the tab (all corners per the binding),
   so the hover background is a rounded pill sitting on a square-ended bar. Unclear if intended.
16. **Overflow scrolling (`few-tabs`).** "A row that overflows scrolls sideways" is a behavior claim
   inside a SHOULD content rule. I implemented `overflow-x: auto`. Scrolling the selected tab into
   view on keyboard moves is left to the browser's focus scrolling.
17. **Forced colors.** Rationale says the indicator takes "the system highlight". I map that to the
   CSS `Highlight` system color with `forced-color-adjust: none` on the pseudo-element (otherwise
   Chromium overrides background in forced colors). The focus outline also uses `Highlight`. The spec
   does not say which system color the focus ring uses.
18. **Hover on touch.** Not mentioned; `:hover` as-is.

## 3. Token references to CSS

- The mapping is mechanical and worked for every binding: dots to dashes, camelCase to kebab, `--ds-`
  prefix (`semantic.typography.label.md.fontFamily` -> `--ds-semantic-typography-label-md-font-family`).
  I learned the `--ds-` prefix and the camelCase rule from `tokens.css`, not from the spec.
- Property names in the binding table are spec vocabulary, not CSS: `foreground` -> `color`,
  `padding-horizontal` -> `padding-inline`, `padding-vertical` -> `padding-block`, `focus-ring` ->
  `outline` color, `border` -> one border's color (side and width guessed), `background` on the
  indicator -> the pseudo-element background. Each was a judgment call; no table defines them.
- `focus-ring` names only a color. Width/offset needed tokens the spec does not reference (gap 12).
- Indicator size had no token at all; it is the only raw length in `tabs.css` (2px).

## 4. Rules

| Rule | Level | Status | Tests |
| --- | --- | --- | --- |
| component.tabs#one-selected | MUST | met | `component.tabs#one-selected` (3 tests) |
| component.tabs#selection-reports-change | MUST | met | `component.tabs#selection-reports-change` (5 tests) |
| component.tabs#keyboard-tabs | MUST | met | `component.tabs#keyboard-tabs` (5 tests, includes RTL) |
| component.tabs#panel-reachable | MUST | met | `component.tabs#panel-reachable` |
| component.tabs#accessible-tabs | MUST | met | `component.tabs#accessible-tabs` (3 tests) |
| component.tabs#forced-colors | MUST | met | `component.tabs#forced-colors` (2 tests; forced colors emulated through CDP in Chromium) |
| component.tabs#labels-short-and-unique | MUST | partial | `component.tabs#labels-short-and-unique` (3 tests): uniqueness and name warned at runtime; "short" not checked |
| component.tabs#few-tabs | SHOULD | met (fallback only) | `component.tabs#few-tabs`: overflow scrolls sideways in one row; tab count is the author's job |

Token spot-checks are in the `tokens` describe block (6 tests: tab-list border and gap, tab base,
hover, selected, focus on tab and panel, panel padding). Totals: 29 tests, all passing; 7 met,
1 partial, 0 missed.

## 5. Effort

- Longest: the styling guesses (indicator geometry, border side, focus ring width/offset) and the
  forced-colors test, which needed `cdp()` from `vitest/browser` to emulate `forced-colors: active`.
- Behavior (roving tabindex, arrows with RTL, Home/End, controlled/uncontrolled, change only on user
  selection) was quick: the rules and keyboard table were precise enough to write tests directly.
- Typecheck needed a `tabs.css.d.ts` next to the stylesheet; the package has no `*.css` module
  declaration for local stylesheets (only for `@stevegreco/design-system/css`).
