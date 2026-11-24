# Architecture decision records

Every accepted decision, with the one line that matters most. Open the ADR for the context and the
options it rejected. There are two numbered series, so cite a token ADR as "tokens ADR 0002".

## System and spec

In this folder.

| ADR                                       | Decision                                                                                                                       | Status                         |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------ |
| [0001](0001-spec-scope.md)                | The spec is a technology-neutral contract: no element, attribute, framework, or CSS names; agents are the main consumer.       | Accepted                       |
| [0002](0002-record-format.md)             | Four record types (component, pattern, guideline, example), found by `id`, not by path.                                        | Accepted, amended by 0004–0005 |
| [0003](0003-spec-delivery.md)             | No build step: one library loads the authored files, and the CLI, MCP server, and docs site all call it.                       | Accepted, amended by 0006      |
| [0004](0004-repeated-items.md)            | A top-level `items` field holds the options of an anatomy part that repeats.                                                    | Accepted                       |
| [0005](0005-part-options.md)              | A top-level `parts` field, the same shape as `items`, holds a single part's options; a part is in one or the other.             | Accepted                       |
| [0006](0006-hosted-mcp-server.md)         | The hosted MCP server is one server core with a small adapter per host, serving a snapshot built at deploy time.               | Accepted                       |
| [0007](0007-agent-first-surfaces.md)      | Each surface has one purpose: the spec for agents, Storybook as a workbench, the docs site for orientation and one catalog page. | Accepted                       |
| [0008](0008-rename-to-taproot.md)         | The system is named Taproot (formerly Ember & Sage; the CLI was `ds-spec`); the `ds` prefix on tags and CSS variables stays.   | Accepted                       |
| [0009](0009-inherited-rules.md)           | Patterns and guidelines may have rules, and a component inherits the rules of each record it follows.                          | Accepted                       |
| [0010](0010-implementation-setup.md)      | Setup every component shares lives once per implementation, in its folder's `README.md`, served by `taproot setup`.            | Accepted                       |
| [0011](0011-skills-over-mcp.md)           | After a v2 SDK upgrade, the MCP server serves workflow-only skills from `packages/spec/skills/`; the instructions stay as well. | Proposed                       |

## Tokens

In [`packages/tokens/docs/adr/`](../../packages/tokens/docs/adr/). Tokens ADR 0001 was removed with
the tooling it described.

| ADR                                                                           | Decision                                                                                          | Status   |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | -------- |
| [0002](../../packages/tokens/docs/adr/0002-theming-policy.md)                 | Light and dark themes define the same semantic token paths; a theme changes values, not names.    | Accepted |
| [0003](../../packages/tokens/docs/adr/0003-token-tier-consumption.md)         | Components read semantic tokens directly; there is no component token tier.                       | Accepted |

When you add, amend, or supersede an ADR, update its row here in the same change.
