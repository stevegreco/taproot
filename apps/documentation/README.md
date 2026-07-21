# Design System Documentation

The documentation site uses [Blume](https://blume.build), with Markdown and
MDX content in `docs/`.

## Commands

- `pnpm dev` starts the local documentation server.
- `pnpm build` creates the static site in `dist/`.
- `pnpm preview` previews the production build.
- `pnpm verify` runs the documentation contract checks (requires `pnpm build` first).
- `pnpm exec blume validate --strict` validates links, headings, and assets.
