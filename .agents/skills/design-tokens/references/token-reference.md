# Design Token Reference

## Color Palette Intent

| Scale | Role |
|---|---|
| `robRoy` | Brand accent — warm golden-yellow. Primary CTAs, highlights, warning states. |
| `blueSmoke` | Neutral UI — cool grey-green. Text, borders, secondary surfaces. |
| `clay` | Warm background — earthy off-white to dark brown. Page and surface backgrounds. |
| `moss` | Success state. |
| `rust` | Danger / error state. |
| `sky` | Info state. |

## Semantic Token Intent

Semantic tokens express *purpose*, not appearance. When in doubt about which to use, ask "what is this element *for*?" not "what color should it be?"

| Category | Intent |
|---|---|
| `background.*` | Page and surface backgrounds (default, raised, sunken, muted) |
| `foreground.*` | Text and icon colors, ordered by emphasis (default → muted → subtle → faint) |
| `border.*` | Dividers and outlines |
| `accent.*` | Primary brand interaction color — buttons, links, focus rings |
| `secondary.*` | Supporting interaction color — secondary buttons, tags |
| `status.success/danger/warning/info` | Feedback states — each has `default`, `foreground`, `background` sub-tokens |

## Choosing Among Published Tiers

Use an existing component token when it covers the exact component property, variant, or state.
Component tokens are published selectively, so their absence does not mean the component is
unsupported. Use the semantic token that expresses the intended role for properties without a
matching component token, and use a primitive only when neither published layer fits.

Examples for a token consumer:

```css
/* An existing token covers this exact component variant. */
background: var(--component-button-primary-background);

/* No component token covers this property; use its semantic intent. */
color: var(--semantic-color-foreground-default);

/* Neither published layer expresses this raw scale choice. */
gap: var(--primitives-space-2);
```

## Naming Conventions

| Segment | Meaning |
|---|---|
| `background` | Background color |
| `foreground` | Foreground / text / icon color |
| `border` | Border color |
| `radius` | Border radius |
| `paddingX` / `paddingY` | Horizontal / vertical padding |
| `shadow` | Box shadow |
| `hover` / `press` | Interaction states |
| `soft` | Low-intensity tinted background variant |
| `muted` / `subtle` / `faint` | Decreasing levels of emphasis |
| `onAccent` | For use on top of an accent-colored background |

## CSS Variable Derivation

Token paths map to CSS variables by replacing `.` with `-` and prepending `--`:

```
component.button.primary.background  →  var(--component-button-primary-background)
semantic.color.border.default  →  var(--semantic-color-border-default)
```
