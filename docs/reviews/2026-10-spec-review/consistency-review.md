# Spec review: consistency and completeness

Repo: `stevegreco/design-system` at `eacd841` (main). Scope: `packages/spec` (SPEC.md, README, 16 records), checked against the token files, the component stylesheets, the `component:status` checklist, and Markdown links across the repo. No repo changes were made.

**Baseline (what is already healthy):** `pnpm spec validate` passes (16 records, no issues). Every token reference in every component record resolves to a real token in the configured DTCG sets. Every record link, `instead` ID, rule reference, and section anchor resolves. The problems below are semantic drift that the validator cannot see.

Severity: **High** = the spec says something false or misses something it claims to own. **Medium** = the same concept is expressed differently across records, which hurts querying and authoring. **Low** = polish.

---

## High

### H1. Token maps disagree with the stylesheets and break tokens ADR 0003
- `checkbox.spec.yaml` tokens `control.base.radius: primitives.radius.xs`, and its rationale says "No semantic radius fits a 16px box". But `semantic.radius.compact` exists (`shape.tokens.json`, described as "Small controls, such as the checkbox box") and `checkbox.css` uses it.
- `alert.spec.yaml` (`title.base.font-weight: primitives.weight.semibold`) and `dialog.spec.yaml` (`title`: body.md plus `primitives.weight.semibold`) both say a primitive weight distinguishes the title. But `semantic.typography.title` exists ("Bold title above body copy in alerts and dialogs") and `alert.css` and `dialog.css` use it.
- Tokens ADR 0003 says "Never reference a primitive when a semantic token already expresses the same intent" and "its stylesheet reads the same tokens". The spec is the stale side.
- **Fix:** Update the three records and their rationale entries. To stop this recurring, add a check (a test or a line in `component:status`) that each component's CSS `--ds-*` variables match the record's token references.

### H2. No record maps border width or focus-ring width and offset
- All 12 stylesheets use `semantic.border.width`. Every focusable component uses `semantic.focus.width` and `semantic.focus.offset`. No record references them, even though SPEC.md lists `border-width` as a standard property. `focus-ring` maps only the color.
- **Fix:** Pick one. Either add `border-width` and `focus-width`/`focus-offset` to the token maps (and add the latter two to the SPEC property list), or have SPEC.md say that system-wide constants are out of scope for per-component maps.

### H3. The "decide what it ships" checklist is incomplete on older records and undefined in SPEC.md
- From `node scripts/component-status.mjs <name> --phase implementation`:
  - Badge leaves all 10 items unsettled.
  - Link leaves 7: loading, invalid, density, icon-only, right-to-left, reduced motion, forced colors.
  - Text field leaves 7: selected, loading, sizes, density, right-to-left, reduced motion, forced colors.
  - Button leaves 5: loading, invalid, density, right-to-left, forced colors.
  - Alert, Tabs, and Icon settle every item with `covers`.
- SPEC.md (rationale row) says `covers` names "the checklist items" but never lists them. The IDs live only in `scripts/component-status.mjs`.
- **Fix:** Backfill rationale entries with `covers` for those four records. Add the list of checklist IDs to SPEC.md under `rationale`, so the format defines its own vocabulary.

---

## Medium

### M1. `label` means two different things
- In Text field, Checkbox, Switch, Radio group, Select, Text area, Alert, and Dialog, `label` is the visible text, and it is also the accessible name. Alert rationale (lines 287–292) makes this a convention: "label stays the one name for the visible text that names a component."
- In Tabs (`label`: "It is not shown") and Icon (`label`: what the graphic means, never visible), `label` is a hidden accessible name.
- Button uses `accessibleName` for the same hidden-name idea, and Alert uses `dismissLabel`.
- **Fix:** Reserve `label` for visible text. Use `accessibleName` for hidden names (Tabs, Icon, and Alert's `dismissLabel`, or document that `*Label` exception). Write the convention in SPEC.md.

### M2. Size values are named two ways
- Button `size: sm | md`; Icon `size: small | medium | large | inherit`. Typography tokens use `sm`/`md`/`lg`.
- **Fix:** Use `sm | md | lg` everywhere.

### M3. The same requirement has different rule IDs in different records
This hurts `pnpm spec rules` and citing rules by address.
- **Visible focus:** `a11y-visible-focus` (Button, Link, Text field, Text area, Select, Checkbox), `visible-focus` (Dialog, Alert), and no separate rule in Switch or Radio group (folded into their forced-colors rule).
- **Forced colors:** `a11y-forced-colors` (Checkbox), `forced-colors` (Dialog, Alert), `forced-colors-visible` (Switch), `visible-state` (Radio group), `visible-selection` (Tabs).
- **Disabled:**
  - `disabled-prevents-activation` (Button)
  - `disabled-blocks-editing` (Text field, Text area, and Select, whose statement says "Disabled prevents choosing")
  - `disabled-blocks-toggle` (Checkbox, Switch)
  - `disabled-options` (Radio group)
- **Form behavior:** `error-blocks-submit` vs Radio group `invalid-submit`; `a11y-required` vs Radio group `required-message`; `form-value` vs Switch `optional-form-value`.
- **The `a11y-` prefix:** used in 7 records, absent in Dialog, Alert, Tabs, Switch, and Radio group, even though `topic: accessibility` already carries that meaning.
- **Fix:** Add a short "shared rule IDs" list to SPEC.md, such as `a11y-visible-focus`, `a11y-forced-colors`, `disabled-blocks-interaction`, `error-blocks-submit`, `form-value`, and `a11y-required`. Rename the outliers, and decide once whether to keep the `a11y-` prefix.

### M4. The form-control family has drifted
- Switch and Radio group lack rules the other field controls share: `error-says-what-to-fix`, `hint-adds-guidance`, and a standalone visible-focus rule.
- Text field lacks the rationale entries that Text area and Select have (sizes, right-to-left, forced colors), and it lacks `follows: guideline.compose-or-propose`.
- Wording varies for the same idea:
  - "non-empty" vs "nonempty" (Switch, Radio group)
  - "submitted" vs "recorded" (Switch)
  - error as "What to fix" vs "Failure text" (Switch)
  - `value` defaults to `"on"` (Checkbox) vs `on` (Switch)
- **Fix:** Treat the field family (label, hint, error, name, value, disabled, required) as one block of shared text. Copy it verbatim into each record, or define it once in a guideline and reference it.

### M5. The radio group label uses the wrong typography, and its option labels have no tokens
- Text field, Text area, and Select style the field label with `semantic.typography.label.md`. Radio group's group label has the same role but uses `body.md`.
- Radio group's option labels have no anatomy part and no tokens: `choice` is a container, and `label` is the group label.
- **Fix:** Give the group label `label.md`. Add an `option-label` part with `body.md`, matching Checkbox and Switch.

### M6. Switch contradicts itself about forms
- Usage says "Turn a setting on or off without a separate submit action", and Checkbox's avoid entry sends "no submit" cases to Switch.
- Yet Switch has `name`/`value`, `optional-form-value`, and `error-blocks-submit` ("blocks the switch's form from submitting").
- **Fix:** State the stance explicitly, for example "Switch applies immediately and may also submit with a form". Otherwise, drop the form rules.

### M7. State combinations are recorded two different ways
- Checkbox writes explicit combinations: `checked + hover`, `checked + invalid`, and the `* + disabled` cases.
- Switch and Radio group give only single-state conditions and explain precedence in prose ("Disabled colors override…", "Selected and invalid borders take precedence over hover"). So `pnpm spec tokens switch --condition "checked + hover"` returns nothing.
- SPEC.md allows both styles.
- **Fix:** Pick one. Explicit conditions are the more queryable choice, and Checkbox already uses them.

### M8. "checked" and "selected" are mixed up
- Radio group's state is `checked`, but its rationale says "Selected and invalid borders…" and "Disabled colors override selected…". Tabs uses `selected`.
- **Fix:** Use `checked` for form choices and `selected` for Tabs, and make each record's rationale use its own state name.

---

## Low

### L1. The token map uses values and properties that SPEC.md does not list
- SPEC.md says only `transparent` and `none` may stand in for a token. Icon uses `foreground: inherit` and `size: inherit`, and Link's inline variant uses `font-*: inherit`.
- Dialog uses a `shadow` property and Icon a `size` property. Neither is in the preferred property list.
- **Fix:** Add `inherit` as an allowed value, and add `shadow` and `size` to the property list.

### L2. `sources` is used unevenly
- Nine records cite tokens ADR 0003 in `sources`. Dialog, Switch, Radio group, and Tabs do not, though Tabs' rationale cites "ADR 0003".
- **Fix:** Add the source everywhere or drop it everywhere. Dropping it is simpler, because every record follows the ADR.

### L3. YAML authoring style is mixed
- Switch, Radio group, and parts of Dialog use flow maps (`{ id: …, statement: ….,}`) with Prettier-style trailing commas. The rest use block style. Flow style is harder to diff and edit.
- **Fix:** Reformat to block style and enforce it with the YAML formatter.

### L4. Badge has duplicate rules
- `non-interactive` and `a11y-not-a-control` say the same thing.
- `a11y-no-live-region` and `a11y-surrounding-ui-announces` overlap.
- **Fix:** Merge each pair.

### L5. Badge has an icon but no link to Icon
- Badge's content part has "an optional leading icon" and a token gap for it, but Badge has no `composes: component.icon`. Button, Link, and Alert do. Icon instead lists Badge as `related`.
- **Fix:** Add `composes: [component.icon]` to Badge.

### L6. Plain-text `instead` values are inconsistent
- Their form varies: "Rich text editor", "Multi-select or combobox", "A dedicated view", "an image in the surrounding page" (lowercase), "The field's own error message".
- Alert's "A persistent Alert the person dismisses" names Alert itself as the alternative.
- **Fix:** Use sentence case, and phrase each as the thing to use instead.

### L7. `accessibility.role` mixes formats
- Some records give a short role name ("Button", "Checkbox", "Text input"). Others give a paragraph (Tabs, Icon, Alert).
- **Fix:** Keep `role` a short name, and move the behavior into rules.

### L8. Broken links
- `docs/adr/0002-record-format.md:7` links to `packages/knowledge/SPEC.md`, which was renamed to `packages/spec/SPEC.md`. AGENTS.md sends readers to this ADR, so this one matters.
- `docs/research/component-contracts/{opus-5,gpt-6,fable-5-1}.md` have about 45 dead links into the removed `packages/knowledge`. These docs are historical. Add a one-line "paths predate the rename" note rather than fixing each link.

---

## Suggested order for a simple first pass
1. Fix H1 (three records) and decide H2. These are the only places where the spec is factually wrong.
2. Settle naming conventions in a short "Conventions" section of SPEC.md: `label` vs `accessibleName` (M1), size values (M2), shared rule IDs (M3), checked vs selected (M8), allowed token values and properties (L1), and the checklist IDs (H3). Then rename the outliers in one sweep.
3. Backfill the H3 checklist gaps on Button, Link, Badge, and Text field.
4. Clean up the rest (L2–L8) opportunistically.
