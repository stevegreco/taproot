# ADR 0002 — Theming policy

**Status:** Accepted

## Context

The system ships two themes built from one primitive palette. Nothing written down says how a
semantic token is supposed to differ between them, so each token was decided on its own merits.
The results disagree.

[TOK-01](../token-architecture-audit.md#tok-01): `semantic.color.accent.default` flips
`robRoy.700 → robRoy.400` across themes — a 30-point L\* jump — while all four
`status.*.default` tokens hold one value in both. Measured against each theme's page background:

| | Light | Dark |
|---|---|---|
| Primary button | 5.33 | 8.36 |
| Danger button | 4.91 | **3.26** |

In light mode the two read as siblings. In dark mode primary is a luminous gold chip and danger
barely separates from the page.

[TOK-02](../token-architecture-audit.md#tok-02): within the dark theme, hovering primary steps
toward the *light* end of its ramp (`robRoy.400 → 300`) while hovering danger steps toward the
*dark* end (`rust.500 → 700`). Same theme, same gesture, inverted feedback.

Both were locally defensible when authored, because no rule governed either choice. The root
cause is structural ([TOK-03](../token-architecture-audit.md#tok-03)): `rust`, `moss` and `sky`
expose four stops (`100/500/700/900`) where `robRoy` exposes thirteen. There is no `rust.400`,
so `status.danger` *cannot* mirror what `accent` does — the token it would need does not exist.
The dark theme was authored as far as the palette allowed, then stopped.

Compounding this, the terminal stop of each short ramp is a retrofitted dark-mode background
wearing a ramp number ([TOK-04](../token-architecture-audit.md#tok-04)). `rust.700` is 11.5° hue
at 65% saturation; `rust.900` is 22.5° at 20%. Lightness stays monotonic, so the build never
warns — but "one stop darker" means something different depending on where you stand.

Three questions need answering before any of that can be fixed mechanically:

1. Should status colors flip across themes as accent does, or should accent stop flipping?
2. Which direction do hover and press move, and does it depend on the theme?
3. What is a numbered ramp stop actually promising?

## Decision

### 1. Mirrored ramps

Accent **and** status both invert lightness across themes. A token that resolves to a dark stop
in the light theme resolves to a correspondingly light stop in the dark theme, and its paired
foreground inverts with it.

This is already accent's behaviour and what the dark theme is visually designed around.
Abandoning the flip would mean surrendering the 8.36:1 primary contrast dark mode currently
earns, in exchange for consistency we can get more cheaply by fixing the four tokens that were
left behind. **The defect is status not flipping, not the flip itself.**

Rejected alternative — freeze accent to match status: cheaper to implement (four tokens stay
put, five change) but it lowers the best contrast pair in the system to fix the worst, and it
makes the dark theme a tinted copy of the light one rather than a design in its own right.

### 2. Interaction-state direction

In light themes, `hover` and `press` step toward the **darker** end of the ramp.
In dark themes, they step toward the **lighter** end.

The rule is per-theme and admits no exceptions. Interaction states always move *away* from the
page background, so the feedback gets stronger under the cursor in both themes. `press` is one
stop further along than `hover` and must never resolve to the same value as `hover` — a state
that is visually identical to the one before it is not a state.

### 3. Ramp integrity

A numbered stop in a hue ramp holds that ramp's hue within **~2°** and its saturation within
**~5 points** of its neighbours. Lightness is monotonic across the ramp with roughly even
spacing. That is the whole promise a stop number makes: same hue family, one step of lightness.

**Surfaces are not ramp stops.** A near-neutral fill tinted toward a hue is a different kind of
value and belongs in a `primitives.surface.*` group, not at position 900 of a hue ramp. If a
value cannot satisfy the hue and saturation bounds above, it is not a stop and must not be
numbered as one.

## Consequences

- `rust`, `moss` and `sky` must be extended to the full `50…950` scale so status tokens have
  stops to flip to. Existing `100/500/700` values are anchors and do not move ([#7](https://github.com/stevegreco/design-system/issues/7)).
- All four statuses gain the full interactive contract — `default`, `hover`, `press`,
  `onDefault`, `foreground`, `background` — in both themes ([#11](https://github.com/stevegreco/design-system/issues/11)).
  This changes published token values and is a breaking change.
- `rust.900`, `moss.900`, `sky.900`, `robRoy.850` and `robRoy.925` fail the integrity rule and
  move to `primitives.surface.*` ([#10](https://github.com/stevegreco/design-system/issues/10)).
  Consumers referencing those primitive paths directly will break; the semantic tokens that
  reference them keep resolving to the same values.
- Decisions 1 and 3 are machine-checkable and become assertions in the theme parity check
  ([#2](https://github.com/stevegreco/design-system/issues/2)), which is what stops TOK-01 and
  TOK-04 from recurring.
- Decision 2 is not fully machine-checkable — a script can assert that hover and press move in
  the same direction and differ from each other, but not that the direction is the *intended*
  one for a novel token. It stays a review rule backed by a partial assertion.
- Adding a fifth status color now has a defined shape to fill rather than a precedent to guess at.
