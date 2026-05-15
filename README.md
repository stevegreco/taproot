# design-system

Design token package with DTCG-style source tokens and generated distribution artifacts.

## Source of truth

- DTCG-style tokens: `tokens/primitives.tokens.json`
- Semantic token examples:
  - `tokens/semantic/light.tokens.json`
  - `tokens/semantic/dark.tokens.json`

## Build outputs

- CSS variables (single file): `dist/css/tokens.css`
- JSON tokens: `dist/tokens/primitives.json`
- The CSS file contains:
  - primitives in `:root` with `--primitives-*` names
  - semantic light tokens in `:root`
  - semantic dark overrides in `:root[data-theme="dark"]`

## Install

```bash
pnpm install
```

## Build

```bash
pnpm run build
```

## Consume in CSS projects

```css
@import "design-system/css";
```

Or via JS:

```js
import "design-system/css";
```

Semantic layers:
The single CSS entry already includes both light and dark semantic layers.
The sample semantic token is `--semantic-color-background-brand`.

## Consume JSON tokens

```js
import tokens from "design-system/tokens";
```

## MCP Token Server

A local [Model Context Protocol](https://modelcontextprotocol.io) server that lets AI assistants search and retrieve tokens directly from your editor.

### Tools

| Tool | Description |
|---|---|
| `search_tokens` | Substring search across token paths and resolved values. Accepts optional `tier`, `type`, and `theme` filters. |
| `get_token` | Exact lookup by token path (e.g. `component.button.primary.bg`). |

Both tools return: `path`, `cssVariable`, `value`, `type`, `tier`. A stale-build warning is appended if source files are newer than the last build.

### Setup

Run `pnpm build` first, then add this to your MCP client config (e.g. Claude Desktop's `claude_desktop_config.json`):

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

Replace `/absolute/path/to/design-system` with the real path on your machine.

## Publish checklist

1. Run `pnpm run build`
2. Bump version in `package.json`
3. Publish with `pnpm publish`

## Notes

- The package uses Style Dictionary to generate platform outputs.
- Keep editing tokens in `tokens/primitives.tokens.json` rather than editing `dist/*` files directly.
