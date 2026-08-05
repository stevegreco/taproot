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

A numbered stop in a hue ramp must satisfy all three of:

- **Saturation** within **~10 points** of its neighbours when *falling*, ~15 when rising. The
  bound is directional because a collapse is the surface-fill signature; a rise is ordinary, and
  `robRoy` legitimately gains 10.9 points into its terminal stop.
- **Hue** drifting monotonically, without reversing by more than ~2° — *where there is chroma to
  carry it*. Below roughly 15% saturation hue is not a meaningful quantity: `blueSmoke` sits at
  9–13 throughout and its measured hue swings 35° between adjacent stops purely from 8-bit
  rounding. Near-neutrals are exempt from this bound, not from the other two.
- **Lightness** monotonic across the ramp, with roughly even spacing.

That is the whole promise a stop number makes: same hue family, one step of lightness.

Note what is deliberately *not* required: constant hue. Measured across the existing full ramps,
`robRoy` travels from 45.0° at stop 50 to 18.0° at 950, moving 5–6° per step through its middle;
`blueSmoke` and `clay` drift comparably. This is intentional and conventional — warm ramps redden
as they darken. A constant-hue rule would flag legitimate stops while missing the values this
clause is actually aimed at.

Saturation is the reliable discriminator. Across every ramp, true stops hold a tight band while
the retrofitted fills fall off a cliff:

| Ramp | True stops | Fill |
|---|---|---|
| `robRoy` | 62–80 | `850` 28.6, `925` 31.8 |
| `rust` | 63–65 | `900` 20.0 |
| `moss` | 22–33 | `900` 10.9 |
| `sky` | 32–42 | `900` 17.5 |

A 30–45 point collapse is unmissable. The same values also reverse their ramp's hue direction —
`robRoy` falls 45°→18° but jumps back to 36.7° at `850` — so the two tests agree.

**Surfaces are not ramp stops.** A near-neutral fill tinted toward a hue is a different kind of
value and belongs in a `primitives.surface.*` group, not at position 900 of a hue ramp. If a
value cannot satisfy the bounds above, it is not a stop and must not be numbered as one.

## Consequences

- `rust`, `moss` and `sky` must be extended to the full `50…950` scale so status tokens have
  stops to flip to. Existing `100/500/700` values are anchors and do not move
  ([#7](https://github.com/stevegreco/design-system/issues/7)). Because stop `900` in each of
  those ramps is currently a surface fill that dark-theme status backgrounds consume, extending
  the ramp and relocating the fills cannot be separated — a ramp cannot be filled to `900`
  without displacing what is already there. #7 and
  [#10](https://github.com/stevegreco/design-system/issues/10) therefore ship together.
- Status groups expose only the roles their current consumers require. Success, warning, and info
  are noninteractive and expose `default`, `foreground`, and `background`. Danger additionally
  exposes `hover`, `press`, and `onDefault` because it backs the shipped danger button. New
  interaction roles are added when a real component needs them, and then follow Decision 2.
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
