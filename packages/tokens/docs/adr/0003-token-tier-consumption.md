# ADR 0003 — Token tier consumption

**Status:** Accepted

## Context

The system has primitive, semantic, and component token tiers, but the presence of three tiers does
not mean every component value should pass through all three. Treating the component tier as
mandatory creates aliases that merely rename semantic or primitive tokens without adding meaning.
At the other extreme, reaching for primitives when a semantic role already exists discards intent
and theme behavior.

The system needs a clear default for component styling and a narrow criterion for when a component
token earns its place.

## Decision

### Semantic tokens are the normal component styling API

Components may consume semantic tokens directly. When a semantic token expresses the intended
role, use it; the existence of a component does not require a component-scoped alias.

### Component tokens are selective contracts

Create a component token only when it adds at least one of:

- an intentional customization point that consumers can override independently;
- a component-specific decision shared by multiple implementations;
- a stable contract for a named component variant or state that combines semantic roles; or
- insulation from an implementation detail likely to change without affecting consumers.

Component tokens generally alias semantic tokens. A component token may alias a primitive when the
value is an intentional part of the component's public contract and no semantic role fits.

Do not create a component token when it merely renames a semantic token without adding a useful
contract, or merely wraps a primitive to satisfy layering.

### Primitive use is allowed when it is honest

A component may consume a primitive directly when no semantic intent fits and a component token
would add no useful customization, reuse, or stability boundary. Never reference a primitive when
a semantic or component token already expresses the same intent.

Do not invent semantic or component aliases solely to force a value through every tier.

## Examples

```css
/* Shared UI intent: semantic token directly in component CSS. */
color: var(--semantic-color-foreground-default);

/* Stable, independently customizable component variant. */
background: var(--component-button-primary-background);

/* Raw scale choice with no semantic role or useful component contract. */
gap: var(--primitives-space-2);
```

## Consequences

- The semantic tier remains the default vocabulary for UI intent and theming.
- The component tier stays small and purposeful rather than mirroring every CSS property.
- Primitive references in component code are acceptable only where no semantic role fits.
- Reviews must judge whether a component token adds a real contract, not merely whether one could be
  created.
- Automated checks may flag primitives that bypass an existing semantic/component token and
  component tokens that are redundant wrappers, but must not prohibit direct semantic or primitive
  consumption categorically.
