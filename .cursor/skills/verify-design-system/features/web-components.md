# Web components

Every component in `@stevegreco/design-system-components` is a framework-agnostic custom element whose documentation page exposes its published behavior. The component list is `apps/documentation/examples/*.tsx`; each file's slug matches `/components/<slug>`.

## Sub-features

- `component-preview` renders each component's docs example.
- `component-behavior` passes the `Verify:` steps in that example's header comment.
- `component-styles` consumes component and semantic token contracts.

## How to get to it (user POV)

- Open `/components/<slug>` for each example and use its Preview.
- Install and import `@stevegreco/design-system-components` as documented on those pages.

## Driving it with Playwright

Preconditions:

- Doctor passes for the run-owned documentation URL.
- `pnpm exec turbo run build --filter=@stevegreco/design-system-components` succeeds.
- Chromium is installed for Playwright.

- **List components.** Glob `apps/documentation/examples/*.tsx`. Each basename is a slug.
- **Open each component.** Navigate to `/components/<slug>`. Require the page heading, Preview section, and example route `/blume-examples/<slug>/`.
- **Run its checks.** Read the `Verify:` block at the top of `apps/documentation/examples/<slug>.tsx` and perform those steps inside the example surface.
- **Run behavior tests.** Execute `pnpm exec turbo run test --filter=@stevegreco/design-system-components`. Require every Chromium component test and the mapping CSS coverage test to pass.
- **Proof.** Save one screenshot per component showing the result its `Verify:` block asks for, then pair them with the component browser-test result.

## Gotchas

- Component internals use shadow DOM; target the custom element or explicitly enter its shadow root.
- The docs preview may be hosted in Blume's example surface, so locate its frame or linked `/blume-examples/*/` route before querying the custom element.
- An example without a `Verify:` block only needs the page, Preview, and example route checks.
