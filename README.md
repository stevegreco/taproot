# Ember & Sage design system

An agent-first design system. The spec says what each component is and how to use it, and agents
read it through a CLI or an MCP server.

| Path                                              | What it is                                             |
| ------------------------------------------------- | ------------------------------------------------------ |
| [`packages/spec`](packages/spec/README.md)        | The spec: records, format, CLI, and MCP server         |
| [`packages/tokens`](packages/tokens/README.md)    | Design tokens as CSS custom properties and JSON        |
| [`packages/components`](packages/components/README.md) | Web components                                    |
| [`packages/react`](packages/react/README.md)      | React components, a second implementation (unpublished) |
| [`apps/documentation`](apps/documentation/README.md) | The documentation site                              |
| `apps/storybook`                                  | A workbench for exploring component states and themes  |
| [`apps/mcp`](apps/mcp/README.md)                  | The hosted MCP server                                  |
| [`apps/cli-explorer`](apps/cli-explorer/README.md) | A local page for trying `ds-spec` commands            |
| [`apps/videos`](apps/videos/README.md)            | Remotion videos, outside the workspace                 |

Query the spec from the repository root:

```bash
node packages/spec/bin/ds-spec.js search "destructive action"
node packages/spec/bin/ds-spec.js get component.button
```

Build and test:

```bash
pnpm install
pnpm build
pnpm test
```

[`AGENTS.md`](AGENTS.md) has the working guide: how to query and edit the spec, add a component, and
release packages. Decisions are in [`docs/adr/`](docs/adr), and token decisions are in
[`packages/tokens/docs/adr/`](packages/tokens/docs/adr).
