# Agent guidance

## Design system knowledge

`packages/knowledge` is the source of truth for components. Its
[README](packages/knowledge/README.md) says which file to edit for each change, how to check it,
and defines the terms. To answer how a component should be used, read its compiled record with
`openCatalog` from `@stevegreco/design-system-knowledge/retrieve`, or
`packages/knowledge/dist/public/markdown/<id>.md` after a build.

Before changing how the knowledge system itself works, read `docs/knowledge/requirements.md` and
`docs/knowledge/content-model.md`. Current decisions are ADRs 0002 through 0006 in `docs/adr/`;
0001 is superseded, and later ADRs note what they replace in earlier ones. Use the stable `KNOW-*`
requirement IDs in plans, issues, and pull requests. Update the documents when an implementation
changes an accepted requirement or decision.

Domain-owned sources remain authoritative. Token decisions live in `packages/tokens/docs/adr/`.
Component specs live in `packages/knowledge/content/components/`, host bindings in
`packages/knowledge/content/bindings/`, and the component runtime in `packages/components`.

Before adding a component or variant, check
`packages/knowledge/content/guidelines/compose-or-propose.md`, then follow
`docs/knowledge/new-component.md`. Decide each state and option
on its checklist, and record the ones the component does not ship in `contract.rationale`.

Do not place design system facts only in an MCP server, documentation page, or tool-specific agent
skill. Those are consumers or delivery adapters for the portable knowledge records.

## Build and test

`pnpm --filter <pkg> <script>` runs that package's script only. It does not honor the
`dependsOn: ["^build"]` edges in `turbo.json`, so a clean clone or worktree fails with missing
`dist/` files that look like code or dependency bugs.

From the repository root:

- `pnpm build` runs `turbo run build` for every package, in dependency order.
- `pnpm test` runs `turbo run test`, which builds each package and its workspace dependencies once
  before testing it. The documentation tests run each example's `examples/<slug>.verify.js` against the built site.
- `pnpm exec turbo run <task> --filter=<pkg>` is the way to build, test, or develop one package
  and its workspace dependencies.

```bash
pnpm exec turbo run build --filter=documentation
pnpm exec turbo run test --filter=@stevegreco/design-system-knowledge
pnpm exec turbo run dev --filter=documentation
```

After packages are already built, `pnpm exec vitest run` still runs the Vitest 5 workspace from the
repo root. Prefer `pnpm test` in a clean tree. Use `pnpm --filter <pkg> exec …` only for commands
that are not package scripts with workspace build dependencies, such as `blume validate`.
