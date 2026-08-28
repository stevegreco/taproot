# ADR 0001: Portable design system knowledge

**Status:** Proposed

## Context

Ember & Sage knowledge currently exists in token source files, token ADRs, component
specifications, package documentation, Blume pages, examples, and agent skills. These sources
serve different owners and audiences, but agents cannot retrieve them through one stable interface.
Several facts are also repeated manually.

Agents may work inside this repository, in another codebase, or without source-code access. They
may use Cursor, Claude, another MCP client, or a custom integration. The knowledge therefore cannot
depend on repository traversal, one documentation framework, or one agent product.

MCP is a useful delivery protocol, but making an MCP implementation the source of truth would bind
content structure to a transport and make reuse outside MCP harder.

The system also needs public and internal knowledge. A visibility flag can control compiled output,
but it cannot protect a source file committed to a public repository.

## Decision

We will build a transport-independent knowledge package that compiles design system sources into
self-contained public and internal bundles.

The package will:

- define and validate the shared knowledge record schema;
- own cross-cutting patterns, guidelines, examples, and annotations;
- compile records from domain-owned token policies and component specifications;
- emit Markdown, JSON, JSONL, a manifest, a text-search index, and visual assets; and
- expose `search`, `get`, `list`, and `related` through a package interface.

Knowledge with a clear domain owner remains with that owner. Token definitions and policy remain
in the token package. Component contracts remain in the component package. The knowledge compiler
references or transforms those sources and records their provenance.

Human documentation will consume authoritative knowledge records when it presents the same facts.
Tool-specific skills can consume the compiled bundles but will not own design system facts.

MCP support will be a separate adapter over the package interface. A later remote service can use
the same bundles and retrieval behavior.

Public knowledge will live in this repository. Internal knowledge may be supplied by a private,
separately controlled input. The compiler will reject public records with internal dependencies.

The first implementation will cover one connected Button and action hierarchy slice before broader
migration.

## Consequences

- Agents can consume one versioned artifact without access to the source repository.
- Local libraries, command-line tools, MCP servers, static hosting, and HTTP services can share the
  same records.
- Domain packages retain ownership of their contracts and decisions.
- The documentation application must import shared facts instead of maintaining equivalent prose
  or tables manually.
- A compiler and schema migration policy become required infrastructure.
- Public and internal builds need validation that prevents visibility leaks.
- Internal source security requires repository or storage access controls outside the compiler.
- Existing content will remain split during migration, so each migrated fact needs an explicit
  authoritative source.
