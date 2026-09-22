---
name: design-tokens
description: >
  Consumer guidance for selecting and applying existing published primitive, semantic, and component tokens
  from @stevegreco/design-system. Use when developers or designers need to choose or review token
  consumption in component or product styles.
---

# Design Tokens

## Layered Architecture

Primitive and semantic tokens form the shared foundation. A component tier is optional and exists
only where a published component contract adds a useful customization boundary.

| Tier      | Prefix         | Purpose                                                                 | When to use                                                                      |
| --------- | -------------- | ----------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Primitive | `primitives.*` | Raw scale values such as color, spacing, and type                       | Use only when no published semantic token fits.                                  |
| Semantic  | `semantic.*`   | Intent-named aliases such as background, foreground, border, and status | The normal styling API for components and product interfaces.                    |
| Component | `component.*`  | Component-scoped aliases over current primitive and semantic contracts  | Use when styling or customizing a component with a published component contract. |

## Rules

- Use a semantic token when it expresses the intended role.
- Keep application groups separate: backgrounds for fills, foregrounds for content, and borders for boundaries.
- Use a primitive only when the semantic layer has no matching contract.
- Component tokens must alias current primitive or semantic tokens; do not place independent values or stale paths in the component tier.
- Component aliases are theme-independent; semantic tokens own theme selection and resolution.
- Do not invent a component namespace for a component that does not publish one. A component has a component namespace only when its knowledge record declares `tokenRef` with `tier: component` and `packages/tokens/src/tokens/components/<name>.tokens.json` exists; every other component consumes semantic tokens directly.
- Do not choose a token merely because its current resolved value looks right.

## Token Selection Workflow

1. Identify the CSS property.
2. Identify the component or product context.
3. If the component publishes a component contract, use its component token.
4. Otherwise choose the semantic token that expresses the role.
5. Fall back to a primitive only when no semantic contract fits.

Current token definitions in `packages/tokens/src/tokens/` are the source of truth. Do not guess paths
from older examples or documentation.
