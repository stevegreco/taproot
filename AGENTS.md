# Agent guidance

## Design system knowledge

Before changing the agent-facing knowledge system, read:

1. `docs/knowledge/requirements.md`
2. `docs/knowledge/content-model.md`
3. `docs/adr/0003-component-owned-portable-contracts.md`

ADR 0001 is superseded by 0002. ADR 0003 supersedes the spec-record half of ADR 0002. Use the
stable `KNOW-*` requirement IDs in plans, issues, and pull requests. Update the documents when an
implementation changes an accepted requirement or decision.

Domain-owned sources remain authoritative. Token decisions live in `packages/tokens/docs/adr/`.
Portable component contracts live on component records in `packages/knowledge/content/components/`.
Host bindings live in `packages/knowledge/content/bindings/`. Component runtime lives in
`packages/components`.

Do not place design system facts only in an MCP server, documentation page, or tool-specific agent
skill. Those are consumers or delivery adapters for the portable knowledge records.

When reviewing a product design or implementation against Ember & Sage guidance, follow
`.agents/skills/review-design-system/SKILL.md`. That skill consumes compiled knowledge records
through `openCatalog`. It must not become a second source of component, pattern, or token facts.
