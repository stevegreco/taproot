# videos

[Remotion](https://www.remotion.dev/) videos built with the design tokens and web components.
`src/Root.tsx` loads `tokens.css` and registers every `ds-*` element once, so any composition can
use `var(--semantic-…)` tokens and render `<ds-button>`, `<ds-badge>`, and the rest directly in JSX.

This app is opt in. It is outside the repository's pnpm workspace, so a normal `pnpm install`,
`pnpm build`, `pnpm test`, and CI never install Remotion or touch it. It has its own
`pnpm-workspace.yaml` and lockfile, and links the tokens and components from `packages/`.

To work on videos, build the packages it links, then install and start it:

```bash
pnpm build
pnpm --dir apps/videos install
pnpm --dir apps/videos dev
```

`dev` opens Remotion Studio. Run `pnpm build` again after changing the tokens or components. To
render a composition to `out/`:

```bash
pnpm --dir apps/videos render ComponentShowcase out/component-showcase.mp4
```

`KnowledgeLayer` is a one-minute explainer of the knowledge layer as a general idea, not a tour of
this repository: many sources of truth, an agent that guesses, the knowledge moving to one center,
design tools, component libraries, docs, and agent context all built from it, and an agent that
gets it right. The middle is one continuous scene, `src/scenes/Shift.tsx`, so the same boxes
rearrange. Scene order and lengths are in `src/KnowledgeLayer.tsx`. Render it with:

```bash
pnpm --dir apps/videos render KnowledgeLayer out/knowledge-layer.mp4
```

Add a composition by writing a component in `src/` and registering it with `<Composition>` in
`src/Root.tsx`. Each composition takes a `theme` prop and sets `data-theme` on the root, because
headless Chromium always renders the light color scheme.

Remotion is free for individuals and companies of up to three people. Larger companies need a
[company license](https://www.remotion.dev/license).
