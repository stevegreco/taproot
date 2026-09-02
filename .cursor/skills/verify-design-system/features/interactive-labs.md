# Interactive labs

The labs show semantic background, foreground, border, typography, elevation, and shape tokens in realistic light and dark contexts.

## Sub-features

- `labs-index` exposes all six lab entry points.
- `border-lab-width` switches the border specimens between thick and thin widths.
- `labs-themes` renders supported light and dark comparisons.
- `labs-vocabulary` labels specimens with their semantic role.

## How to get to it (user POV)

- Open `/labs`, then choose Background, Foreground, Border, Typography, Elevation, or Shape.
- Open `/labs/border` directly to use the `Preview border width` controls.
- Follow the matching lab links from `/design-tokens/semantic`.

## Driving it with Playwright

Preconditions:

- Doctor passes for the run-owned documentation URL.
- The token package has built successfully.

- **Check the index.** Navigate to `/labs`. Require links to `/labs/background`, `/labs/foreground`, `/labs/border`, `/labs/typography`, `/labs/elevation`, and `/labs/shape`.
- **Open border lab.** Navigate to `/labs/border`. Require `[aria-label="Semantic border lab"]` and `[data-border-stage]`.
- **Record initial state.** Require the stage to have `data-border-size="thick"` and the Thick control to have `aria-pressed="true"`.
- **Switch width.** Select `[data-border-size-button="thin"]`. Require stage size `thin`, Thin pressed `true`, and Thick pressed `false`.
- **Proof.** Run `node .cursor/skills/verify-design-system/scripts/control.mjs border "$RUN_ID" "$PORT"` to save before/after screenshots, ARIA snapshots, and `result.json`.

## Gotchas

- The lab intentionally displays light and dark boards together; this is separate from the global site theme.
- Decorative subtle and muted-brand borders do not carry the functional 3:1 requirement.
- Generated CSS classes are not stable handles.
- Verifying only the border lab does not cover all six lab routes; report the exact routes exercised.
