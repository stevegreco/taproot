# Tabs on Base UI: bake-off log

Built from `ds-spec get component.tabs`, `rules --id component.tabs`, `tokens component.tabs --resolve`,
`links component.tabs`, the token stylesheet, and the Base UI 1.9.0 type definitions and compiled
source in `node_modules/@base-ui/react/tabs`. No web component files, apps, docs, or raw spec
content were read.

Result: 25 tests pass (`pnpm exec vitest run bakeoff/base-ui`), `pnpm exec tsc` is clean.

## 1. API

```tsx
<Tabs accessibleName="Settings" defaultValue="profile" onChange={(value) => …}>
  <TabSection value="profile" label="Profile">…</TabSection>
  <TabSection value="billing" label="Billing">…</TabSection>
</Tabs>
```

- `accessibleName: string` is required in the type, because the MUST rules require a name for the set.
- `value` (controlled) and `defaultValue` (uncontrolled). The spec has one `value` parameter; React
  convention needs both, and a product that only wants to read the selection should not have to
  own state. Both go through the same rule: empty or unmatched selects the first section.
- `onChange(value: string)` maps the spec's `change` event. It carries the new value only, not
  Base UI's event-details object, so the API does not leak Base UI.
- Sections are `TabSection` children (also `Tabs.Section`), each with `value`, `label`, and rich
  content. The spec says sections are "ordered content, not a parameter", and children are React's
  content channel. Trade-off: Tabs reads children's props, so a section wrapped in another
  component is not found. A `sections` array prop would avoid that but reads less like content.
- No `orientation`, `activateOnFocus`, disabled, or className props: the spec rules them out.

## 2. Guesses, ambiguities, and gaps in the spec

1. **Tab-list border geometry** (tokens: `tab-list / base / border`). The binding names a color
   only. Which edge, and what width? I guessed a 1px bottom edge. A binding for border width (or a
   rationale line saying "a rule under the row") would remove the guess.
2. **Indicator size and placement** (anatomy `selected-indicator`, token `selected-indicator /
   selected / background`). No thickness, no position. "Mark on the selected tab" could be an
   underline, a fill, or a dot. I guessed a 2px bar along the bottom of the tab, over the list
   border. A thickness token and one sentence on placement would settle it.
3. **Focus ring width and offset** (tokens `tab / focus / focus-ring`, `panel / focus /
   focus-ring`). Only the color is bound. The token set has `semantic.focus.width` and
   `semantic.focus.offset`, which I used, but the spec does not list them, so this is inferred
   from token names. The tab ring is inset because the list scrolls (`overflow-x: auto`) and would
   clip an outer ring; the spec does not say what happens to focus rings in a scrolling row.
4. **"focus-ring" is a property name, not a CSS property.** I read it as outline color. Same for
   `padding-horizontal`/`padding-vertical` (I used logical `padding-inline`/`padding-block`) and
   `foreground` (color). A short glossary of binding properties would remove the guess.
5. **Programmatic value in controlled mode** (`one-selected`, `selection-reports-change`). With an
   unmatched controlled value the first section shows, but the product's state still holds the
   unmatched value. The spec does not say whether that fallback should be reported (I report
   nothing, which the "programmatic changes report nothing" sentence implies).
6. **Controlled value the parent rejects.** If the product does not apply the reported value, the
   selection stays put. The spec's `change` event says "the selected tab changed", which presumes
   the change is applied. Neither React controlled semantics nor the spec addresses a veto; I did
   what React expects.
7. **What "only its panel is exposed" means in practice** (`one-selected`). I render only the
   selected panel. That also means unselected tabs have no `aria-controls` target. The spec's
   Accessibility section says "one tab panel for the selected tab", so this matches, but whether
   unselected tabs should point at a panel is not stated.
8. **Reading direction source** (`keyboard-tabs`, rationale "Tab order and arrow keys follow the
   reading direction"). The spec does not say where direction comes from. I use the computed CSS
   `direction` of the root.
9. **`labels-short-and-unique` is a content rule with no testable threshold.** "Short" has no
   length; "differs" says nothing about case. I warn on duplicate labels (case-insensitive) and a
   blank name, and do not check length. A maximum or an example of too long would make it checkable.
10. **`few-tabs`** gives no number. I only implemented the fallback (horizontal scroll, one row).
11. **No hover state for the selected tab.** Tokens give hover background for `tab`; the spec does
    not say whether the selected tab gets the hover background too. I let it (hover applies to all).
12. **Panel focus ring only on keyboard focus?** I used `:focus-visible`; the spec says "focus".
13. **Dark theme** is in the resolved token table, but the test setup forces light; I spot-checked
    light only.

## 3. Base UI defaults versus the spec

| Base UI default | Spec | What I did |
| --- | --- | --- |
| `activateOnFocus` false (manual activation) | Selection follows focus | Set `activateOnFocus` on `Tabs.List`. |
| `loopFocus` true | Wrap at both ends | Kept, passed explicitly. |
| Uncontrolled root picks the first enabled tab and fires `onValueChange` with reason `initial`; removed tabs fire `missing` | Initial selection and fallbacks report nothing | Always run Base UI **controlled** with my resolved value and drop any reason other than `none`. |
| Controlled root keeps an unmatched value: no tab selected, no panel | Unmatched selects the first section | Resolve the value myself before passing it in. |
| Value `null` means no tab selected | Exactly one is always selected | Never pass `null` while sections exist. |
| Pointer press with `activateOnFocus`: activates on focus, then again on click if the value has not changed yet. In controlled mode that is **two `onValueChange` calls per click** | `change` once per selection | Dedupe: report each value once per pointer/key interaction (reset on `pointerdown`/`keydown` capture on the list). A test caught this. |
| Reading direction from `DirectionProvider` context, not the DOM `dir` | Arrow keys follow reading direction | Read computed `direction` in a layout effect and wrap in `DirectionProvider`. Costs one extra render in RTL. |
| `Tabs.Indicator` is a sibling span positioned with measured `--active-tab-left/width` CSS variables, built for a sliding animation | A mark on the selected tab; nothing animates | Used it with no transition. It depends on layout measurement (ResizeObserver), so it is not there on the very first paint without `renderBeforeHydration`. A pseudo-element on the selected tab would be simpler and need no JS. |
| Panel gets `tabIndex=0` and `aria-labelledby` the tab | `panel-reachable`, panel named by tab | Matches; nothing to do. |
| Disabled tabs supported | No disabled state | Not exposed. |
| Panels can be `keepMounted` | Only the selected panel exposed | Render only the selected `Tabs.Panel`. |
| Unstyled | Token bindings | All styling in `tabs.css`. Base UI's `data-*` attributes were not needed; selection is styled by `aria-selected`. |

## 4. Token references to CSS

- The mapping is mechanical: `semantic.color.border.subtle` → `--ds-semantic-color-border-subtle`
  (dots to hyphens, `--ds-` prefix, camelCase to kebab: `fontFamily` → `font-family`). I confirmed
  each in `packages/tokens/dist/css/tokens.css`. The rule is not written in the spec output; I
  inferred it.
- Binding property names (`foreground`, `focus-ring`, `padding-horizontal`, `border`) are not CSS
  properties and need interpretation (see guesses 1, 3, 4).
- Typography is five separate bindings (`label.md.*`) rather than one composite; fine, just verbose.
- Forced colors has no tokens; the rationale names "system highlight", which I took as `Highlight`.
- `tokens --resolve` printed values that made getComputedStyle assertions easy (hex to `rgb()`).

## 5. Rules

| Rule | Level | Status | Test |
| --- | --- | --- | --- |
| component.tabs#one-selected | MUST | met | `component.tabs#one-selected` (4 tests) |
| component.tabs#selection-reports-change | MUST | met | `component.tabs#selection-reports-change` (5 tests) |
| component.tabs#keyboard-tabs | MUST | met | `component.tabs#keyboard-tabs` (4 tests, incl. RTL) |
| component.tabs#panel-reachable | MUST | met | `component.tabs#panel-reachable` |
| component.tabs#accessible-tabs | MUST | met | `component.tabs#accessible-tabs` |
| component.tabs#forced-colors | MUST | partial | `component.tabs#forced-colors` (2 tests). The indicator is checked as a separate mark, but forced colors are not emulated in Vitest browser mode, so the test only checks that the forced-colors rules exist. |
| component.tabs#labels-short-and-unique | MUST | partial | `component.tabs#labels-short-and-unique` (2 tests). Warns on duplicate labels and a blank name; "short" is not checkable. |
| component.tabs#few-tabs | SHOULD | met (fallback) | `component.tabs#few-tabs`. The row scrolls sideways; the count is the author's job. |

Counts: 6 met, 2 partial, 0 missed. Token spot checks: 5 tests under `tokens` (tab base, list and
panel, selected and indicator, hover, focus).

## 6. Effort

Roughly an hour. Most of it went to reading Base UI's compiled source to learn its automatic
`onValueChange` reasons and its controlled-mode behavior, and to the double-report on click, which
only showed up in a controlled test. The CSS and the spec reading were quick; the token guesses
(border edge, indicator size, focus width) were quick to make but are real gaps.

## Other notes

- `pnpm exec tsc` failed before this work for every bakeoff folder (`TS2882` on `./tabs.css`
  side-effect imports; `test/setup/css.d.ts` only declares the token stylesheet). I added
  `bakeoff/base-ui/css.d.ts` with `declare module "*.css"`. Because it is ambient, it also clears
  the same error in the other two bakeoff folders.
- Content warnings run on every render and in production builds, since `process.env` is not typed
  in this package. A real package would gate them.
