# design-sync notes

- [GENERAL] Taproot ships web components (`<ds-*>` custom elements, lit stories in `apps/storybook`), but Claude Design renders React. Decision (2026-11-18, user): sync `@taproot-ds/web-components` through thin React wrappers that render each `<ds-*>` element; the real web-components bundle registers the elements. The React package (`packages/react`) is not synced: only 8 components, private.
- [GENERAL] The wrapper package is `.design-sync/react-wrappers/`: `generate.mjs` (committed) reads `packages/components/dist/custom-elements.json` and writes `dist/index.js`, `dist/index.d.ts` and `dist/taproot.css` (Google Fonts @import + tokens.css + base.css). Re-run it after every web-components build (`cfg.buildCmd` does both). New elements, attributes and events show up with no edits.
- [GENERAL] Generated story previews fail: the stories return lit templates, and React can't render them ("Objects are not valid as a React child ... _$litType$"). Fix: every component gets an owned `.design-sync/previews/<Name>.tsx` written in JSX with the wrappers, one export per story, using the same names. These also become the usage examples in `<Name>.prompt.md`.
- [GENERAL] Converter `--node-modules .ds-sync/node_modules` (react@19.3.1 + react-dom + @types/react installed there to match `packages/react`). `.design-sync/react-wrappers/node_modules` is a gitignored symlink to it, so the .d.ts step finds @types/react; recreate it on a fresh clone: `ln -sfn ../../.ds-sync/node_modules .design-sync/react-wrappers/node_modules`.
- [GENERAL] Playwright pinned to 1.62.1 in `.ds-sync` to match the cached chromium-1234 (the repo's own playwright-core version).
- Story titles `Progressbar`, `Radiogroup`, `Textarea`, `Textfield` need `cfg.titleMap`; the token pages (`Primitives`, `Semantic`) are mapped to null.
- Compare framing: the preview capture shows a white band above the warm page background, where Storybook fills its canvas. This is framing, not a mismatch.
- Dialog: the Storybook reference capture crops to the body height, so open-modal stories show only the dimmed backdrop. Judge the preview's modal on its own. Card is `cardMode: single`, `primaryStory: Open`.
- Page text outside components: Storybook doesn't load `@taproot-ds/tokens/base`, so loose text there is Times. Previews load it via `styles.css`, so it's Source Sans. Expected.
- Known render warns: `[RENDER_THIN]` on Checkbox, ProgressBar, Slider, Switch, TextArea, TextField and Tooltip. Their text and painting live in shadow DOM, which the check doesn't measure. The screenshots render correctly.

## Re-sync risks

- Owned previews mirror the lit stories by hand. When a story file changes (`[STORY_CHANGED]`), update the matching `.design-sync/previews/<Name>.tsx`. New stories need a new export.
- New web components appear in the wrappers automatically (from the manifest), but they ship with no preview until someone writes their `.tsx`. Story titles with spaces (e.g. "Progress bar") need a `titleMap` entry.
- The wrapper's runtime contract: attributes always render, writable fields are also assigned as properties after render, and events attach through `addEventListener`. If an element changes how it reads attributes vs properties (e.g. Dialog's `dismissible="false"`), check the wrapper still drives it.
- Fonts load at runtime from Google Fonts (`[FONT_REMOTE]`). Nothing ships in `fonts/`, so designs depend on network access to fonts.googleapis.com.
- `.prompt.md` files are generated from the wrapper `.d.ts` plus the previews. The web-specific `packages/components/implementation/*.md` files are not used (they describe HTML attributes, not React props).
- The Storybook capture cap is 6 stories. Button's 7th (`AllVariants`) was never compared one-to-one.
- Toolchain: react/react-dom 19.3.1 and playwright 1.62.1 in `.ds-sync`, plus the chromium-1234 cache.
- After the first upload (2026-11-18), the repo formatter rewrote `previews/Button.tsx` and `react-wrappers/generate.mjs`. The first re-sync will recapture and regrade the components those touch, even though nothing renders differently.
