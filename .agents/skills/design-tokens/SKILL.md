---
name: design-tokens
description: >
  Knowledge and workflow for working with the @stevegreco/design-system design token system.
  Use when answering questions about design tokens, suggesting which token to use for a CSS
  property, explaining token naming conventions, describing the color palette, or helping
  developers and designers find and apply the right token. Also use when generating component
  styles, reviewing token usage in code, or explaining the three-tier token architecture
  (primitive → semantic → component).
---

# Design Tokens

## Three-Tier Architecture

Tokens are organized in three tiers. Always use the most specific tier available.

| Tier | Prefix | Purpose | When to use |
|---|---|---|---|
| Primitive | `primitives.*` | Raw scale values — colors, spacing, type | Almost never directly. Only when no semantic or component token fits. |
| Semantic | `semantic.*` | Intent-named aliases (background, foreground, border, status) | When building a new component or pattern not yet covered by component tokens. |
| Component | `component.*` | Component-scoped tokens for specific UI elements | Always prefer these when styling a button, input, card, badge, or alert. |

**Rule:** Never reference a primitive token in component CSS when a semantic or component token exists for the same intent.

## Token Selection Workflow

1. Identify the CSS property (e.g. `background-color`, `border-radius`, `color`)
2. Identify the component or context (e.g. "danger button", "input focus state")
3. Check component tokens first — if the component exists, use its token
4. Fall back to semantic tokens for patterns not covered by a component
5. Use primitives only for truly one-off values with no semantic equivalent

## MCP Tools

When a specific token path or CSS variable is needed, use the MCP tools rather than guessing:

| Tool | When to use |
|---|---|
| `suggest_token` | Best first call — give it a CSS property + context, get ranked suggestions |
| `search_tokens` | Broad keyword search across all paths and values |
| `get_token` | Exact lookup when you already know the path |

Example: user asks "what token for a danger button background?" →
`suggest_token({ property: "background-color", context: "danger button" })`

## Quick Reference

For the color palette, semantic category details, component token inventory, and naming
convention glossary, read [references/token-reference.md](references/token-reference.md).
