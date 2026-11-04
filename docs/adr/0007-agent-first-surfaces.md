# ADR 0007: Agent-first surfaces

**Status:** Accepted
**Amends:** [ADR 0001](0001-spec-scope.md) and [ADR 0003](0003-spec-delivery.md), which make the docs
site the spec's second consumer and have it build a page per component.

## Context

Being agent-first is the design system's main goal. Usage guidance was spread across three surfaces:
spec records, per-component docs pages, and Storybook. Each docs page costs a renderer, an example,
and a review phase per component, and repeats what agents already read from the spec.

## Decision

**Each surface has one purpose.**

- The spec's CLI and MCP server are for agents, and for the rules.
- Storybook is for seeing and trying components.
- The docs site is for orientation.

**Per-component docs pages go away.** One catalog page generated from the spec replaces them to
start, with each component's name, purpose, when to use it, and a Storybook link.

**The docs site stays on Blume.** It provides navigation, search, theming, and `llms.txt` output, so
switching would add code to own. Revisit only if it gets in the way after the cuts.

## Consequences

- Usage knowledge goes in spec records, not on docs pages.
- A new feature is weighed first by what it does for agents, and names the one surface that owns it.
- Before the docs examples are deleted, their Verify suites are compared with
  `packages/components/test`, and any unique coverage moves there.
- The `document-component` skill and phase go away with the pages. A component is built in two
  phases, spec and implementation.

## Alternatives considered

**Keep per-component pages.** They read well for people, but agents are the main consumer, and the
pages duplicate the spec. Rejected.

**Move the docs to Eleventy.** Rejected for the reason above.
