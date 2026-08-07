# ADR 0003 — Token tier consumption

**Status:** Accepted

## Context

The system publishes primitive and semantic tokens as its shared foundation. Some components also
need a stable customization boundary that can compose several shared token decisions without
exposing their internal CSS variables.

## Decision

### Semantic tokens remain the default styling API

Components consume semantic tokens directly whenever a semantic contract expresses the intended
role. Background tokens style fills, foreground tokens style visible content, and border tokens
style boundaries and focus indicators.

### A component tier is optional and scoped

A component may publish component-scoped aliases when the alias creates a useful public contract
for that component. Component tokens must reference current semantic or primitive tokens. They do
not introduce independent values, replace semantic intent, or require every component to have a
component namespace.

Button is currently the only component with a published component contract. Badge continues to use
semantic tokens directly.

### Primitive use is allowed when it is honest

A component may consume a primitive directly when the semantic vocabulary has no matching role,
such as spacing or motion scale choices. Never reference a primitive when a semantic token already
expresses the same intent.

## Example

```css
background: var(--component-button-primary-background-default);
color: var(--component-button-primary-foreground-default);
gap: var(--component-button-gap);
```

The component source definitions alias those contracts to shared tokens:

```json
{
  "$value": "{semantic.color.background.action.primary.default}",
  "$type": "color"
}
```

## Consequences

- Primitive and semantic tokens remain the shared public vocabulary.
- A component tier may expose a deliberately scoped customization API.
- Component aliases inherit theme changes through semantic references.
- `components.json` preserves those references and is not split by theme; semantic artifacts own theme resolution.
- Adding a component contract requires a current consumer and tests that verify every alias resolves.
- Reviews verify that a token matches the CSS property and intent rather than merely matching a value.
