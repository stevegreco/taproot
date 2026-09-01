# Design system knowledge

This directory defines the requirements and content model for agent-facing Ember & Sage knowledge.
The knowledge system is independent of any one agent product or delivery protocol.

## Status

The knowledge package defines an executable record schema and parses authored Markdown records.
The compiler, retrieval interface, and MCP adapters are not implemented.

## Reading order

1. [Requirements](requirements.md) defines the users, required behavior, first release, and
   non-goals.
2. [Content model](content-model.md) defines the records that make knowledge portable and
   retrievable.
3. [ADR 0001](../adr/0001-portable-design-system-knowledge.md) records the initial architecture
   decision.

Existing domain decisions remain authoritative:

- [Theming policy](../../packages/tokens/docs/adr/0002-theming-policy.md)
- [Token tier consumption](../../packages/tokens/docs/adr/0003-token-tier-consumption.md)

## First content slice

The executable schema and authored Markdown parser validate these draft records:

- [Button](../../packages/knowledge/content/components/button.md)
- [Action hierarchy](../../packages/knowledge/content/patterns/action-hierarchy.md)
- [Button implementation](../../packages/knowledge/content/guidelines/button-implementation.md)
- [Button review](../../packages/knowledge/content/guidelines/button-review.md)
- [Settings action hierarchy example](../../packages/knowledge/content/examples/action-hierarchy-settings.md)

## Working agreement

- Keep durable requirements and decisions in this repository.
- Use stable requirement IDs when discussing or implementing behavior.
- Use issues to assign and track implementation work. Link each issue to the requirements it
  implements.
- Change these documents in the same pull request when implementation changes an accepted
  requirement or decision.
- Do not make an MCP server, documentation site, or agent skill the sole source of knowledge.
