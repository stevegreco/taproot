# Token theming

Token theming lets consumers keep stable semantic names while the documentation and component surfaces resolve appropriate light and dark values.

## Sub-features

- `theme-light` renders semantic color and elevation roles in the light theme.
- `theme-dark` switches the same roles to dark mappings.
- `theme-persist` preserves the user's explicit theme choice.
- `theme-contract` keeps light and dark token sets in parity.

## How to get to it (user POV)

- Open `/design-tokens/semantic` to read the semantic contracts and theming guidance.
- Use the site theme control identified by `[data-blume-theme-toggle]`.
- Open any `/labs/*` page to compare explicit light and dark examples.
- Consume the published CSS under `@stevegreco/design-system`.

## Driving it with Playwright

Preconditions:

- Doctor passes for the run-owned documentation URL.
- `pnpm build` reports theme parity and no audit failures.

- **Open the contract.** Navigate to `/design-tokens/semantic`. Require the `Semantic Tokens` page title and text naming `data-theme="dark"`.
- **Switch theme.** Use `[data-blume-theme-toggle]` and select the dark option exposed by the control. Require `document.documentElement.dataset.theme` to become `dark`.
- **Confirm persistence.** Reload the page in the same browser context. Require the dark theme to remain active and `localStorage.getItem("blume-theme")` to identify the explicit choice.
- **Compare content.** Open `/labs/background`. Require regions for both `[data-lab-theme="light"]` and `[data-lab-theme="dark"]`.
- **Proof.** Capture the semantic page before the action, after the dark-theme selection, and after reload. Pair it with the successful build audit output.

## Gotchas

- Blume owns the theme menu's internal markup; anchor automation on `[data-blume-theme-toggle]` and visible option names.
- A system-preference fallback is not proof of persisted explicit choice.
- Typography and shape mappings are intentionally theme-independent.
- The build audit exempts documented disabled-state contrast pairs; do not report those notes as failures.
