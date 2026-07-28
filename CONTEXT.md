# Design System — Domain Context

## Token Tiers

The system uses a three-tier token architecture:

| Term | Definition |
|---|---|
| **Primitive token** | Raw, scale-based values with no semantic meaning (e.g. `primitives.color.robRoy.700`, `primitives.space.4`). Never referenced directly in component code. |
| **Semantic token** | Intent-named aliases that reference primitive tokens (e.g. `semantic.color.accent.default`). Theme-aware — light and dark variants exist with identical paths but different resolved values. |
| **Component token** | Component-scoped aliases that reference semantic tokens (e.g. `component.button.primary.background`). One file per component. |

## Token Identity

| Term | Definition |
|---|---|
| **Token path** | Dot-separated key sequence identifying a token (e.g. `component.button.primary.background`). Derived from the nested JSON structure. |
| **CSS variable** | The CSS custom property name emitted by Style Dictionary for a token (e.g. `--component-button-primary-background`). Derived mechanically from the token path. |
| **Resolved value** | The final computed value of a token after Style Dictionary has followed all alias references (e.g. `#a0501d`). Lives in `dist/tokens/`. |
| **Raw value** | The alias reference as written in the source token file (e.g. `{semantic.color.accent.default}`). Lives in `tokens/`. |

## Themes

The semantic tier has two theme variants: **light** (default) and **dark**. Token paths are identical across themes; only resolved values differ.

## MCP Server

A local MCP server (`mcp/index.js`) that exposes design tokens to AI assistants and developer tooling. Reads from built output (`dist/tokens/`). See [[adr-0001-mcp-reads-from-dist]].

### Tools

| Tool | Description |
|---|---|
| `search_tokens` | Substring search across token paths and resolved values. Accepts optional `tier`, `type`, and `theme` filters. Defaults to light theme. |
| `get_token` | Exact lookup by token path. Returns a single [[Token Result]] or an error. Accepts optional `theme` parameter. |

### Token Result

The shape returned by both MCP tools:

| Field | Example |
|---|---|
| `path` | `component.button.primary.background` |
| `cssVariable` | `--component-button-primary-background` |
| `value` | `#a0501d` |
| `type` | `color` |
| `tier` | `component` |

### Stale Build Detection

On every tool call, the MCP compares the `mtime` of source token files (`tokens/`) against the dist files (`dist/tokens/`). If any source file is newer, a warning is appended to the response.

## Docs

| File | Description |
|---|---|
| `docs/token-docs.html` | Visual reference of all resolved token values across all tiers and themes. Open in a browser; no build step required. |
| `docs/agent-architecture.html` | Diagram of the agent/MCP architecture for this system. |
| `docs/token-architecture-audit.md` | Audit of the token architecture (2026-07-28). 12 findings covering theming inconsistency, ramp integrity, and contrast. |
| `docs/token-remediation-plan.md` | Work breakdown acting on the audit findings, with dependencies and release sequencing. |
