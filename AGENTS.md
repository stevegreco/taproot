# Agent guidance

## Design system spec

`packages/spec` is the design system spec: the source of truth for what each component is and how
to use it. It is a technology-neutral contract: design and engineering agree on it before anyone builds. The format
is defined in [`packages/spec/SPEC.md`](packages/spec/SPEC.md), the only field reference. The
decisions are in the ADRs in `docs/adr/`.

**Query it** rather than reading files. The text between the markers below is what
`node packages/spec/bin/taproot.js help agents` prints and the MCP server sends. Edit it in
`packages/spec/src/agents.js`; a test fails if this copy differs.

<!-- agent-instructions:start -->
The design system spec holds records: components, patterns, guidelines, and examples. A component
is a technology-neutral contract (anatomy, parameters, states, rules, tokens), not framework code.
Implement it in whatever technology the project uses.

- Use the `taproot` CLI when you have a terminal, and the `taproot` MCP server when you
  do not. Run the CLI from an installed copy, never an `npx` download per call: in this repository,
  `node packages/spec/bin/taproot.js`; in a project that depends on the package,
  `node_modules/.bin/taproot`.
- Start with `search` to choose a component, then `get` it and follow its links: `alternative` for
  when it is the wrong choice, `follows` for the patterns and guidelines it applies, `examples` for
  worked usage.
- Use `rules` to review work, and cite each rule by its address (for example
  `component.button#label-describes-result`) with its level (MUST, SHOULD, MAY). A component's
  rules include those of the patterns and guidelines it follows, at their own addresses (for
  example `pattern.form-field#error-blocks-submit`).
- Use `tokens` for the design tokens a component part uses in a variant or state. Add `--resolve`
  (MCP: `resolve`) for values. Use `format` for what records do not repeat: the system-wide
  constants, such as border width and focus-ring width and offset, with their tokens.
- Before writing code, `get` the component with the implementation for your technology:
  `--impl web` for web components, `--impl react` for React (MCP: `implementation`). It gives the
  package, what to import, and the attribute or prop that implements each parameter. Never derive
  those names from parameter names.
- For several lookups, run them in one `batch` with the CLI (for example
  `taproot batch --command "get button --impl web" --command "tokens button"`), or make the
  tool calls in parallel on the MCP server.
<!-- agent-instructions:end -->

From the repository root, call the CLI with `node` directly. `pnpm spec` works too, but pnpm adds
about a second to every call.

```bash
node packages/spec/bin/taproot.js search "destructive action"
node packages/spec/bin/taproot.js get component.button
node packages/spec/bin/taproot.js get component.button --impl web
node packages/spec/bin/taproot.js get component.tabs --impl react
node packages/spec/bin/taproot.js get pattern.action-hierarchy#assign-emphasis
node packages/spec/bin/taproot.js links component.button
node packages/spec/bin/taproot.js rules --level must --topic accessibility
node packages/spec/bin/taproot.js tokens component.button --condition "variant.primary + hover" --resolve
node packages/spec/bin/taproot.js format --resolve
node packages/spec/bin/taproot.js batch --command "get button --impl web" --command "tokens button"
```

Ids or plain names work (`get button`), a one-word search tolerates typos, the start of a name
matches, and each search result names the command that reads it. Attribute names do not always
follow parameter names (Button's `action` is the `type` attribute). Add `--json` for JSON. `list`
lists every record. The MCP server, `taproot`, is registered in `.mcp.json` and serves
each record as a `spec://<id>` resource.

**Edit it** in `packages/spec/content/`. Components are `components/<name>/<name>.spec.yaml`.
Patterns, guidelines, and examples are Markdown with front matter. There is no build step. Validate
with `node packages/spec/bin/taproot.js validate` or `pnpm --filter @taproot-ds/spec test`.

**What not to put in a spec.** No element, attribute, slot, framework, or CSS names, and no code.
A spec says what a component is, not how any technology builds it. Token references are opaque
strings that name a token. The tooling checks that an implementation's API mapping covers every
parameter, value, and event in the spec. In this repository, `packages/spec/test/web-source.test.js`
also checks the web source by name: each stylesheet uses the tokens in its record's map, and the
source has every attribute, value, property, and event its API table lists. Nothing checks behavior
or how a component looks against the spec, so keep those consistent in review.

**Implementation content** lives with the implementation:

- The web components are hand-written in `packages/components`, with tests in
  `packages/components/test`.
- Each web component has `packages/components/implementation/<name>.md` (package, tag name, usage,
  API table mapping web attributes, properties, and events to spec parameters and events, and
  web-specific guidance). `spec.config.json` points the CLI at that folder, so `get --impl web`
  serves it.
- The React components in `packages/react` are a second implementation, built on React Aria
  Components, with tests in `packages/react/test`. Their mapping files are in
  `packages/react/implementation/<name>.md` (export name, usage, and API rows mapping props and
  callbacks to spec parameters and events), served by `get --impl react`. The docs catalog and
  Storybook show only the web components. The research log is `docs/research/react-implementation.md`.
- The hosted MCP server in `apps/mcp` serves the spec from a snapshot built at deploy time, with one
  small entry file per host. The tools are in `packages/spec/src/server.js`. See ADR 0006.
- Storybook in `apps/storybook` has a story file per component in `stories/`. It is a workbench
  for exploring states and themes, not a source of usage guidance. Run it with
  `pnpm exec turbo run dev --filter=storybook` (port 6006).
- The docs site in `apps/documentation` is for orientation, with no page per component. Its one
  component page is a catalog generated from the spec, linking to Storybook (ADR 0007).

Before adding a component or variant, read `node packages/spec/bin/taproot.js get guideline.compose-or-propose`. A new
component is built in two phases, each its own skill in `.agents/skills/` and its own commit on
one branch. The phases share one pull request that merges after the implementation commit, and
review pauses after each commit:

1. `spec-component`: a minimal spec with `status: draft`, reviewed before anything is built.
2. `implement-component`: completes the spec (record each option the component does not ship in
   its `rationale`), builds the web component and its tests, maps the web API, adds stories, and
   removes `status: draft`.

`pnpm component:new <name> --phase spec|implementation` scaffolds each phase, and
`pnpm component:status <name> [--phase spec|implementation]` checks it.

Token decisions live in `packages/tokens/docs/adr/`. Do not place design system facts only in a
documentation page or an agent skill. Those consume the spec.

## Build and test

`pnpm --filter <pkg> <script>` runs that package's script only. It does not honor the
`dependsOn: ["^build"]` edges in `turbo.json`, so a clean clone or worktree fails with missing
`dist/` files that look like code or dependency bugs.

From the repository root:

- `pnpm build` runs `turbo run build` for every package, in dependency order.
- `pnpm test` runs `turbo run test`, which builds each package and its workspace dependencies once
  before testing it.
- `pnpm exec turbo run <task> --filter=<pkg>` is the way to build, test, or develop one package
  and its workspace dependencies.

```bash
pnpm exec turbo run build --filter=documentation
pnpm exec turbo run test --filter=@taproot-ds/spec
pnpm exec turbo run dev --filter=documentation
```

After packages are already built, `pnpm exec vitest run` still runs the Vitest 5 workspace from the
repo root. Prefer `pnpm test` in a clean tree. Use `pnpm --filter <pkg> exec …` only for commands
that are not package scripts with workspace build dependencies, such as `blume validate`.

## Releases

`@taproot-ds/tokens`, `@taproot-ds/web-components`, and `@taproot-ds/spec` are
published to npm with Changesets. A change to one of them adds a changeset with `pnpm changeset`, in
the same pull request. Merging to `main` opens or updates a Version Packages pull request, and
merging that one publishes. `@taproot-ds/react-components` is private and is not published.
