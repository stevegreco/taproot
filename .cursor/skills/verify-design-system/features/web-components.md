# Web components

Every component in `@stevegreco/web-components` is a framework-agnostic custom element whose documentation page exposes its published behavior. The component list is `apps/documentation/examples/*.tsx`; each file's slug matches `/components/<slug>`.

## Sub-features

- `component-preview` renders each component's docs example.
- `component-behavior` passes the steps in `examples/<slug>.verify.js`, which the example's
  `Verify:` header names.
- `component-styles` consumes component and semantic token contracts.

## How to get to it (user POV)

- Open `/components/<slug>` for each example and use its Preview.
- Install and import `@stevegreco/web-components` as documented on those pages.

## Driving it with Playwright

Preconditions:

- Doctor passes for the run-owned documentation URL.
- `pnpm exec turbo run build --filter=@stevegreco/web-components` succeeds.
- Chromium is installed for Playwright.

- **List components.** Glob `apps/documentation/examples/*.tsx`. Each basename is a slug.
- **Open each component.** Navigate to `/components/<slug>`. Require the page heading, Preview section, and example route `/blume-examples/<slug>/`.
- **Run its checks.** Run `control.mjs examples <run-id> <port>`. It opens `/components/<slug>`, requires the preview frame to embed `/blume-examples/<slug>`, waits for the example to hydrate, and runs the steps in `apps/documentation/examples/<slug>.verify.js`. Read that file to see what each step requires. The docs tests (`test/examples.test.ts`) run the same steps in CI against the built site.
- **Run behavior tests.** Execute `pnpm exec turbo run test --filter=@stevegreco/web-components`. Require every Chromium component test and the mapping CSS coverage test to pass.
- **Proof.** `control.mjs examples` saves one screenshot per example and `result.json`. Pair them with the component browser-test result.

## Gotchas

- Component internals use shadow DOM; target the custom element or explicitly enter its shadow root.
- The docs preview may be hosted in Blume's example surface, so locate its frame or linked `/blume-examples/*/` route before querying the custom element.
- Every example needs a `Verify:` header naming `<slug>.verify.js`. The docs tests fail without one.
