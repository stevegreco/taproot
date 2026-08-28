# Agent guidance

## Design system knowledge

Before changing the agent-facing knowledge system, read:

1. `docs/knowledge/requirements.md`
2. `docs/knowledge/content-model.md`
3. `docs/adr/0001-portable-design-system-knowledge.md`

Use the stable `KNOW-*` requirement IDs in plans, issues, and pull requests. Update the documents
when an implementation changes an accepted requirement or decision.

Domain-owned sources remain authoritative. In particular, token decisions live in
`packages/tokens/docs/adr/`, and component contracts live in `packages/components/specs/`.

Do not place design system facts only in an MCP server, documentation page, or tool-specific agent
skill. Those are consumers or delivery adapters for the portable knowledge records.
