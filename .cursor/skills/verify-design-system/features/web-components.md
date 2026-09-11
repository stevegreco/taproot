# Web components

Button and Badge are framework-agnostic custom elements whose documentation previews expose their published variants and behavior.

## Sub-features

- `button-preview` renders an interactive `<ds-button>` example.
- `button-behavior` preserves native click, disabled, labeling, and form behavior.
- `badge-preview` renders all `<ds-badge>` variants.
- `component-styles` consumes component and semantic token contracts.

## How to get to it (user POV)

- Open `/components/button` and use its Preview.
- Open `/components/badge` and inspect the available variants.
- Install and import `@stevegreco/design-system-components` as documented on either page.
- Open the secondary local demo with `pnpm exec turbo run dev --filter=@stevegreco/design-system-components` when no other process owns port 4500.

## Driving it with Playwright

Preconditions:

- Doctor passes for the run-owned documentation URL.
- `pnpm exec turbo run build --filter=@stevegreco/design-system-components` succeeds.
- Chromium is installed for Playwright.

- **Open Button.** Navigate to `/components/button`. Require the Button heading, Preview section, and rendered component example route `/blume-examples/button/`.
- **Use Button.** Select the primary `ds-button` inside the example surface and require its documented visible response. Capture the action and response together.
- **Open Badge.** Navigate to `/components/badge`. Require the Badge heading, example route `/blume-examples/badge/`, and labels for default, accent, success, danger, warning, and info variants.
- **Run behavior tests.** Execute `pnpm exec turbo run test --filter=@stevegreco/design-system-components`. Require Chromium tests for shadow-button behavior, form association, disabled state, accessible names, badge variants, and generated token styles to pass.
- **Proof.** Save Button interaction and Badge variant screenshots, then pair them with the component browser-test result.

## Gotchas

- Component internals use shadow DOM; target the custom element or explicitly enter its shadow root.
- The docs preview may be hosted in Blume's example surface, so locate its frame or linked `/blume-examples/*/` route before querying the custom element.
- Badge is intentionally non-interactive and has no live-region role.
- The component demo uses fixed port 4500 and must not be started when another run or user session owns it.
