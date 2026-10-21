---
name: design-tokens
description: >
  Consumer guidance for selecting and applying existing published primitive and semantic tokens
  from @stevegreco/design-system. Use when developers or designers need to choose or review token
  consumption in component or product styles.
---

# Design Tokens

## Layered Architecture

Primitive and semantic tokens are the whole public vocabulary. There is no component tier
(tokens ADR 0003).

| Tier      | Prefix         | Purpose                                                                 | When to use                                                                      |
| --------- | -------------- | ----------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Primitive | `primitives.*` | Raw scale values such as color, spacing, and type                       | Use only when no published semantic token fits.                                  |
| Semantic  | `semantic.*`   | Intent-named aliases such as background, foreground, border, and status | The normal styling API for components and product interfaces.                    |

## Rules

- Use a semantic token when it expresses the intended role.
- Keep application groups separate: backgrounds for fills, foregrounds for content, and borders for boundaries.
- Use a primitive only when the semantic layer has no matching contract.
- Never reference a color primitive in CSS. `--primitives-color-*` variables are not published; use a semantic color token.
- Do not invent a component token namespace. Components consume semantic tokens directly.
- Do not choose a token merely because its current resolved value looks right.

## Token Selection Workflow

1. Identify the CSS property.
2. Identify the component or product context.
3. Choose the semantic token that expresses the role.
4. Fall back to a primitive only when no semantic contract fits. Color always comes from a semantic token.

Current token definitions in `packages/tokens/src/tokens/` are the source of truth. Do not guess paths
from older examples or documentation.
