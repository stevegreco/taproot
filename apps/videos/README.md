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

`KnowledgeLayer` is a roughly 42-second explainer of the design system spec as a general idea. Five
chapters move from scattered sources to rules with addresses and levels, then show an agent that
asks first and cites the rule behind each choice.
The layout uses a shared grid, restrained transitions, and a live before/after button example.

Scene timing is derived from the continuous voiceover in `src/timeline.ts`. The voiceover uses
Eleven v4 with Archer and descriptive delivery tags. `src/narration.ts` holds the spoken script;
`narration.md` explains the delivery and regeneration workflow. Generate the audio with
`ELEVENLABS_KEY` in the package's `.env`, then render:

```bash
pnpm --dir apps/videos narrate
```

```bash
pnpm --dir apps/videos render KnowledgeLayer out/knowledge-layer.mp4
```

Add a composition by writing a component in `src/` and registering it with `<Composition>` in
`src/Root.tsx`. Each composition takes a `theme` prop and sets `data-theme` on the root, because
headless Chromium always renders the light color scheme.

Remotion is free for individuals and companies of up to three people. Larger companies need a
[company license](https://www.remotion.dev/license).
