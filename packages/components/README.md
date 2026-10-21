# @stevegreco/design-system-components

Framework-agnostic web components styled entirely with the design tokens from
[`@stevegreco/design-system`](../tokens). No runtime dependencies and no bundler
required — just standard ES modules and custom elements.

## Install

```bash
pnpm add @stevegreco/design-system-components @stevegreco/design-system
```

## Use

Load the token stylesheet once, then import the components.

```html
<link rel="stylesheet" href="/node_modules/@stevegreco/design-system/dist/css/tokens.css" />
<script type="module">
  import "@stevegreco/design-system-components";
</script>

<ds-button variant="primary">Save changes</ds-button>
```

The stylesheet is required: every colour, space and radius the button paints with
is a CSS custom property published by the tokens package. Because custom
properties are inherited, they cross the shadow boundary on their own. With no
`data-theme`, components follow the system color preference. Setting
`<html data-theme="light">` or `<html data-theme="dark">` overrides it.

To register selectively, or under a different tag name:

```js
import { defineButton } from "@stevegreco/design-system-components/button";

defineButton(); // <ds-button>
defineButton("acme-button"); // <acme-button>
```

Every `src/<name>.js` is published as the subpath `…/<name>`, with types from
`src/<name>.d.ts`. Those types and the package-root barrel, `src/index.js` and
`src/index.d.ts`, are written by hand. For JSX, map `ElementAttributes` (exported from the
package root) onto your framework's intrinsic elements. Helpers that are not public API belong in `src/internal/`,
which the `exports` map blocks. `…/index` is blocked too; import the package
root for the barrel.

## Components

Each component implements the technology-neutral contract in
`packages/spec/content/components/<name>/<name>.spec.yaml`. The docs site
renders it at `/components/<name>`, with the live example from
`apps/documentation/examples/<name>.tsx`.

Every attribute has a matching property (`el.variant`,
`el.disabled`, …). Programmatic `focus()` and `blur()` forward to the inner
control. The host honors the native `hidden` attribute.

## Forms

`<form>` association does not cross shadow boundaries, so a naive web-component
control silently fails to submit. Form controls here are
[form-associated custom elements](https://developer.mozilla.org/en-US/docs/Web/API/ElementInternals):
they use `ElementInternals` to find their form, contribute a value, report
validity, and follow an ancestor disabled `<fieldset>`. 

```html
<form>
  <ds-text-field label="Email" name="email" type="email" required></ds-text-field>
  <ds-checkbox label="Send me the weekly digest" name="digest" checked></ds-checkbox>
  <ds-button type="submit">Subscribe</ds-button>
  <ds-button type="reset" variant="secondary">Clear</ds-button>
</form>
```

## Styling escape hatch

Each component exposes its inner surface as a CSS part named in its source:

```css
ds-button::part(button) {
  letter-spacing: 0.02em;
}
```

## Tokens consumed

Every component consumes `--semantic-*` tokens directly, plus primitives for
scale choices such as spacing and motion that have no semantic role. The tokens a
component reads are internal, not a customization API (tokens ADR 0003).

## Styles are authored as real CSS

Component styles live in `src/*.css` as ordinary stylesheets, so they can be
linted, formatted and reviewed with standard CSS tooling. `build-styles.js`
inlines each one into `dist/<name>.styles.js`, which the component imports and
adopts via `adoptedStyleSheets`:

```
src/button.css   →   dist/button.styles.js   →   adopted into the shadow root
```

The obvious alternative — `import sheet from "./button.css" with { type: "css" }`
— is the standards-track answer but is not shippable yet: Safari has no support,
Firefox 145 keeps it behind the `layout.css.module-scripts.enabled` pref, and
Vite needs a plugin. Inlining at build time keeps authoring in real CSS while the
published package stays plain ES modules that every bundler already understands.

Run `pnpm run build` after changing a `.css` file, or `pnpm run watch` to rebuild
on save.

## Tests

Tests run in real Chromium through Vitest Browser Mode. From the repository root:

```bash
pnpm exec turbo run test --filter=@stevegreco/design-system-components
```

Browser tests load the published token stylesheet (`test/setup/tokens.js`), so
every `var(--…)` resolves as it does on a page. `test/host-checks.test.js` runs
the shared host behavior (alias registration, `hidden`, parts, focus, events,
disabled handling, keyboard activation, `form`, enum properties, upgrade order)
against a table of components; add a row when adding a component. Each
component also has its own `test/<name>.test.js` for behavior.

## Local development

```bash
pnpm exec turbo run build --filter=@stevegreco/design-system-components
pnpm exec turbo run test --filter=@stevegreco/design-system-components
pnpm exec turbo run dev --filter=documentation --filter=@stevegreco/design-system-components
```

Turbo builds the token package before the component styles. `pnpm --filter`
runs this package's script only and will fail on a clean tree when `dist/` is missing.

This package has no standalone demo. Each component's demo is its docs example,
`apps/documentation/examples/<name>.tsx`, shown at `/components/<name>`. The
`dev` task above runs the docs site and rebuilds `dist/*.styles.js` whenever a
`src/*.css` file changes.
