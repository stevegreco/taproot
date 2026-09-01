# Knowledge content model

**Status:** Draft

## Design goals

The content model must work as readable source material in Git, deterministic build input, and a
portable retrieval format. Narrative guidance uses Markdown. Facts that agents need to filter,
validate, or connect use structured metadata.

The model favors small records connected by explicit relationships over one large document. A
consumer can retrieve a focused answer and follow its relationships when it needs more context.

A compiled record can combine an authored Markdown record with structured domain sources. For
example, `component.button` gets its narrative guidance from the knowledge package and its API,
states, behavior, and accessibility contract from `button.spec.yaml`. The compiler records both
inputs and validates that they agree where their concerns overlap.

## Record types

### Component

The contract and usage guidance for a design system component. Structured component specifications
remain with the component package and feed these records.

Examples: Button, Badge.

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

Record types can add validated fields. For example, component records can include API and
accessibility contracts, while example records can include assets and annotations.

Guidelines intended for review can add structured `checks`. Each check has a stable ID, a level,
and one verifiable requirement. Example records can add structured `assets` and `annotations`.

## Executable contract

`packages/knowledge/src/schema/knowledge-record.schema.json` is the canonical authored-record
schema. It uses JSON Schema 2020-12 so non-JavaScript consumers can validate the same records.
Schema version `1` fixes the current field vocabulary and dotted ID format.

The package exports `parseRecord(markdown, { sourcePath })`. It parses YAML frontmatter, adds the
trimmed Markdown body, validates the complete authored record, and returns one flat object. Invalid
input throws a path-aware `KnowledgeRecordError`.

Authored records must include an `authored` source. They cannot declare the compiler-only
`generated` source kind. Unknown fields fail validation rather than passing through to compiled
output.

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

This is a proposed shape, not the final executable schema. Implementation may adjust field names
when validation and retrieval tests expose a better interface.

## Composed records

The Markdown record owns agent-facing narrative, discovery metadata, and relationships. Entries in
`sources` can instruct the compiler to augment that record:

- a `component-spec` source contributes the component API, anatomy, states, behavior,
  accessibility contract, and token contract;
- a `token-source` contributes token paths and aliases used by the record; and
- an `adr` contributes decision provenance and can later generate a separate decision record.

The compiler must define merge behavior for each source kind. It must reject conflicting values
instead of choosing one silently. Generated fields do not need to be repeated in Markdown.

## Relationships

Relationship names express why records connect. The initial vocabulary is:

- `uses` means the record depends on another component, pattern, or foundation.
- `demonstrates` links an example to the guidance or component it illustrates.
- `guides` links a pattern or guideline to the record it guides.
- `implements` links a record to a decision or contract it implements.
- `reviews` links a checklist to the records it checks.
- `supersedes` links a record to older guidance it replaces.
- `related` records a meaningful connection with no more precise relation.

The compiler validates targets and adds named reverse relationships to compiled output. For
example, the reverse of `demonstrates` is `demonstratedBy`, and the reverse of `reviews` is
`reviewedBy`. Authors should not maintain both directions manually.

## Provenance

A source entry identifies how a record was produced:

- `authored`: Markdown maintained directly as knowledge;
- `component-spec`: structured specification owned by the component package;
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

Public sources compile into the public bundle. An internal build can add records from a separately
configured private input and includes both public and internal records.

The compiler rejects:

- public records that reference internal records;
- public records that reference internal-only assets; and
- public output containing undeclared files.

Marking a committed file as internal does not make the source private. Access controls must protect
the source location itself.

## Compiled layout

The proposed output is:

```text
dist/
├── public/
│   ├── manifest.json
│   ├── records.json
│   ├── records.jsonl
│   ├── search-index.json
│   ├── markdown/
│   └── assets/
└── internal/
    └── ...
```

The manifest records the schema version, knowledge version, design system version or source
revision, build time, record counts, and content hashes.

## Source ownership

- `packages/tokens/` owns token values, token policy, and token ADRs.
- `packages/components/` owns component implementations and structured component contracts.
- `packages/knowledge/content/` owns cross-cutting patterns, guidelines, examples, and annotations.
- `apps/documentation/` owns presentation and imports knowledge instead of restating it.
- Tool-specific directories own agent procedures and verification workflows, not design system
  facts.
