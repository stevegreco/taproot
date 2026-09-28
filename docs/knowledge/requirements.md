# Agent knowledge system requirements

**Status:** Draft

## Purpose

Ember & Sage needs a portable source of design system knowledge for agents that design interfaces,
implement them, and review them. An agent may use the knowledge without access to this repository
or the design system source code.

The knowledge has two jobs:

1. **A contract to build from.** Engineers build the web components, and designers build the Figma
   components, from the same parts, variants, states, tokens, and rules.
2. **One source of knowledge to serve.** Components, patterns, and guidelines reach the docs site
   and adopters' agents through one retrieval interface, and later through MCP, a CLI, and an API.

The knowledge includes component contracts, patterns, guidelines, best practices, token guidance,
decisions, and annotated screen examples. Delivery protocols such as MCP expose the knowledge but
do not own it.

## Users and jobs

The first release supports three agent jobs at equal, intentionally limited depth:

- choose components and patterns while designing a screen;
- implement product UI with the design system; and
- review UI or code for compliance with design system guidance.

Human documentation authors and design system maintainers also need to author, validate, and
publish the same facts without maintaining a second agent-only copy.

## Requirements

### Knowledge ownership

- **KNOW-001:** The repository must contain the authoritative public knowledge records and their
  schemas.
- **KNOW-002:** Knowledge with a clear domain owner must remain close to that owner. Token facts and
  token ADRs remain with the token package. Component contracts are authored in component specs in
  the knowledge package, and each spec's `web` section says how the web component implements the
  contract. Component runtime stays in the component package. Knowledge must not become a second
  owner of token values.
- **KNOW-003:** Cross-cutting patterns, guidelines, and examples must have an explicit home in the
  knowledge package.
- **KNOW-004:** Human documentation must render or import authoritative knowledge records when it
  presents the same facts. It must not create a manually synchronized copy.
- **KNOW-005:** Every compiled record must identify its authored or generated sources.

### Content

- **KNOW-006:** The system must represent components, patterns, guidelines, examples, foundations,
  and decisions. A component's platform implementation is part of its record, not a separate one.
- **KNOW-007:** A compiled record must have a stable ID, type, title, summary, status, visibility,
  supported agent jobs, tags, relationships, provenance, and an agent-readable body. Authors write
  the ID, type, title, and summary; the build supplies the others when they are omitted. An authored
  YAML component spec may omit a Markdown body. The compiler generates that compiled body from the
  structured record so the YAML file remains the only authored authority. Markdown records still
  author their bodies.
- **KNOW-008:** Component knowledge must expose structured contracts when available, including
  usage, anatomy, parameters, events, states, behavior, accessibility, and token relationships.
- **KNOW-009:** Pattern knowledge must explain when to use the pattern, when to avoid it, its
  composition, accessibility constraints, and related components and examples.
- **KNOW-010:** Review guidance must state verifiable checks rather than broad recommendations. A
  component's review checklist is its contract rules, each with a `must`, `should`, or `may` level.
- **KNOW-011:** A visual example must include the image, alternative text, a written description of
  the relevant design decisions, and relationships to the guidance it demonstrates.
- **KNOW-012:** Records must distinguish accepted guidance from drafts, deprecated guidance, and
  historical decisions.

### Retrieval and portability

- **KNOW-013:** A build must compile all configured sources into a self-contained knowledge bundle
  that does not require access to the source repository. A missing or unreadable configured source
  must fail the build. An existing empty source root is valid.
- **KNOW-014:** The build must emit plain Markdown, JSON, a manifest, a text-search index, and
  referenced visual assets.
- **KNOW-015:** Consumers must be able to search records, get a record by stable ID, list records
  using filters, and retrieve related records.
- **KNOW-016:** The compiled format and retrieval interface must not depend on MCP, Cursor, Claude,
  Blume, or another specific client.
- **KNOW-017:** The public bundle must be suitable for package publication or static hosting.
- **KNOW-018:** Bundle metadata must identify the knowledge version, design system version or source
  revision, schema version, and build time.

### Public and internal knowledge

- **KNOW-019:** Every record must declare `public` or `internal` visibility.
- **KNOW-020:** The compiler must produce a public bundle containing only public records. When
  internal content is configured, it must also produce an internal bundle containing both public
  and configured internal records. A public-only build must not leave a previous internal bundle.
- **KNOW-021:** Public bundle validation must fail when a public record references an internal
  record or asset.
- **KNOW-022:** Visibility controls bundle inclusion, not source-code security. Internal source
  material must live in a repository or input location with suitable access controls.

### Quality and maintenance

- **KNOW-023:** The build must fail for invalid records, duplicate IDs, duplicate asset IDs,
  unresolved relationships, missing assets, unreadable configured content, incompatible schema
  versions, or incomplete required metadata.
- **KNOW-024:** Generated records must be reproducible from their declared sources.
- **KNOW-025:** Tests must verify schema validation, visibility isolation, relationship integrity,
  deterministic output, and the retrieval interface.
- **KNOW-026:** Tool-specific skills and verification procedures may consume the bundle, but they
  must remain separate from portable design system knowledge.

### Delivery adapters

- **KNOW-027:** Delivery adapters must wrap the package retrieval interface instead of implementing
  their own knowledge parsing.
- **KNOW-028:** A local MCP adapter may be added after the package retrieval contract works.
- **KNOW-029:** A remote MCP or HTTP service may use the same compiled bundles and retrieval
  semantics without changing authored records.

## First release

The first release is one connected vertical slice:

- the Button component;
- an action hierarchy pattern;
- implementation guidance;
- a review checklist drawn from the contract rules;
- one committed and annotated screen example; and
- provenance linking the component to its token source and governing decisions.

The release is complete when:

1. The knowledge compiler validates and builds the slice.
2. Public output can be copied outside the repository and queried without source access.
3. `search`, `get`, `list`, and `related` return deterministic results.
4. The public output contains no internal records or unresolved references.
5. The documentation site consumes the authoritative records for facts included in the slice.
6. Automated tests cover the compiler and retrieval interface.

## Non-goals for the first release

- A remotely hosted MCP server
- Semantic or vector search
- A database or content management system
- Migrating all existing documentation
- Automatically interpreting unstructured screenshots
- Replacing package tests, accessibility tests, or design system audits
- Supporting every component and pattern before validating the first slice

## Open questions

- Which private repository or input location will own internal records?
- How will package versions map to knowledge versions after the first release?
