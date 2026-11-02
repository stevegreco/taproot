# Agent guidance

## Design system spec

`packages/spec` is the design system spec: the source of truth for what each component is and how
to use it. It is a technology-neutral contract: design and engineering agree on it before anyone builds. The format
is defined in [`packages/spec/SPEC.md`](packages/spec/SPEC.md), the only field reference. The
decisions are in ADRs 0001 through 0004 in `docs/adr/`.
[RFC 0002](docs/rfcs/0002-knowledge-layer-architecture.md) is historical background.

**Query it** rather than reading files. The text between the markers below is what
`node packages/spec/bin/ds-spec.js help agents` prints and the MCP server sends. Edit it in
`packages/spec/src/agents.js`; a test fails if this copy differs.

<!-- agent-instructions:start -->
The design system spec holds records: components, patterns, guidelines, and examples. A component
is a technology-neutral contract (anatomy, parameters, states, rules, tokens), not framework code.
Implement it in whatever technology the project uses.

- Use the `ds-spec` CLI when you have a terminal, and the `design-system-spec` MCP server when you
  do not. Run the CLI from an installed copy, never an `npx` download per call: in this repository,
  `node packages/spec/bin/ds-spec.js`; in a project that depends on the package,
  `node_modules/.bin/ds-spec`.
- Start with `search` to choose a component, then `get` it and follow its links: `alternative` for
  when it is the wrong choice, `follows` for the patterns and guidelines it applies, `examples` for
  worked usage.
- Use `rules` to review work, and cite each rule by its address (for example
  `component.button#label-describes-result`) with its level (MUST, SHOULD, MAY).
- Use `tokens` for the design tokens a component part uses in a variant or state. Add `--resolve`
  (MCP: `resolve`) for values.
- Before writing code, `get` the component with `--impl web` (MCP: `implementation: "web"`) for
  the package, element name, and the attribute that implements each parameter. Never derive
  attribute names from parameter names.
- For several lookups on the MCP server, make the tool calls in parallel.
<!-- agent-instructions:end -->

From the repository root, call the CLI with `node` directly. `pnpm spec` works too, but pnpm adds
about a second to every call.

```bash
node packages/spec/bin/ds-spec.js search "destructive action"
node packages/spec/bin/ds-spec.js get component.button
node packages/spec/bin/ds-spec.js get component.button --impl web
node packages/spec/bin/ds-spec.js get pattern.action-hierarchy#assign-emphasis
node packages/spec/bin/ds-spec.js links component.button
node packages/spec/bin/ds-spec.js rules --level must --topic accessibility
node packages/spec/bin/ds-spec.js tokens component.button --condition "variant.primary + hover" --resolve
```

Ids or plain names work (`get button`), a one-word search tolerates typos, the start of a name
matches, and each search result names the command that reads it. Attribute names do not always
follow parameter names (Button's `action` is the `type` attribute). Add `--json` for JSON. `list`
lists every record. The MCP server, `design-system-spec`, is registered in `.mcp.json` and serves
each record as a `spec://<id>` resource.

**Edit it** in `packages/spec/content/`. Components are `components/<name>/<name>.spec.yaml`.
Patterns, guidelines, and examples are Markdown with front matter. There is no build step. Validate
with `node packages/spec/bin/ds-spec.js validate` or `pnpm --filter @stevegreco/design-system-spec test`.

**What not to put in a spec.** No element, attribute, slot, framework, or CSS names, and no code.
A spec says what a component is, not how any technology builds it. Token references are opaque
strings that name a token. The tooling checks that an implementation's API mapping covers every
parameter, value, and event in the spec. Nothing checks behavior or styling against the spec, so
keep those consistent in review.

**Implementation content** lives with the implementation:

- The web components are hand-written in `packages/components`, with tests in
  `packages/components/test`.
- The docs site builds a component page from the spec record plus
  `packages/components/implementation/<name>.md` (package, tag name, usage, API table mapping web
  attributes, properties, and events to spec parameters and events, and web-specific guidance).
  `spec.config.json` points the CLI at the same folder, so `get --impl web` serves it.
  Examples are in `apps/documentation/examples/`.
- Storybook in `apps/storybook` has a story file per component in `stories/`. It is a workbench
  for exploring states and themes, not a source of usage guidance. Run it with
  `pnpm exec turbo run dev --filter=storybook` (port 6006).

Before adding a component or variant, read `node packages/spec/bin/ds-spec.js get guideline.compose-or-propose`. A new
component is built in three phases, each its own skill in `.agents/skills/` and its own commit on
one branch. The phases share one pull request that merges after the docs commit, and review
pauses after each commit:

1. `spec-component`: a minimal spec with `status: draft`, reviewed before anything is built.
2. `implement-component`: completes the spec (record each option the component does not ship in
   its `rationale`), builds the web component and its tests, maps the web API, adds stories, and
   removes `status: draft`.
3. `document-component`: the docs example and its Verify steps.

`pnpm component:new <name> --phase spec|implementation|docs` scaffolds each phase, and
`pnpm component:status <name> [--phase spec|implementation|docs]` checks it.

Token decisions live in `packages/tokens/docs/adr/`. Do not place design system facts only in a
documentation page or an agent skill. Those consume the spec.

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
pnpm exec turbo run test --filter=@stevegreco/design-system-spec
pnpm exec turbo run dev --filter=documentation
```

After packages are already built, `pnpm exec vitest run` still runs the Vitest 5 workspace from the
repo root. Prefer `pnpm test` in a clean tree. Use `pnpm --filter <pkg> exec …` only for commands
that are not package scripts with workspace build dependencies, such as `blume validate`.
