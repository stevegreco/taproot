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
`src/<name>.d.ts`. Helpers that are not public API belong in `src/internal/`,
which the `exports` map blocks. `…/index` is blocked too; import the package
root for the barrel.

## `<ds-badge>`

Badges are non-interactive labels for metadata and status. Their content comes
from the default slot:

```html
<ds-badge>Default</ds-badge>
<ds-badge variant="success">Active</ds-badge>
<ds-badge variant="warning">Pending</ds-badge>
```

The `variant` attribute accepts `default`, `accent`, `success`, `danger`,
`warning`, or `info`, and defaults to `default`. The rendered surface is exposed
as `::part(badge)`. Its visual values come directly from published semantic
background, foreground, and border tokens.

Badge deliberately provides no button behavior or live-region role. Use a
button for actions, and add an appropriate ARIA role only when a changing badge
needs to be announced.

## `<ds-link>`

Links navigate. Use Button for actions. The inner native anchor handles
navigation, so middle-click, modifier keys, and the context menu keep working:

```html
<p>Read the <ds-link href="/adr/0003">token tier ADR</ds-link> first.</p>
<ds-link variant="standalone" href="/projects">View all projects</ds-link>
```

`variant` accepts `inline` (the default) or `standalone`. An inline link
inherits the surrounding type and is always underlined; a standalone link uses
label type and is underlined on hover. Without `href` the anchor has no link
role and cannot take focus. There is no disabled state. The anchor is exposed
as `::part(link)`. Visual values come directly from semantic brand foreground,
default foreground on hover, and the focus border.

## `<ds-text-field>`

Text fields collect one line of text. The label, hint, and error are attributes
so the control can associate them inside its shadow root:

```html
<form>
  <ds-text-field
    label="Email"
    name="email"
    type="email"
    hint="Used for sign-in."
    required
  ></ds-text-field>
  <ds-button type="submit">Continue</ds-button>
</form>
```

`type` accepts `text`, `email`, `password`, `search`, `url`, or `tel`, and
defaults to `text`. A non-empty `error` sets `aria-invalid`, includes the
message in `aria-describedby`, and blocks submit until it is cleared. The inner
input is exposed as `::part(control)`. Visual values come directly from
published semantic tokens for surface, text, focus, invalid, and disabled, plus
primitive spacing where no semantic role exists.

## `<ds-button>`

### Attributes

| Attribute    | Values                                    | Default   | Notes                                                                   |
| ------------ | ----------------------------------------- | --------- | ----------------------------------------------------------------------- |
| `variant`    | `primary`, `secondary`, `ghost`, `danger` | `primary` |                                                                         |
| `size`       | `md`, `sm`                                | `md`      |                                                                         |
| `full-width` | boolean                                   | off       | Fills its container                                                     |
| `disabled`   | boolean                                   | off       | Blocks activation and focus; also follows an ancestor disabled fieldset |
| `type`       | `button`, `submit`, `reset`               | `button`  | Works inside a `<form>`                                                 |
| `aria-label` | string                                    | —         | Mirrored onto the inner control; use for icon-only buttons              |

Each attribute has a matching property (`el.variant`, `el.disabled`, …). The
read-only `el.form` property resolves the containing `<form>`.

### Forms

`<form>` association does not cross shadow boundaries, so a naive web-component
button silently fails to submit. `<ds-button>` is a
[form-associated custom element](https://developer.mozilla.org/en-US/docs/Web/API/ElementInternals)
— it uses `ElementInternals` to find its form and calls `requestSubmit()` or
`reset()` itself.

```html
<form>
  <input name="email" type="email" required />
  <ds-button type="submit">Subscribe</ds-button>
  <ds-button type="reset" variant="secondary">Clear</ds-button>
</form>
```

### Content

The default slot uses `display: contents`, so slotted icons and text become flex
items of the button and pick up the token-driven gap automatically:

```html
<ds-button>
  <svg aria-hidden="true"><!-- … --></svg>
  Continue
</ds-button>
```

### Styling escape hatch

The inner control is exposed as a CSS part:

```css
ds-button::part(button) {
  letter-spacing: 0.02em;
}
```

## Tokens consumed

A component whose knowledge record declares `tokenRef` consumes its published
`--component-<name>-*` contract; Button is the example. Every component token
aliases a current semantic or primitive token, so themes still flow through the
semantic layer while consumers gain a stable customization boundary. Every other
component consumes `--semantic-*` tokens directly. `test/mapping-css.test.js`
enforces both rules for every component record.

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

The component contract runs in real Chromium through Vitest Browser Mode.
From the repository root:

```bash
pnpm exec turbo run test --filter=@stevegreco/design-system-components
```

Each component has its own `test/<name>.test.js` for behavior. `test/mapping-css.test.js`
runs for every component record in the knowledge catalog and checks that its
stylesheet assigns every compiled mapping.

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
