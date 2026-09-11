# Agent guidance

## Design system knowledge

Before changing the agent-facing knowledge system, read:

1. `docs/knowledge/requirements.md`
2. `docs/knowledge/content-model.md`
3. `docs/adr/0005-yaml-component-specs.md`

ADR 0001 is superseded by 0002. ADR 0003 supersedes the spec-record half of ADR 0002. ADR 0005
supersedes the Markdown-authoring and narrative-projection portions of ADR 0003 while preserving
component ownership and host separation. Use the
stable `KNOW-*` requirement IDs in plans, issues, and pull requests. Update the documents when an
implementation changes an accepted requirement or decision.

Domain-owned sources remain authoritative. Token decisions live in `packages/tokens/docs/adr/`.
Portable component contracts live on component records in `packages/knowledge/content/components/`.
YAML `*.spec.yaml` files are the component records for Button and Badge; they are not `type: spec`.
Host bindings live in `packages/knowledge/content/bindings/`. Component runtime lives in
`packages/components`.

Do not place design system facts only in an MCP server, documentation page, or tool-specific agent
skill. Those are consumers or delivery adapters for the portable knowledge records.
