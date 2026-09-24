# Knowledge content model

**Status:** Draft

## Design goals

The content model must work as readable source material in Git, deterministic build input, and a
portable retrieval format. Component records that publish a contract are authored as YAML specs.
Cross-cutting narrative guidance uses Markdown. Facts that agents need to filter, validate, or
connect use structured metadata.

The model favors small records connected by explicit relationships over one large document. A
consumer can retrieve a focused answer and follow its relationships when it needs more context.

A compiled record can combine an authored YAML or Markdown record with structured domain sources.
For example, `component.button` authors its host-neutral `contract` in `button.spec.yaml`. The
compiler copies authored fields verbatim, generates a compiled body from the contract when the
YAML file omits one, and composes each source kind into a reserved namespace. It does not
flat-merge source fields into `title`, `summary`, or `status` (KNOW-002, KNOW-008).

## Record types

### Component

The narrative hub for a design system component. Each component is authored as a
`components/<name>/<name>.spec.yaml` file that owns metadata, relationships, provenance, token
references, and the portable `contract`. That object has usage, optional content rules, anatomy, parameters, optional
configuration axes, events, states, behavior rules, accessibility, optional rationale, and optional
visual mappings. Usage entries have stable IDs, a `situation`, and optional `instead` and `why`.
Rules share a vocabulary with stable IDs, obligation levels (`must`, `should`, `may`), a statement,
and optional applicability, rationale, record references, and `examples.do` / `examples.avoid`.
IDs are unique within the contract. Rule `references` are dotted record IDs, not plain-language
alternatives such as Link. A mapping row names an anatomy
part, visual channel, configuration, state, and either a token name or a closed literal
(`transparent`, `inherit`, `none`). Token names may be semantic, primitive, or component. Media-query
axes such as `prefersReducedMotion` live in `configurationAxes`, not in the compiler. The
contract has no `tagName`, slots, parts, attribute spellings, or DOM types.
Host identity is not authored here. A later component may omit `contract` and may still be Markdown.

Examples: the records under `packages/knowledge/content/components/`.

### Binding

The authored host mapping for one platform. A binding `implements` a component. Its `host` is the
only object that may name a custom-element tag, FACE, slots, parts, or `HTMLFormElement`. Host
`behavior` is not part of the mapping schema; structured siblings such as `formAssociation` and
`focus` are the source of those host facts. Portable behaviors that those fields cannot express
belong on the component `contract.behavior` array.

Examples: `binding.button.web-component`, `binding.badge.web-component`.

### Pattern

Guidance for composing components and content to solve a recurring interface problem.

Examples: action hierarchy, form actions, status feedback.

### Guideline

A focused rule for design, implementation, or review. A guideline should be concrete enough to
apply or check.

Examples: label buttons with the resulting action, use semantic tokens by intent.

### Example

An annotated implementation or screen that demonstrates one or more records. Examples can be
positive, negative, or comparative.

### Foundation

Reference knowledge used across components and patterns.

Examples: color roles, typography roles, spacing, theming, token tier selection.

### Decision

An accepted or superseded architectural or design decision. Existing ADRs can generate decision
records without moving from their owning package.

## Required fields

Each compiled record has these fields:

- `id` is a stable, globally unique identifier.
- `schemaVersion` identifies the record schema.
- `type` is one of the defined record types.
- `title` is the human-readable name.
- `summary` is a short answer suitable for search results.
- `status` is `draft`, `accepted`, `deprecated`, or `superseded`.
- `visibility` is `public` or `internal`.
- `jobs` contains any of `design`, `implement`, and `review`.
- `tags` contains controlled discovery terms.
- `relations` contains typed links to other stable record IDs.
- `sources` contains authored or generated provenance.
- `body` contains the Markdown guidance.

Record types can add validated fields. For example, component records can include a portable
`contract` plus `tokenRef`, binding records include a `host` mapping, and example records can
include assets and annotations.

Guidelines intended for review can add structured `checks`. Each check has a stable ID, a level,
and one verifiable requirement. A guideline can add `docsSections` to name the `##` section, by
its heading anchor, that a documentation site shows for a page section. Today the only key is
`behavior`. The docs build fails when the anchor matches no heading, so renaming a heading cannot
silently drop that section. Example records can add structured `assets` and `annotations`.

## Executable contract

`packages/knowledge/src/schema/knowledge-record.schema.json` is the canonical authored-record
schema. It uses JSON Schema 2020-12 so non-JavaScript consumers can validate the same records.
Schema version `1` fixes the current field vocabulary and dotted ID format.

The package exports `parseRecord(markdown, { sourcePath })` for Markdown records and
`parseYamlRecord(yaml, { sourcePath })` for `*.spec.yaml` component records.
`parseAuthoredRecord(text, { sourcePath })` selects the parser from the path suffix. It does not
infer `id` or `type` from the filename. `parseRecord` parses YAML frontmatter, adds the
trimmed Markdown body, validates the complete authored record, and returns one flat object. YAML
specs omit `body`; the compiler generates compiled Markdown from the structured record.
Invalid
input throws a path-aware `KnowledgeRecordError`. Duplicate YAML keys fail. `sourcePath` is
provenance for the authored
source, not a format discriminator: the same Markdown bytes parse under `markdown/<id>.md` or an
authored
filename when identity frontmatter plus defaults satisfy the authored schema. Compiled Markdown is
still not a round-trip for `contract`, `host`, or `checks`. Identity-only frontmatter still
parses; `parseRecord` fills `schemaVersion`, `relations`, and `sources`.

The compiled-record schema is derived in memory from this authored schema at compile time. The
compiler clones the authored document, sets a new `$id`, and merges compiled-only fields. It does
not `$ref` the authored schema from a sibling file, because `unevaluatedProperties: false` would
reject those extra fields (KNOW-007, KNOW-023).

The derived schema retains the authored conditional definitions of `contract`, `host`, and
`tokenRef`. Extensions add only compiled fields and enriched source/asset definitions. Compilation
and retrieval use the same compiled-record validator; retrieval separately checks manifest/index
consistency (KNOW-008, KNOW-015, KNOW-023).

Authored records must declare exactly one `kind: authored` source. They cannot declare the
compiler-only `generated` source kind. Unknown fields fail validation rather than passing through
to compiled output. The authored schema stays `unevaluatedProperties: false`.

## Proposed authored format

Cross-cutting knowledge uses Markdown with YAML frontmatter. Component records that publish a
contract use YAML specs:

```text
packages/knowledge/content/components/
  <name>/<name>.spec.yaml
```

`parseRecord` fills `schemaVersion` as
`1`, empty `relations`, and an `authored` source path from the file. The compiler fills omitted
`visibility` from the content root that listed the file. Authors still write `id`, `type`, `title`,
`summary`, `status`, `jobs`, `tags`, and, for Markdown, `body`. YAML component specs omit `body`.
Folder names do not set `id` or `type`.

```markdown
---
id: pattern.action-hierarchy
type: pattern
title: Action hierarchy
summary: Choose button emphasis based on the relative importance and risk of each action.
status: draft
jobs:
  - design
  - implement
  - review
tags:
  - actions
  - buttons
relations:
  uses:
    - component.button
  guides:
    - component.button
---

Pattern guidance goes here.
```

The executable authored schema matches this shape. Retrieval may still change how consumers query
compiled records. It must not change these authored field names.

## Composed records

The Markdown record owns agent-facing narrative, discovery metadata, and relationships. Authored
fields are never overwritten by a domain source. Entries in `sources` compose into disjoint
namespaces:

- a component that publishes a portable contract authors `contract`;
- a `type: binding` record authors `host`;
- `token-source` fills `tokens.entries` with flattened DTCG leaves from the declared source path,
  never from `packages/tokens/dist/`;
- the component's authored `tokenRef` fills `tokens.tier`, `tokens.namespace`, and
  `tokens.description`;
- `adr` contributes a `kind: adr` source with path and revision. Design, implement, and review
  agents need that provenance so they can follow a compiled record to the domain-owned ADR. They
  do not need ADR prose copied into the knowledge bundle. Token ADR bodies remain in
  `packages/tokens`.

The pairing is both halves or neither. A component with no published component-token namespace
omits `tokenRef` and omits `kind: token-source` (token ADR 0003). It may still author `contract`
and leave `tokens` absent. There is no semantic-token source kind.

A binding `implements` exactly one component, and that component must already have `contract`.
Host anatomy names, parameters, and events are a bijection with the portable contract. Portable
anatomy names are unique. Enum parameters require `values`, and an enum default must name one of
those values. An enum parameter may add `examples`, a sample label for some or all values; each key
must name one of those values. Boolean and string parameters must not declare `values` or
`examples`, and a default must match
the declared kind. Each host parameter mapping names an attribute, a property, or both. An enum
`values` map on a host parameter, when present, covers every portable enum value.

Conflict is a closed list of cross-source assertions, not a general field-equality merge. The token
namespace must exist in the token file when a component publishes `tokenRef`. Components author
compact `contract.visuals` grouped by anatomy part and configuration axis. The compiler
expands that source into `contract.mappings` rows and omits `visuals` from compiled output.
`base` applies regardless of state. Nested `states` replace only the channels they name. Rest
values beside a nested `states` block compile as `state: default` when that name is in
`contract.states`. Bare values are published token names or the closed literals `transparent`,
`inherit`, and `none`. Unknown names fail as missing tokens. `base` and `states` are reserved
and cannot be parameter or axis names.

Mapping rows must name an anatomy part, a contract state when `state` is present, configuration
keys that are contract parameters or `configurationAxes` (for media-query axes such as
`prefersReducedMotion`), and a token name that exists in the token package or a closed literal.
Boolean configuration values are `"true"` or `"false"`. Duplicate rows that share part, channel,
configuration, and state are a conflict. Incomparable axis assignments for the same part and
channel are a conflict. YAML object order does not decide precedence.

`contract.states` is a vocabulary. Simultaneous states use `contract.stateResolution`: `suppress`
removes losers when the winner is active, `overlay` orders remaining interaction states, and
`independent` states still contribute. Button `disabled` suppresses `hover` and `pressed`.
`focus-visible` can combine with an enabled interaction state and with `disabled`.
`transition: none` replaces duration and easing for that configuration when resolved.
Compiled `visualCoverage` lists authored parts, axes, values, states, and channels, and names
uncovered parts and parameters so missing visuals are visible. Authoring `visualCoverage` is a
conflict. The compiler does not infer variant groups from
token paths and does not freeze a size-name bridge. Token names are checked against every
`*.tokens.json` file under `packages/tokens/src/tokens`. An extra size compiles when its mapping names a
published token. A mapped token missing from the token package fails the build. Sparse variants such
as `ghost` with no rest background token are authored as literals, not inferred. Authoring both
`visuals` and `mappings` is a conflict. See [ADR 0004](../adr/0004-compact-visual-authoring.md).

These are not conflicts, because they are different facts with different owners:

- record `summary` versus `contract.description`
- record `title` versus a host or token title
- record `status` versus ADR status

The compiler rejects a missing source, an unreadable source, a binding that is not a bijection, or
one of those token assertions (`source/conflict`) instead of choosing a value silently (KNOW-023).

The compiler does not generate `type: decision` records in this slice. KNOW-005 is satisfied by
`sources[]`. KNOW-006 still allows authored `type: decision` records. KNOW-024 constrains
generated records rather than requiring them.

## Relationships

Relationship names express why records connect. The initial vocabulary is:

- `uses` means the record depends on another component, pattern, or foundation.
- `demonstrates` links an example to the guidance or component it illustrates.
- `guides` links a pattern or guideline to the record it guides.
- `implements` links a binding to the component it implements, or a record to a decision it
  implements.
- `reviews` links a checklist to the records it checks.
- `supersedes` links a record to older guidance it replaces.
- `related` records a meaningful connection with no more precise relation. Prefer `guides` and
  `reviews` for guidance. Keep `related` for peers such as Button and Badge.

The compiler validates targets and adds named reverse relationships to compiled output. Reverse
names come from a frozen table. `uses` becomes `usedBy`, `demonstrates` becomes `demonstratedBy`,
`reviews` becomes `reviewedBy`, and the rest follow the same pattern. `related` is symmetric.

Backlinks are computed per visibility projection, not on the corpus. An internal record that `uses`
`component.button` must not appear in the public bundle as `component.button.backlinks.usedBy`
(KNOW-020, KNOW-021). Authors should not maintain reverse relationships manually.

The compiler resolves narrative links and images once using the Markdown syntax tree. It keeps
their record and asset targets as compilation metadata and uses those targets for visibility
checks. Code examples, plain text, and external URLs that happen to contain bundle paths are not
local references. Reference metadata does not become a field on compiled records (KNOW-021).
Raw HTML nodes are parsed for `href`, `src`, and `poster` attributes, including entity-encoded
values. These destinations use the same resolution and visibility checks. HTML can refer to
authored paths or existing bundle paths; unknown local destinations fail the build.

## Provenance

A source entry identifies how a record was produced:

- `authored`: Markdown or YAML maintained directly as knowledge;
- `token-source`: token definition or generated token artifact;
- `adr`: accepted decision owned by its domain package; or
- `generated`: deterministic output from another declared source.

An authored record declares exactly one `kind: authored` source. That path must be the file the
compiler is parsing. A second authored source is invalid. A missing or mismatched authored path
fails the build. Each compiled `revision` is a digest of the bytes at that entry's declared path.

A component's portable `contract` is authored in the component record. For YAML specs that is the
`.spec.yaml` file. Its provenance is that `kind: authored` source. There is no separate
contract-source field. Compiled `bodyOrigin` records whether the readable body was authored or
generated from the structured record.

Generated records include source paths and source revisions in their compiled metadata. The build
must not silently treat generated output as authored truth.

## Visual examples

An example asset has:

- a stable asset ID that is unique across the corpus;
- repository-relative source path;
- media type and dimensions;
- alternative text;
- a written annotation describing the decisions visible in the image;
- optional regions that associate part of an image with record IDs; and
- origin and revision information.

Text annotations are required because some consumers cannot inspect images. The image and its
annotation travel together in every bundle that includes the example.

## Visibility

Authored roots are `{ root, visibility }`. A record's declared visibility must match its root.
Public sources compile into the public bundle. An internal build can add records from a separately
configured private input and includes both public and internal records.

Source and asset paths are repository-relative. The compiler resolves each path and requires it
to stay inside an allowed root. Public records may read their public authored root and domain
token sources under `packages/tokens`. Internal records may read their configured private root
and the same domain token sources. `.`, `..`, absolute paths, and symlinks that leave those
roots fail the build. This does not replace access control on private roots (KNOW-022).

The compiler rejects:

- public records that reference internal records;
- public records that reference internal-only assets;
- paths that leave a record's allowed roots;
- an internal root that declares a public record;
- a missing or unreadable configured authored root;
- a listed record that cannot be read;
- two records that declare the same asset ID; and
- public output containing undeclared files.

An existing empty authored root is valid. The compiler does not treat a missing or unreadable
root as an empty corpus (KNOW-013, KNOW-023).

Marking a committed file as internal does not make the source private. Access controls must protect
the source location itself. The published package includes `dist/public` and `src`. It does not
include `dist/internal` (KNOW-017, KNOW-021).

## Compiled layout

The output is:

```text
dist/
├── public/
│   ├── manifest.json
│   ├── records.json
│   ├── search-index.json
│   ├── schema/
│   │   ├── knowledge-record.json
│   │   ├── compiled-knowledge-record.json
│   │   ├── portable-contract.json
│   │   └── host-binding.json
│   ├── markdown/
│   └── assets/
└── internal/   # only when internal content is configured
    └── ...
```

`schema/compiled-knowledge-record.json` is the derived compiled schema.
`schema/portable-contract.json` and `schema/host-binding.json` are the schemas those
artifacts `$ref`. A copied `dist/public` contains every schema needed to validate authored and
compiled records.

### Compiled view ownership

The compiler writes two views of each assembled record.

- Record view: `records.json` and `openCatalog().get(id)`. This is the only
  compiled owner of structured fields, including `contract`, `host`, `checks`, and `tokens`.
- Markdown view: `markdown/<id>.md`. Frontmatter is identity and discovery (`id`, `jobs`,
  `status`, `summary`, `tags`, `title`, `type`, `visibility`). The body is the rewritten
  narrative, authored for Markdown records and generated from the contract for YAML-only
  components. The file is not a round-trip for `parseRecord`. Record-view bodies keep
  bundle-root-relative destinations (`markdown/<id>.md`, `assets/...`) so documentation can rewrite
  them. Emitted Markdown files rewrite those same destinations relative to the containing file
  (`<id>.md`, `../assets/...`). Links to other records are narrative cross-references, not
  ownership of `contract`, `host`, or `checks`. `parseRecord` does not reject a `markdown/<id>.md`
  path; compiled Markdown that satisfies the authored schema parses, without structured fields.

`search-index.json` is an index over the record view. It is not a third record view.

The manifest `content` block records the schema version, compiled schema version, bundle
visibility, knowledge version, design system version, record count, and per-file hashes. The
digest hashes that block. Build time and git revision live in `manifest.build` and are not part
of the digest (KNOW-014, KNOW-018, KNOW-020, KNOW-024). `compiledSchemaVersion` is `7` because
compiled records carry `bodyOrigin` and contracts use structured usage IDs and rules. Bundles
whose compiled schema version is not 7 fail closed. Portable `specVersion` is 5. The compiler always projects the internal
bundle for validation and writes it only when internal content is configured. An internal bundle may contain only public
records; visibility is the declared projection, not a guess from record contents.

Consumers query a compiled bundle through `openCatalog` in
`@stevegreco/design-system-knowledge/retrieve`. `search`, `get`, `list`, and `related` read
`records.json`, `search-index.json`, and `manifest.json`. They do not change these authored field
names. The search index tokenizes `title`, `summary`, `tags`, `body`, and type-specific facts from
`contract`, `host`, and `checks`. It does not index `id`, `type`, or `jobs`.

Directory and in-memory catalog inputs must contain complete records conforming to the compiled
schema, including per-record versions and source revisions. Malformed records fail with
`KnowledgeBundleError` code `bundle-invalid` before queries can run. In-memory input skips file
hash verification, but does not skip record validation. Opening a catalog copies in-memory records
before freezing them, so the caller retains ownership of its original data (KNOW-015, KNOW-025).
Manifest schema-version checks precede per-record validation, so incompatible bundles report
`unsupported-schema-version`. Values that cannot be copied report `bundle-invalid`. Retrieval
loads the schema validator on demand and compiles it once per process. Directory bundles still
undergo record validation: matching manifest hashes establish file consistency, not proof that a
trusted compiler produced them.

### Compiler stages

`loadCorpusInputs` reads authored records, domain sources, and assets. `assembleCorpus` consumes
that data without further I/O or input mutation. It expands compact `visuals` into `mappings`,
assembles records, validates mapping and
namespace agreement, validates domain rules and relationships, and rewrites narrative references. `projectBundle`
computes visibility-specific backlinks and emits files; `writeBundle` performs output I/O.
The pure assembly stage can be tested with the same loaded inputs repeatedly (KNOW-023, KNOW-025).

## Source ownership

- `packages/tokens/` owns token values, token policy, and token ADRs.
- `packages/knowledge/content/components/` owns portable component contracts when a component
  publishes one.
- `packages/knowledge/content/bindings/` owns host bindings.
- `packages/components/` owns component runtime.
- `packages/knowledge/content/` owns cross-cutting patterns, guidelines, examples, and annotations.
- `apps/documentation/` owns presentation and imports knowledge instead of restating it.
- Tool-specific directories own agent procedures and verification workflows, not design system
  facts.
