# @stevegreco/design-system-react

React components built from the design system spec and styled with the design system tokens. The
package is a second implementation of the spec, and a research project: it checks that the spec is
enough to build a component in another technology. Findings are logged in
[`docs/research/react-implementation.md`](../../docs/research/react-implementation.md).

No components are published yet.

## Develop

From the repository root:

```bash
pnpm exec turbo run build --filter=@stevegreco/design-system-react
pnpm exec turbo run test --filter=@stevegreco/design-system-react
```

`tsdown` bundles `src/index.ts` to `dist/` with type declarations. Tests run in Chromium through
Vitest browser mode, with the token stylesheet loaded. `pnpm --filter
@stevegreco/design-system-react typecheck` checks the types.

Each component's mapping from React props and events to spec parameters and events goes in
`implementation/<name>.md`, which `ds-spec get <name> --impl react` serves.
