# ADR 0001: Spec scope

**Status:** Accepted

This ADR and ADRs 0002 and 0003 replaced earlier ADRs, which are in git history. The package was
called the knowledge layer until October 2026.

## Context

The earlier layer grew to serve several jobs at once. It compiled records, described how one
platform implements each component, and tested that implementation against the spec. About 5,200
lines of compiler code served content that was smaller than the code.

That coupling made the spec depend on one technology. Every component carried tag names,
attributes, and shadow parts. Guidelines were mostly code. Design could not agree on a component
without engineering having built it.

## Decision

The spec is a technology-neutral contract that design and engineering agree on before
implementation.

- A record says what a component is, how to use it, and how it behaves. It does not name an
  element, an attribute, a framework, or a CSS property.
- A record may map anatomy parts to design tokens. That is a visual mapping, not an
  implementation.
- The tooling checks only that an implementation's API mapping covers the record's parameters,
  values, and events. Nothing checks behavior or styling against the spec. Implementations have
  their own tests.
- Agents are the main consumer, through a CLI and an MCP server. See
  [ADR 0007](0007-agent-first-surfaces.md).
- Records link to each other with typed links, down to a section, so an agent can pull exactly the
  context it needs.
- The format works for any design system. Ember & Sage is the reference corpus, not part of the
  format.

Records are written by hand. Existing content was migrated once, and nothing imports from Figma,
Notion, or other tools.

## Consequences

- Design and engineering can review a component before anyone builds it.
- A spec's behavior and styling can drift from an implementation without a test failing. Reviewers
  compare them.
- Implementation facts live with each implementation, in its own package.
- Another design system can adopt the format and tools with its own content.
- Semantic and embedding search are out of scope. Keyword search and link traversal come first.

## Alternatives considered

**Keep executable specs.** Tests derived from the spec caught drift, but they tied the spec to one
platform and required a compiler. Rejected.

**Keep a `web:` section per component.** It kept implementation facts next to the contract, but it
made the contract non-portable. Rejected.

**Import records from design tools.** It would need a synchronization layer for content that
changes slowly. Rejected for now.
