# Design System Documentation

The documentation site uses [Blume](https://blume.build), with Markdown and
MDX content in `docs/`. It is for orientation: what the system is and how to start. The one
component page, `/components`, is a catalog generated from the spec by
`lib/component-catalog.ts`, and links each component to Storybook (ADR 0007). Agents get the rules
and API from the spec's CLI and MCP server.

## Commands

From this package directory, `pnpm dev`, `pnpm build`, and `pnpm test` run only
this app. They do not build `@stevegreco/design-system` or the web components. From the repository root, use Turbo so those workspace
dependencies are built first:

```bash
pnpm exec turbo run dev --filter=documentation
pnpm exec turbo run build --filter=documentation
pnpm exec turbo run test --filter=documentation
```

- `pnpm dev` starts the local documentation server.
- `pnpm build` creates the static site in `dist/`.
- `pnpm preview` previews the production build.
- `pnpm exec blume validate --strict` validates links, headings, and assets.
