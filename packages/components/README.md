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
properties are inherited, they cross the shadow boundary on their own — switching
`<html data-theme="dark">` re-themes the button with no JavaScript.

To register selectively, or under a different tag name:

```js
import { defineButton } from "@stevegreco/design-system-components/button";

defineButton();              // <ds-button>
defineButton("acme-button"); // <acme-button>
```

## `<ds-button>`

### Attributes

| Attribute    | Values                                        | Default     | Notes |
| ------------ | --------------------------------------------- | ----------- | ----- |
| `variant`    | `primary`, `secondary`, `ghost`, `danger`      | `primary`   | |
| `size`       | `md`, `sm`                                     | `md`        | |
| `pill`       | boolean                                        | off         | Fully rounded ends |
| `full-width` | boolean                                        | off         | Fills its container |
| `disabled`   | boolean                                        | off         | Blocks activation and focus |
| `type`       | `button`, `submit`, `reset`                    | `button`    | Works inside a `<form>` |
| `aria-label` | string                                         | —           | Mirrored onto the inner control; use for icon-only buttons |

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

`--component-button-*` for everything variant- and metric-specific, plus
`--semantic-color-focus-ring` and `--semantic-color-disabled-*` for focus and
disabled states. Change a token, and every button updates.

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

## Local development

```bash
pnpm --filter @stevegreco/design-system build              # produces dist/css/tokens.css
pnpm --filter @stevegreco/design-system-components build   # inlines src/*.css
pnpm --filter @stevegreco/design-system-components dev     # watch + serve the demo
```

The demo lives at `examples/button.html` and covers every variant, size, state,
form participation and a dark-mode toggle.
