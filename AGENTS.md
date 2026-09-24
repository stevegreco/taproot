# Agent guidance

## Design system knowledge

Before changing the agent-facing knowledge system, read:

1. `docs/knowledge/requirements.md`
2. `docs/knowledge/content-model.md`
3. `docs/adr/0005-yaml-component-specs.md`

ADR 0001 is superseded by 0002. ADR 0003 supersedes the spec-record half of ADR 0002. ADR 0005
supersedes the Markdown-authoring and narrative-projection portions of ADR 0003 while preserving
component ownership and host separation. Use the
stable `KNOW-*` requirement IDs in plans, issues, and pull requests. Update the documents when an
implementation changes an accepted requirement or decision.

Domain-owned sources remain authoritative. Token decisions live in `packages/tokens/docs/adr/`.
Portable component contracts live on component records in `packages/knowledge/content/components/`.
YAML `*.spec.yaml` files are the component records; they are not `type: spec`.
Host bindings live in `packages/knowledge/content/bindings/`. Component runtime lives in
`packages/components`.

Before adding a component, follow `docs/knowledge/new-component.md`. Decide each state and option
on its checklist, and record the ones the component does not ship in `contract.rationale`.

Do not place design system facts only in an MCP server, documentation page, or tool-specific agent
skill. Those are consumers or delivery adapters for the portable knowledge records.

## Build and test

`pnpm --filter <pkg> <script>` runs that package's script only. It does not honor the
`dependsOn: ["^build"]` edges in `turbo.json`, so a clean clone or worktree fails with missing
`dist/` files that look like code or dependency bugs.

From the repository root:

- `pnpm build` runs `turbo run build` for every package, in dependency order.
- `pnpm test` runs `turbo run test`, which builds workspace dependencies first.
  Token, knowledge, component, and documentation tests also wait for that package's own `build`.
  The documentation tests run each example's `examples/<slug>.verify.js` against the built site.
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
