---
name: design-tokens
description: >
  Consumer guidance for selecting and applying existing published tokens from
  @stevegreco/design-system. Use when developers or designers need to find an existing token,
  choose a token for a CSS property, understand token names or palette intent, apply tokens in
  component or product styles, or review token consumption. Do not use for creating or modifying
  token definitions, reviewing the token architecture itself, or maintaining the token build
  pipeline; use repository context and ADRs for those tasks.
---

# Design Tokens

## Three-Tier Architecture

Tokens are organized in three tiers. Choose the most specific published token that matches the
property and intent, but do not assume every component property has a component token.

| Tier | Prefix | Purpose | When to use |
|---|---|---|---|
| Primitive | `primitives.*` | Raw scale values — colors, spacing, type | Use only when no published semantic or component token fits. |
| Semantic | `semantic.*` | Intent-named aliases (background, foreground, border, status) | The normal styling API for components and product UI. |
| Component | `component.*` | Selectively published component-scoped tokens | Prefer an existing one when it covers the exact component property, variant, or state. |

**Rules:**

- Use an existing component token when it covers the exact component property and context.
- Otherwise use a semantic token when it expresses the intended role.
- Use a primitive only when neither published layer fits.
- Do not borrow a component token from another component or variant merely because its value looks right.

## Token Selection Workflow

1. Identify the CSS property (e.g. `background-color`, `border-radius`, `color`)
2. Identify the component or context (e.g. "danger button", "input focus state")
3. Check whether an existing component token covers that exact property and context
4. Otherwise choose the semantic token that expresses the intended role
5. Fall back to a primitive only when neither published layer fits

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
