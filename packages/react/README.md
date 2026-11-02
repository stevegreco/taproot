# @stevegreco/design-system-react

React components built from the design system spec and styled with the design system tokens. The
package is a second implementation of the spec, and a research project: it checks that the spec is
enough to build a component in another technology. Findings are logged in
[`docs/research/react-implementation.md`](../../docs/research/react-implementation.md).

Components wrap [React Aria Components](https://react-spectrum.adobe.com/react-aria/) for behavior
and accessibility, and style it with the token custom properties. The Tabs bake-off in the research
log records why.

## Use

Load the token stylesheet and the component stylesheet once, then import components:

```tsx
import "@stevegreco/design-system/css";
import "@stevegreco/design-system-react/style.css";
import { Tabs, TabsSection } from "@stevegreco/design-system-react";

<Tabs accessibleName="Account settings" defaultValue="profile">
  <TabsSection value="profile" label="Profile">…</TabsSection>
  <TabsSection value="billing" label="Billing">…</TabsSection>
</Tabs>;
```

## Conventions

Every component follows these, so components built separately from the spec stay consistent.

**Files.** `src/<name>/<Name>.tsx` imports `src/<name>/<name>.css`. Tests are in
`test/<name>.test.tsx`, the mapping to the spec in `implementation/<name>.md`, and `src/index.ts`
exports the component and its prop types.

**Behavior.** Wrap the matching React Aria component. Write plain React only when React Aria has
none, or when its component contradicts the spec, as its focusable tag does for Badge. Add no other
library.

**API.**

- Props take the spec's parameter names and value spellings. The mapping file renames a value only
  when React forces it.
- A spec event becomes an `on<Event>` callback that receives the new value. It runs only for a
  person's interaction, never for a prop change or a form reset.
- A parameter that holds a value the person changes has a controlled prop (`value`, `checked`) and
  an uncontrolled one (`defaultValue`, `defaultChecked`).
- `accessibleName` becomes `aria-label`. Every component takes `className` on its root.
- Content rules that code can check, such as an empty label or a repeated value, log
  `console.warn("<Name>: …")` from an effect.

**Styling.**

- The root is `ds-<name>`, and each anatomy part is `ds-<name>__<part>`, named as in the spec.
- Parameters are data attributes on the root (`data-variant`, `data-size`). States come from React
  Aria's data attributes (`data-hovered`, `data-pressed`, `data-focus-visible`, `data-selected`,
  `data-disabled`, `data-invalid`).
- Every value is a token custom property: `--ds-` plus the token path, with dots and camel case
  turned into hyphens (`semantic.typography.label.md.fontSize` is
  `--ds-semantic-typography-label-md-font-size`).
- Where the spec binds a color but no shape, use `--ds-semantic-border-width`,
  `--ds-semantic-focus-width`, and `--ds-semantic-focus-offset`, and leave a comment saying the
  spec does not bind it.
- Every component has a `@media (forced-colors: active)` block that keeps its indicators and focus
  ring visible in system colors.

**Form controls** use `src/internal/form-field.ts`: React Aria's `aria` validation mode,
`useControllableState`, `useNativeInput` to keep the native input's checked state, `required`, and
error message in step, and `useFormReset` so a reset restores the default without reporting a
change. A non-empty `error` blocks submit, and the browser shows its text.

**Tests** run in Chromium. Name each test after the rule it checks (`component.tabs#one-selected`),
and check a sample of the token bindings with `getComputedStyle`.

## Develop

From the repository root:

```bash
pnpm exec turbo run build --filter=@stevegreco/design-system-react
pnpm exec turbo run test --filter=@stevegreco/design-system-react
```

`tsdown` bundles `src/index.ts` to `dist/` with type declarations, and `@tsdown/css` collects every
component stylesheet into `dist/style.css`. Tests run in Chromium through
Vitest browser mode, with the token stylesheet loaded. `pnpm --filter
@stevegreco/design-system-react typecheck` checks the types.

Each component's mapping from React props and events to spec parameters and events goes in
`implementation/<name>.md`, which `ds-spec get <name> --impl react` serves.
