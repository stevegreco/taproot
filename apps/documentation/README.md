# Design System Documentation

The documentation site uses [Blume](https://blume.build), with Markdown and
MDX content in `docs/`.

## Commands

From this package directory, `pnpm dev`, `pnpm build`, and `pnpm test` run only
this app. They do not build `@stevegreco/design-system`, the knowledge bundle, or
the web components. From the repository root, use Turbo so those workspace
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
