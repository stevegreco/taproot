# ADR 0003 — Token tier consumption

**Status:** Accepted

## Context

The system publishes primitive and semantic tokens as its shared foundation. Button once published
a third, component tier (`component.button.*`). Every one of its 45 tokens was a one-hop alias that
matched its semantic or primitive target in both themes, so the tier added names without adding a
customization boundary.

The CSS also published every primitive, including the raw color palette. A consumer who styles with
a palette color skips the theme and the contrast guarantees the semantic tier carries.

## Decision

### Semantic tokens are the styling API

Components consume semantic tokens directly whenever a semantic contract expresses the intended
role. Background tokens style fills, foreground tokens style visible content, and border tokens
style boundaries and focus indicators.

### There is no component tier

No component publishes component-scoped tokens. A component's spec record lists the semantic and
primitive tokens it reads in its `tokens` map, and its stylesheet reads the same tokens. Those
internal choices are not a public customization API.

Add a component tier only when a shipped consumer needs to customize a component in a way the
semantic tier cannot express. That change revises this ADR first.

### Primitive use is allowed when it is honest

A component may consume a primitive directly when the semantic vocabulary has no matching role,
such as spacing or motion scale choices. Never reference a primitive when a semantic token already
expresses the same intent. Colors, radii, and borders always come from the semantic tier, and tests
in the components and spec packages enforce that.

### Color primitives are not published as CSS

`tokens.css` publishes every primitive except `primitives.color.*`. Color reaches CSS only through
semantic tokens, which resolve per theme. `primitives.json` keeps the palette for documentation
swatches and the token audits.

## Example

```css
background: var(--ds-semantic-color-background-action-primary-default);
color: var(--ds-semantic-color-foreground-on-action-primary);
gap: var(--ds-primitives-space-2);
```

## Consequences

- Primitive and semantic tokens are the whole public vocabulary.
- A theme change reaches every component through semantic references alone.
- Product code that needs a color it cannot find proposes a semantic role instead of reaching for
  the palette.
- Reviews verify that a token matches the CSS property and intent rather than merely matching a
  value.
