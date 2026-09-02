# Knowledge content model

**Status:** Draft

## Design goals

The content model must work as readable source material in Git, deterministic build input, and a
portable retrieval format. Narrative guidance uses Markdown. Facts that agents need to filter,
validate, or connect use structured metadata.

The model favors small records connected by explicit relationships over one large document. A
consumer can retrieve a focused answer and follow its relationships when it needs more context.

A compiled record can combine an authored Markdown record with structured domain sources. For
example, `component.button` gets its narrative guidance from the knowledge package and its
parameters, events, states, behavior, and accessibility contract from the spec it `uses`. The
compiler copies authored fields verbatim and composes each source kind into a reserved namespace.
It does not flat-merge source fields into `title`, `summary`, or `status` (KNOW-002, KNOW-008).

## Record types

### Component

The narrative hub for a design system component. When a portable contract exists, the component
`uses` exactly one spec. The compiler copies that spec's `contract` onto the compiled component.
Host identity is not authored here.

Examples: Button, Badge.

### Spec

The authored home of a host-neutral component contract. A spec's `contract` has usage, anatomy,
parameters, events, states, behavior, accessibility, and rationale. It has no `tagName`, slots,
parts, attribute spellings, or DOM types.

Examples: `spec.button`, `spec.badge`.

### Binding

The authored host mapping for one platform. A binding `implements` a component. Its `host` is the
only object that may name a custom-element tag, FACE, slots, parts, or `HTMLFormElement`.

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

Record types can add validated fields. For example, spec records include a portable `contract`,
binding records include a `host` mapping, component records can include a copied `contract` plus
`tokenRef`, and example records can include assets and annotations.

Guidelines intended for review can add structured `checks`. Each check has a stable ID, a level,
and one verifiable requirement. Example records can add structured `assets` and `annotations`.

## Executable contract

`packages/knowledge/src/schema/knowledge-record.schema.json` is the canonical authored-record
schema. It uses JSON Schema 2020-12 so non-JavaScript consumers can validate the same records.
Schema version `1` fixes the current field vocabulary and dotted ID format.

The package exports `parseRecord(markdown, { sourcePath })`. It parses YAML frontmatter, adds the
trimmed Markdown body, validates the complete authored record, and returns one flat object. Invalid
input throws a path-aware `KnowledgeRecordError`.

The compiled-record schema is derived in memory from this authored schema at compile time. The
compiler clones the authored document, sets a new `$id`, and merges compiled-only fields. It does
not `$ref` the authored schema from a sibling file, because `unevaluatedProperties: false` would
reject those extra fields (KNOW-007, KNOW-023).

Authored records must include an `authored` source. They cannot declare the compiler-only
`generated` source kind. Unknown fields fail validation rather than passing through to compiled
output. The authored schema stays `unevaluatedProperties: false`.

## Proposed authored format

Cross-cutting knowledge uses Markdown with YAML frontmatter:

```markdown
---
id: pattern.action-hierarchy
schemaVersion: 1
type: pattern
title: Action hierarchy
summary: Choose button emphasis based on the relative importance and risk of each action.
status: draft
visibility: public
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
sources:
  - kind: authored
    path: packages/knowledge/content/patterns/action-hierarchy.md
---

Pattern guidance goes here.
```

The executable authored schema matches this shape. Retrieval may still change how consumers query
compiled records. It must not change these authored field names.

## Composed records

The Markdown record owns agent-facing narrative, discovery metadata, and relationships. Authored
fields are never overwritten by a domain source. Entries in `sources` compose into disjoint
namespaces:

- a `type: spec` record authors `contract`;
- a `type: binding` record authors `host`;
- `token-source` fills `tokens.entries` with flattened DTCG leaves from the declared source path,
  never from `packages/tokens/dist/`;
- the component's authored `tokenRef` fills `tokens.tier`, `tokens.namespace`, and
  `tokens.description`;
- `adr` fills `decisions[]` with title, status, path, and revision.

After every record is assembled, the compiler copies `spec.contract` onto each component that
`uses` exactly one spec. It does not copy the spec's `title`, `summary`, or `status`. Among a
component's `uses` targets, at most one may be a spec. Other `uses` targets stay legal.

The pairing is both halves or neither. A component with no published component-token namespace
omits `tokenRef` and omits `kind: token-source` (ADR 0003). The compiler still copies `contract`
from the spec it uses and leaves `tokens` absent. There is no semantic-token source kind.

A binding `implements` exactly one component, and that component must already have `contract`.
Host anatomy names, parameters, and events are a bijection with the portable contract. An enum
`values` map on a host parameter, when present, covers every portable enum value.

Conflict is a closed list of cross-source assertions, not a general field-equality merge. The token
namespace must exist in the token file. When `tokens.tier` is `component`, every contract
`parameters.variant` value must have at least one token entry, and a token group that names no
spec variant is a conflict. Spec size values and token `size.*` keys must appear in the frozen
`sm`/`small` and `md`/`medium` bridge. Unknown keys fail the build. A mapped size with no token
leaves is allowed, as is a sparse variant such as `ghost` with no rest background.

These are not conflicts, because they are different facts with different owners:

- record `summary` versus spec `contract.description`
- record `title` versus spec `title`
- record `status` versus ADR status

The compiler rejects a missing source, an unreadable source, two specs on one component, a binding
that is not a bijection, or one of those token assertions (`source/conflict`) instead of choosing a
value silently (KNOW-023).

The compiler does not generate `type: decision` records in this slice. KNOW-005 is satisfied by
enriched `sources[]` plus `decisions[]`. KNOW-024 constrains generated records rather than requiring
them.

## Relationships

Relationship names express why records connect. The initial vocabulary is:

- `uses` means the record depends on another component, pattern, foundation, or spec.
- `demonstrates` links an example to the guidance or component it illustrates.
- `guides` links a pattern or guideline to the record it guides.
- `implements` links a binding to the component it implements, or a record to a decision it
  implements.
- `reviews` links a checklist to the records it checks.
- `supersedes` links a record to older guidance it replaces.
- `related` records a meaningful connection with no more precise relation.

The compiler validates targets and adds named reverse relationships to compiled output. Reverse
names come from a frozen table. `uses` becomes `usedBy`, `demonstrates` becomes `demonstratedBy`,
`reviews` becomes `reviewedBy`, and the rest follow the same pattern. `related` is symmetric.

Backlinks are computed per visibility projection, not on the corpus. An internal record that `uses`
`component.button` must not appear in the public bundle as `component.button.backlinks.usedBy`
(KNOW-020, KNOW-021). Authors should not maintain reverse relationships manually.

## Provenance

A source entry identifies how a record was produced:

- `authored`: Markdown maintained directly as knowledge;
- `token-source`: token definition or generated token artifact;
- `adr`: accepted decision owned by its domain package; or
- `generated`: deterministic output from another declared source.

Generated records include source paths and source revisions in their compiled metadata. The build
must not silently treat generated output as authored truth.

## Visual examples

An example asset has:

- a stable asset ID;
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
- an internal root that declares a public record; and
- public output containing undeclared files.

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
│   ├── records.jsonl
│   ├── search-index.json
│   ├── schema/
│   │   ├── knowledge-record.json
│   │   └── compiled-knowledge-record.json
│   ├── markdown/
│   └── assets/
└── internal/
    └── ...
```

`schema/compiled-knowledge-record.json` is the derived compiled schema. `markdown/<id>.md` carries
reduced frontmatter plus the rewritten body. It is not a round-trip format for `parseRecord`.

The manifest `content` block records the schema version, knowledge version, design system version,
record count, and per-file hashes. The digest hashes that block. Build time and git revision live
in `manifest.build` and are not part of the digest (KNOW-014, KNOW-018, KNOW-024).

Consumers query a compiled bundle through `openCatalog` in
`@stevegreco/design-system-knowledge/retrieve`. `search`, `get`, `list`, and `related` read
`records.json`, `search-index.json`, and `manifest.json`. They do not change these authored field
names.

## Source ownership

- `packages/tokens/` owns token values, token policy, and token ADRs.
- `packages/knowledge/content/specs/` owns portable component contracts.
- `packages/knowledge/content/bindings/` owns host bindings.
- `packages/components/` owns component runtime.
- `packages/knowledge/content/` owns cross-cutting patterns, guidelines, examples, and annotations.
- `apps/documentation/` owns presentation and imports knowledge instead of restating it.
- Tool-specific directories own agent procedures and verification workflows, not design system
  facts.
