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
