# @stevegreco/design-system

Design tokens for the Ember & Sage design system — distributed as CSS custom properties and JSON. Built with [Style Dictionary](https://styledictionary.com).

## Install

```bash
pnpm add @stevegreco/design-system
```

## Quick start

Link the single CSS file once at the root of your app. All token tiers are included.

```html
<link rel="stylesheet" href="node_modules/@stevegreco/design-system/dist/css/tokens.css" />
```

Or import via a bundler:

```js
import "@stevegreco/design-system/css";
```

Then use tokens in your CSS:

```css
.card {
  background: var(--semantic-color-background-raised);
  border: 1px solid var(--semantic-color-border-default);
  color: var(--semantic-color-foreground-default);
}

.btn-primary {
  background: var(--component-button-primary-background);
  color: var(--component-button-primary-foreground);
  border-radius: var(--component-button-radius-md);
}
```

## Fonts

The design system uses three typefaces, each mapped to a font token:

| Token | Family | Role |
|---|---|---|
| `--primitives-font-display` | Lora | Headings, card titles, logotype |
| `--primitives-font-sans` | Source Sans 3 | Body text, UI labels, buttons |
| `--primitives-font-mono` | JetBrains Mono | Code, token values, numeric data |

Each token includes a system fallback stack, so the UI remains readable if Google Fonts fails to load. To use the intended typefaces, add the following `<link>` tags to your document `<head>` **before** the tokens stylesheet:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400..700;1,400..700&family=Source+Sans+3:wght@300..900&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
```

The `display=swap` parameter ensures text renders immediately in the fallback font while the custom fonts load, avoiding invisible text during page load.

If you are using a bundler with a `<head>` injection plugin (e.g. Vite's `vite-plugin-html`) or a framework like Next.js, load the fonts using your framework's preferred font mechanism instead of a raw `<link>` tag.

## Token architecture

Tokens are organized in three tiers. Always prefer the highest applicable tier.

```
Primitives  →  Semantic  →  Component
  (scale)       (intent)     (component-specific)
```

| Tier | Prefix | Use when |
|---|---|---|
| **Primitive** | `--primitives-*` | Never in product code — these are raw scale values |
| **Semantic** | `--semantic-*` | Building new UI — surfaces, text, borders, status |
| **Component** | `--component-*` | Implementing a specific named component (button, card, input) |

### Semantic token groups

| Group | Example | Purpose |
|---|---|---|
| `background` | `--semantic-color-background-default` | Page and surface fills |
| `foreground` | `--semantic-color-foreground-muted` | Text and icon colors |
| `border` | `--semantic-color-border-default` | Dividers and outlines |
| `accent` | `--semantic-color-accent-default` | Primary brand interactions |
| `secondary` | `--semantic-color-secondary-default` | Supporting interactions |
| `status.*` | `--semantic-color-status-success-background` | Feedback states |

## Theming (dark mode)

Set `data-theme="dark"` on the `<html>` element to activate the dark theme. All semantic and component tokens resolve to their dark values automatically — no class changes needed anywhere else.

```html
<html data-theme="dark">
```

```js
document.documentElement.setAttribute("data-theme", "dark");
document.documentElement.removeAttribute("data-theme"); // back to light
```

The sidebar and other always-dark surfaces should define their own local aliases referencing primitive tokens, since they are not affected by the semantic theme switch.

## JSON tokens

Resolved token values are also available as JSON for use in design tooling, style pipelines, or non-CSS targets.

```js
import primitives  from "@stevegreco/design-system/tokens/primitives";
import semantic    from "@stevegreco/design-system/tokens/semantic-light";
import components  from "@stevegreco/design-system/tokens/components";
```

## Build outputs

| File | Contents |
|---|---|
| `dist/css/tokens.css` | All tiers concatenated — primitives, semantic light, semantic dark, components |
| `dist/tokens/primitives.json` | Raw primitive scale values |
| `dist/tokens/semantic.light.json` | Resolved semantic tokens for light theme |
| `dist/tokens/semantic.dark.json` | Resolved semantic tokens for dark theme |
| `dist/tokens/components.json` | Resolved component tokens |

## Building from source

```bash
pnpm install
pnpm run build
```

Source tokens live in `tokens/`. Never edit `dist/` files directly — they are regenerated on every build.

## MCP token server

A local [Model Context Protocol](https://modelcontextprotocol.io) server that lets AI assistants search and look up tokens directly.

```bash
pnpm run mcp
```

Add to your MCP client config (e.g. `claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "design-system-tokens": {
      "command": "node",
      "args": ["/absolute/path/to/design-system/mcp/index.js"]
    }
  }
}
```

| Tool | Description |
|---|---|
| `search_tokens` | Substring search across paths and values. Supports `tier`, `type`, `theme` filters. |
| `get_token` | Exact lookup by token path — e.g. `component.button.primary.background`. |

## Visual reference

Open `docs/token-docs.html` in a browser for a full visual reference of all resolved token values across all tiers and both themes.

## Publish checklist

1. `pnpm run build`
2. Bump version in `package.json`
3. `pnpm publish`
