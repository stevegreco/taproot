# React components setup

What every React component needs, once per project. Each component's own file in this folder maps
its API; `taproot setup --impl react` prints this one.

`@taproot-ds/react-components` is a research implementation and is not published to npm. Use it
from this repository's workspace.

## Load the styles

Load the token stylesheet and the component stylesheet once, before rendering. Without the tokens,
the components have no colors, spacing, or type. The optional base stylesheet styles the page
around them: the base font, text color, background, and a type recipe for each heading level
(`guideline.page-setup`). The components style only themselves.

```tsx
import "@taproot-ds/tokens/css";
import "@taproot-ds/tokens/base"; // optional page defaults
import "@taproot-ds/react-components/style.css";
```

The components read semantic tokens directly, so they follow the active theme. With no
`data-theme` on the root element, the theme follows the system preference; `data-theme="light"` or
`"dark"` overrides it.

## Fonts

The font tokens name Lora, Source Sans 3, and JetBrains Mono, with system fallbacks. The packages do
not ship the font files. The tokens package's readme has the links to load them.
