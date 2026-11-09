# Web components setup

What every web component needs, once per project. Each component's own file in this folder maps its
API; `taproot setup --impl web` prints this one.

## Install

```bash
pnpm add @taproot-ds/web-components @taproot-ds/tokens
```

## Load the styles

Load the token stylesheet once, at the application root, before any component renders. Without it,
the components have no colors, spacing, or type. The optional base stylesheet styles the page
around them: the base font, text color, background, and a type recipe for each heading level
(`guideline.page-setup`). The components style only themselves.

```js
import "@taproot-ds/tokens/css";
import "@taproot-ds/tokens/base"; // optional page defaults
```

Without a bundler, link the files from the tokens package instead:

```html
<link rel="stylesheet" href="/node_modules/@taproot-ds/tokens/dist/css/tokens.css" />
<link rel="stylesheet" href="/node_modules/@taproot-ds/tokens/dist/css/base.css" />
```

The components read semantic tokens directly, so they follow the active theme. With no
`data-theme` on the root element, the theme follows the system preference; `data-theme="light"` or
`"dark"` overrides it. The tokens a component reads are not a customization API.

## Fonts

The font tokens name Lora, Source Sans 3, and JetBrains Mono, with system fallbacks. The packages do
not ship the font files. The tokens package's readme has the links to load them.

## Register the elements

Import the package root once to register every element under its `ds-` tag:

```js
import "@taproot-ds/web-components";
```

Or import one component's module and call its define function, as each component's Import section
shows. A define function takes another tag name when `ds-` names collide.

The modules are standard ES modules with no runtime dependencies. Without a bundler, map the bare
package names with an import map, or import the files under `node_modules/@taproot-ds/web-components/src/`.

