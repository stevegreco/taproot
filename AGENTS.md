# Agent guidance

## Design system knowledge

`packages/knowledge` is the source of truth for what each component is and how to use it. It is a
technology-neutral contract: design and engineering agree on it before anyone builds. The format
is defined in [`packages/knowledge/SPEC.md`](packages/knowledge/SPEC.md) and the reasoning is in
ADRs 0001 through 0003 in `docs/adr/` and
[RFC 0002](docs/rfcs/0002-knowledge-layer-architecture.md).

**Query it** rather than reading files. From the repository root:

```bash
pnpm knowledge search "destructive action"
pnpm knowledge get component.button
pnpm knowledge get component.button --impl web
pnpm knowledge get pattern.action-hierarchy#assign-emphasis
pnpm knowledge links component.button
pnpm knowledge rules --level must --topic accessibility
pnpm knowledge tokens component.button --condition "variant.primary + hover" --resolve
```

Before writing markup, use `--impl web` for the package, element name, and the attribute that
implements each parameter. Attribute names do not always follow parameter names (Button's `action`
is the `type` attribute). Add `--json` for JSON. `pnpm knowledge list` lists every record. The same operations are available
as tools, and each record as a `knowledge://<id>` resource, from the `design-system-knowledge` MCP
server registered in `.mcp.json`.

**Edit it** in `packages/knowledge/content/`. Components are `components/<name>/<name>.spec.yaml`.
Patterns, guidelines, and examples are Markdown with front matter. There is no build step. Validate
with `pnpm knowledge validate` or `pnpm --filter @stevegreco/design-system-knowledge test`.

**What not to put in a spec.** No element, attribute, slot, framework, or CSS names, and no code.
A spec says what a component is, not how any technology builds it. Token references are opaque
strings that name a token. Nothing checks an implementation against a spec, so keep the two
consistent in review.

**Implementation content** lives with the implementation:

- The web components are hand-written in `packages/components`, with tests in
  `packages/components/test`.
- The docs site builds a component page from the knowledge record plus
  `apps/documentation/implementation/<name>.md` (package, tag name, usage, API table mapping web
  attributes, properties, and events to spec parameters and events, and web-specific guidance).
  `knowledge.config.json` points the CLI at the same folder, so `get --impl web` serves it.
  Examples are in `apps/documentation/examples/`.
- Storybook in `apps/storybook` has a story file per component in `stories/`. It is a workbench
  for exploring states and themes, not a source of usage guidance. Run it with
  `pnpm exec turbo run dev --filter=storybook` (port 6006).

Before adding a component or variant, read `pnpm knowledge get guideline.compose-or-propose`, then
use the `create-component` skill in `.agents/skills/create-component/`. Record each option the
component does not ship in the spec's `rationale`.

Token decisions live in `packages/tokens/docs/adr/`. Do not place design system facts only in a
documentation page or an agent skill. Those consume the knowledge records.

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
