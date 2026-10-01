# videos

[Remotion](https://www.remotion.dev/) videos built with the design tokens and web components.
`src/Root.tsx` loads `tokens.css` and registers every `ds-*` element once, so any composition can
use `var(--semantic-…)` tokens and render `<ds-button>`, `<ds-badge>`, and the rest directly in JSX.

From the repository root:

```bash
pnpm exec turbo run dev --filter=videos
```

Opens Remotion Studio after building the tokens and components. To render a composition to
`out/`, build the workspace dependencies first, then:

```bash
pnpm --filter videos render ComponentShowcase out/component-showcase.mp4
```

`KnowledgeLayer` is a 56-second explainer of the knowledge layer and what makes it agent ready:
the problem, writing context down once, distributing it through the CLI, MCP server, and docs site,
and an agent building correct markup from it. Its scenes are in `src/scenes/`, their order and
lengths in `src/KnowledgeLayer.tsx`. Render it with:

```bash
pnpm --filter videos render KnowledgeLayer out/knowledge-layer.mp4
```

Add a composition by writing a component in `src/` and registering it with `<Composition>` in
`src/Root.tsx`. Each composition takes a `theme` prop and sets `data-theme` on the root, because
headless Chromium always renders the light color scheme.

Remotion is free for individuals and companies of up to three people. Larger companies need a
[company license](https://www.remotion.dev/license).
