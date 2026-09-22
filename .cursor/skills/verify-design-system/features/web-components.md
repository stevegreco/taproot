# Web components

Button, Badge, and Text field are framework-agnostic custom elements whose documentation previews expose their published behavior.

## Sub-features

- `button-preview` renders an interactive `<ds-button>` example.
- `button-behavior` preserves native click, disabled, labeling, and form behavior.
- `badge-preview` renders all `<ds-badge>` variants.
- `text-field-preview` renders a `<ds-text-field>` and `<ds-button>` form.
- `text-field-behavior` shows an error, then submits a corrected email.
- `component-styles` consumes component and semantic token contracts.

## How to get to it (user POV)

- Open `/components/button` and use its Preview.
- Open `/components/badge` and inspect the available variants.
- Open `/components/text-field` and submit the email form.
- Install and import `@stevegreco/design-system-components` as documented on those pages.
- Open the secondary local demo with `pnpm exec turbo run dev --filter=@stevegreco/design-system-components` when no other process owns port 4500.

## Driving it with Playwright

Preconditions:

- Doctor passes for the run-owned documentation URL.
- `pnpm exec turbo run build --filter=@stevegreco/design-system-components` succeeds.
- Chromium is installed for Playwright.

- **Open Button.** Navigate to `/components/button`. Require the Button heading, Preview section, and rendered component example route `/blume-examples/button/`.
- **Use Button.** Select the primary `ds-button` inside the example surface and require its documented visible response. Capture the action and response together.
- **Open Badge.** Navigate to `/components/badge`. Require the Badge heading, example route `/blume-examples/badge/`, and labels for default, accent, success, danger, warning, and info variants.
- **Open Text field.** Navigate to `/components/text-field`. Require the Text field heading, Preview section, and example route `/blume-examples/text-field/`.
- **Submit Text field.** Inside the example surface, find `[data-text-field-form]`. Submit it with Continue while Email is empty and require `[data-text-field-status]` to stay on the prompt and the field error to read `Enter an email address with an @ sign.` Type `ada@example.com` into the email control, submit again, and require `[data-text-field-status]` to read `Submitted ada@example.com.`
- **Run behavior tests.** Execute `pnpm exec turbo run test --filter=@stevegreco/design-system-components`. Require Chromium tests for shadow-button behavior, form association, disabled state, accessible names, badge variants, text-field label, hint, error, and generated token styles to pass.
- **Proof.** Save Button interaction, Badge variant, and Text field submit screenshots, then pair them with the component browser-test result.

## Gotchas

- Component internals use shadow DOM; target the custom element or explicitly enter its shadow root.
- The docs preview may be hosted in Blume's example surface, so locate its frame or linked `/blume-examples/*/` route before querying the custom element.
- Badge is intentionally non-interactive and has no live-region role.
- Text field keeps its label, hint, and error in shadow DOM. Query the host, then the inner input, for the accessible name and description.
- The component demo uses fixed port 4500 and must not be started when another run or user session owns it.
