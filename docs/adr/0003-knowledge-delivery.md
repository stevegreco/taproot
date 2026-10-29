# ADR 0003: Knowledge delivery

**Status:** Accepted
**Source:** [RFC 0002](../rfcs/0002-knowledge-layer-architecture.md). This ADR and ADRs 0001 and
0002 replaced the earlier ADRs 0001 through 0007, which are available in git history.

## Context

The earlier layer compiled sources into a bundle, a digest, generated Markdown, and a search
index. That output needed a build step, a version, and a public export. Agents had only a
JavaScript API. The docs site read compiled records and required each component to carry
implementation facts.

## Decision

**Load from source.** `loadKnowledge()` reads the content folder, validates each record against
the JSON Schema, checks cross-record facts, and builds an in-memory index. There is no build step,
no `dist/`, and no compiled format. Errors name the file and line.

**One library behind every consumer.** The CLI (`pnpm knowledge`), the MCP server, and the docs
site all call the same library. The library offers `get`, `search`, `list`, `links`, `rules`,
`tokens`, and a Markdown renderer. The CLI prints Markdown by default and JSON with `--json`. The
MCP server is a local stdio server that exposes the same operations as tools and each record as a
resource at `knowledge://<id>`.

**Configurable content folder.** A `knowledge.config.json` names the content folder and, if
wanted, a token resolver. Another design system points the tools at its own content.

**Optional token resolver.** To answer "what value is that token?", an adopter can configure a
resolver that reads its token files. A DTCG JSON resolver is included. It lives outside the core
format, which treats token references as opaque.

**Implementation content is owned by the implementation.** The docs site builds a component page
from the knowledge record plus an implementation file in the components package, at
`packages/components/implementation/<name>.md`. That file holds the package, tag name, usage
snippet, API table, and web-specific guidance. The components package holds the code and its
behavior tests.

## Consequences

- An edit to a spec is visible to the CLI, the MCP server, and the docs site immediately.
- Validation is `pnpm knowledge validate` or the knowledge package tests.
- No compiled artifact can go stale or need a version policy.
- Loading is fast enough only because the corpus is small. A large corpus may need a cache later.
- The docs site owns its implementation files. A component page needs one, or it lacks
  installation and API content.
- Remote delivery and internal or private corpora are out of scope. A second content folder can
  serve a private corpus if one is needed.

## Alternatives considered

**Keep the compiler and publish a bundle.** It let consumers run without the source, but it
required a build, a version policy, and a public bundle format. Rejected.

**Generate the implementation file from the components package.** A custom elements manifest could
supply the API table. It is a separate decision for the components package and not needed now.

**Resolve tokens in the core format.** It would tie the format to one token system. Rejected.
