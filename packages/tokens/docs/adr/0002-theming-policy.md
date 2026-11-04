# ADR 0002 — Theming policy

**Status:** Accepted

## Context

The system ships light and dark semantic themes built from one theme-independent primitive
palette. Both themes must expose the same semantic contracts while selecting primitive values that
remain legible and perceptually appropriate in their own context.

Without a shared policy, matching roles can become static across themes, interaction feedback can
move in opposite directions, and one-off surface values can be disguised as numbered palette stops.

## Decision

### Semantic paths are identical across themes

Light and dark theme files define the same semantic token paths. Theme selection changes resolved
values, not the public vocabulary.

Color paths begin with their application:

```text
semantic.color.<background|foreground|border>.<intent>[.<variant>][.<state>]
```

Background tokens style fills, foreground tokens style text and icons, and border tokens style
boundaries and focus indicators. A shared value does not make those contracts interchangeable.

### Theme selection belongs in the semantic tier

Primitive colors describe fixed palette values and do not belong to a theme. Each semantic theme
selects the numbered stop that best serves the role; matching semantic paths do not need matching
step numbers.

Every published semantic color must respond meaningfully to theme selection unless an explicit,
documented exemption is added to the parity audit. `foreground.disabled` is currently exempt: the
same neutral gray remains recognizable and appropriately de-emphasized in both themes.

### Explicit themes override the system preference

When the root element has no `data-theme` attribute, CSS selects the light or dark semantic theme
from `prefers-color-scheme`. Light remains the default when the browser does not expose a
preference.

`data-theme="light"` and `data-theme="dark"` override the system preference. Removing the
attribute restores automatic selection. The CSS also publishes the matching `color-scheme` value
so browser-controlled interface elements follow the active theme.

### Interaction states move away from the page background

For an accepted stateful family such as
`semantic.color.background.action.primary.{default,hover,pressed}`:

- light themes move `hover` and `pressed` toward darker stops;
- dark themes move them toward lighter stops; and
- `pressed` moves farther than `hover` and must not resolve to the same value.

State names use `pressed`, not `press`. A semantic interaction family is published only when a
current consumer requires the contract.

### Numbered ramps preserve palette integrity

A numbered hue-ramp stop must maintain:

- monotonically decreasing lightness as the stop number increases;
- saturation within the audit's adjacent-stop bounds; and
- monotonic hue drift where saturation is high enough for hue to be meaningful.

A one-off surface fill is a semantic selection, not a primitive role or a dishonest numbered stop.

### Contrast is checked by supported pairing

Foreground and border contracts are audited against the backgrounds they support. Paired content
uses explicit `foreground.on.*` paths, such as `foreground.on.action.primary`, instead of a generic
inverse token whose compatible background is unknown.

Disabled colors remain recognizable but are exempt from WCAG minimum contrast requirements.

## Consequences

- Light and dark semantic files maintain structural parity.
- CSS consumers follow the system color preference until the product sets an explicit root theme.
- Components consume semantic variables directly, so they inherit theme changes.
- The contrast audit encodes supported foreground/background and border/background pairings.
- The parity audit enforces theme response and interaction-state direction.
- The ramp audit prevents theme-specific surface values from entering primitive color ramps.
