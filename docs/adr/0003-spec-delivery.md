# ADR 0003: Spec delivery

**Status:** Accepted
**Amended by:** [ADR 0006](0006-hosted-mcp-server.md), for the hosted MCP server.

This ADR and ADRs 0001 and 0002 replaced earlier ADRs, which are in git history.

## Context

The earlier layer compiled sources into a bundle, a digest, generated Markdown, and a search
index. That output needed a build step, a version, and a public export. Agents had only a
JavaScript API. The docs site read compiled records and required each component to carry
implementation facts.

## Decision

**Load from source.** `loadSpec()` reads the content folder, validates each record against the JSON
Schema, checks cross-record facts, and builds an in-memory index. There is no build step, no `dist/`,
and no compiled format. Errors name the file and line.

**One library behind every consumer.** The CLI (`ds-spec`), the MCP server, and the docs site all
call the same library. The library offers `get`, `search`, `list`, `links`, `rules`, `tokens`, and a
Markdown renderer. The CLI prints Markdown by default and JSON with `--json`. The MCP server is a
local stdio server that exposes the same operations as tools and each record as a resource at
`spec://<id>`.

**Configurable content folder.** A `spec.config.json` names the content folder and, if wanted,
implementations, system-wide constants, and token sets. Another design system points the tools at
its own content.

**Optional token resolver.** To answer "what value is that token?", an adopter can configure a
resolver that reads its token files. A DTCG JSON resolver is included. It lives outside the core
format, which treats token references as opaque.

**Each implementation owns its content.** An implementation keeps one file per component in its own
package, such as `packages/components/implementation/<name>.md` for web components and
`packages/react/implementation/<name>.md` for React. `spec.config.json` names each folder and its
technology, which sets the fields the file holds. The file gives the package, what to import, a usage
snippet, API rows, and guidance for that technology. `get --impl <name>` serves it.

## Consequences

- An edit to a spec is visible to the CLI, the local MCP server, and the docs site immediately.
- Validation is `ds-spec validate` or the spec package tests.
- No compiled artifact can go stale or need a version policy.
- Loading is fast enough only because the corpus is small. A large corpus may need a cache later.
- Internal or private corpora are out of scope. A second content folder can serve a private corpus if
  one is needed.

## Alternatives considered

**Keep the compiler and publish a bundle.** It let consumers run without the source, but it
required a build, a version policy, and a public bundle format. Rejected.

**Generate the implementation file from the components package.** A custom elements manifest could
supply the API table. It is a separate decision for the components package and not needed now.

**Resolve tokens in the core format.** It would tie the format to one token system. Rejected.
