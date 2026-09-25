# Knowledge architecture review and agent handoff

**Date:** 2026-09-04
**Status:** Review findings and proposed work. The review itself made no implementation changes;
items marked Done were implemented afterward.

## Purpose

The knowledge package should let maintainers author a fact once, validate it, and deliver enough
context for an agent to design, implement, or review UI outside this repository. Evaluate changes
against that job. A mechanism is not justified merely because an existing test requires it.

This document records an architecture review of `packages/knowledge` and its documentation
consumer. It is a handoff for follow-up work, not an accepted replacement for the requirements or
ADRs. Confirm each finding against the current checkout before implementing it. Resolve proposals
within the assigned task's scope; update affected requirements and decisions with implementation.

## Required reading and boundaries

Read these before changing the knowledge system:

1. [Requirements](requirements.md)
2. [Content model](content-model.md)
3. [ADR 0005: YAML component specs](../adr/0005-yaml-component-specs.md), which supersedes the
   authoring parts of ADR 0003 (added after this review)
4. [ADR 0003: Component-owned portable contracts](../adr/0003-component-owned-portable-contracts.md)
5. [ADR 0002: Knowledge-owned portable contracts](../adr/0002-knowledge-owned-portable-contracts.md),
   for the host-neutrality decision that ADR 0003 retains

Preserve these parts unless the assigned work explicitly revisits them:

- Component records own portable contracts; separate binding records own host mappings.
- Token values and token decisions remain authoritative in `packages/tokens`.
- Component runtime remains in `packages/components`.
- Stable IDs, provenance, schema validation, relationship validation, and visibility isolation
  support portability and remain useful.
- `get`, `list`, `search`, and `related` provide a small, protocol-independent retrieval interface.
- Documentation and delivery adapters consume authoritative records rather than authoring copies.

## Evidence at review time

- The build emitted eight public records and eight internal records, with no configured internal
  content. The record sets were the same; projection metadata and digests differed.
- `pnpm --filter @stevegreco/design-system-knowledge test` passed all 156 tests.
- The repository consumer search found documentation using `openCatalog`, with no non-test
  consumer of `records.jsonl`. This does not establish that external consumers do not exist.
- A separate filesystem check found a broken link in exported Button Markdown. The tests passed
  despite that defect.
- The review changed no source files. Passing tests establish current behavior, not that every
  architectural choice is necessary or that the exports satisfy every consumer job.

## Work items

### KR-01: Remove component-specific token policy from the compiler

**Priority:** First cleanup. **Requirements:** KNOW-002, KNOW-008, KNOW-023.
**Status:** Done. Portable `contract.mappings` authors the token relationship. `SIZE_BRIDGE`,
`assignGroup`, and `applyTokenGroups` are deleted. Mapping token names are validated against the
token package. Badge has no `tokenRef`. See issue #70.

Evidence:

- [`SIZE_BRIDGE`](../../packages/knowledge/src/compile/tables.js) hardcodes `sm → small` and
  `md → medium`.
- [`checkSourceAgreement`, `applyTokenGroups`, and `assignGroup`](../../packages/knowledge/src/compile/corpus.js)
  infer variant groups from token paths and reject sizes outside that fixed vocabulary.

The weak assumption is that all component contracts must follow Button's token organization.
Additional sizes, shared tokens, or another naming structure should not require compiler edits.

Proposed change: delete the global size bridge and inferred variant-group agreement rules. Retain
source readability and namespace-existence checks. Where a consumer needs variant-to-token or
size-to-token relationships, author explicit mappings and validate their targets. Check token-owned
ADRs before choosing that mapping's authored home. Avoid adding a generalized mapping framework
without a concrete consumer.

Completion evidence:

- A valid component with an additional size can compile without editing compiler constants.
- Missing explicitly referenced tokens still fail validation.
- Button and Badge retain their intended guidance and token provenance.
- The content model no longer requires the frozen size bridge or inferred group rules.

### KR-02: Repair Markdown links and decide what the export promises

**Priority:** Fix the demonstrated defect first; treat richer rendering as a separate change.
**Requirements:** KNOW-008, KNOW-010, KNOW-011, KNOW-013, KNOW-014, KNOW-017.

Evidence:

- [`resolveBodyUrl`](../../packages/knowledge/src/compile/corpus.js) produces bundle-root-relative
  destinations such as `markdown/pattern.action-hierarchy.md`.
- [`emitMarkdown`](../../packages/knowledge/src/compile/bundle.js) writes that body unchanged into
  a file already inside `markdown/`.
- It also omits structured `contract`, `host`, and `checks` fields, as current ADR 0003 specifies.

Reproduce the link defect after a build:

1. Open `packages/knowledge/dist/public/markdown/component.button.md`.
2. Find the action hierarchy link to `markdown/pattern.action-hierarchy.md`.
3. Resolve it relative to the containing directory. It points to
   `dist/public/markdown/markdown/pattern.action-hierarchy.md`, which does not exist.

Fix destinations relative to each emitted Markdown file. Keep the JSON body's URL convention
explicit, since the documentation consumer also rewrites those links. Do not globally change body
URLs without checking that consumer.

Separately, the review recommends a generated reading view that includes relevant structured
guidance. A Markdown-only consumer currently misses API contracts and structured review checks.
Rendering authoritative fields would not introduce a second authored owner. This recommendation
requires revisiting ADR 0003's narrative-only projection decision; it is not an existing requirement.

Completion evidence:

- Copy the public bundle outside the repository and verify local Markdown links and image paths
  against their actual containing files. Exercise record links, asset links, and fragments.
- Documentation's record-body links continue to work.
- If richer rendering is adopted, contract, binding, and review guidance is generated from the
  record fields, without a manually synchronized prose copy.

The link defect is closed by rewriting destinations relative to each emitted Markdown file while
keeping JSON / `get().body` bundle-root-relative for the documentation consumer. The generated
reading view remains deferred under ADR 0003.

### KR-03: Delete test-only ownership heuristics and redundant field bookkeeping

**Priority:** Small independent cleanup. **Requirements:** KNOW-007, KNOW-023, KNOW-025.

Evidence:

- [`findMarkdownFieldClaims`](../../packages/knowledge/src/compile/tables.js) uses regex proximity
  to infer ownership claims in prose. Only tests call it, but it ships with production code.
- `COMPILED_FIELD_VIEW` classifies every record field primarily to derive an export field list.
- [`parseRecord`](../../packages/knowledge/src/index.js) rejects input based on a
  `markdown/<id>.md` filename pattern.
- The [projection test](../../packages/knowledge/test/compile-narrative-projection.test.js)
  demonstrates that the same bytes parse successfully under an authored filename.

Proposed change: delete the prose-claim checker and tests of its regex behavior. Replace the full
field classification table with the exporter's explicit field list, removing unused derived helpers.
Remove the filename-based format rejection and document the actual parsing contract. If the task
requires distinguishing formats, use explicit format metadata rather than another path heuristic.

Completion evidence: retain tests of emitted fields and schema rejection of invalid input. Update
the content model's parser description. Keep ADR ownership guidance in documentation; do not try to
enforce its meaning with a prose regex.

KR-03 is done: `findMarkdownFieldClaims` and `COMPILED_FIELD_VIEW` are deleted. The Markdown
exporter lists identity frontmatter keys explicitly. `parseRecord` validates the authored schema
without a `markdown/<id>.md` path heuristic.

### KR-04: Reduce mandatory bundle outputs

**Priority:** After consumer inventory. **Requirements:** KNOW-014, KNOW-015, KNOW-017, KNOW-020,
KNOW-021, KNOW-024.
**Status:** Done. Internal bundles are written only when `internalContent` is configured.
`records.jsonl` is removed. `search-index.json` remains. KNOW-014 and KNOW-020 are updated. See
issue #76.

Evidence: [`compile`](../../packages/knowledge/src/compile/index.js) always projects and writes
both bundles. [`projectBundle`](../../packages/knowledge/src/compile/bundle.js) always emits JSON,
JSONL, Markdown, and a persisted search index.

Proposed change: generate the internal bundle only when internal content is configured. Remove
JSONL if the consumer inventory confirms no requirement for it. Update KNOW-014 and KNOW-020 with
those changes; their current wording explicitly requires the existing outputs.

Treat removal of the persisted search index as a later decision. Eight records do not demonstrate a
performance need. Building an index from records when opening a catalog could remove persisted
index versioning and consistency checks, but static consumers might need the file. Check the
package exports, in-memory `openCatalog` inputs, copied-bundle workflows, and expected corpus size.

Completion evidence:

- A public-only build produces no stale internal output, including after a previous internal build.
- Configured internal builds still include public and internal records and enforce isolation.
- Package publication still excludes internal content.
- Any index change preserves deterministic retrieval and tests search over structured facts.
- Document public export or bundle compatibility changes and adjust versions as needed.

### KR-05: Use a consistent compiled-record validation boundary

**Priority:** After deciding bundle shape. **Requirements:** KNOW-007, KNOW-023, KNOW-025, KNOW-027.

Evidence: authored records use JSON Schema, compilation validates a derived schema, and
[`loadBundle`](../../packages/knowledge/src/retrieve/load.js) manually checks only part of the
compiled record shape. The [documentation consumer](../../apps/documentation/lib/component-knowledge.ts)
adds further defensive shape checks.

Proposed change: share a compiled-record validator between compilation and retrieval. Keep bundle
integrity, cross-record relationships, and visibility checks separate. Remove manual record-shape
checks only where the shared validator replaces their guarantees. Documentation should retain its
own presentation requirements; schema validity alone does not guarantee that a record fits a page.

Completion evidence: malformed compiled records fail predictably for directory and in-memory
inputs; required metadata, visibility checks, and relationship integrity remain enforced. Assess
runtime dependency and initialization costs before adding AJV to the retrieval path.

### KR-06: Distinguish ADR provenance from portable decision content

**Priority:** Decide from consumer needs. **Requirements:** KNOW-002, KNOW-005, KNOW-006, KNOW-012,
KNOW-013, KNOW-024.
**Status:** Done. Provenance only. `decisions[]` is removed. `sources[]` keeps `kind: adr` with path
and revision. Design, implement, and review agents need that pointer, not ADR prose in the copied
bundle. Token ADRs remain in `packages/tokens`. See issue #77.

Evidence: the [ADR reader](../../packages/knowledge/src/compile/sources/adr.js) retains title,
status, path, and revision. It does not publish the decision's explanation. The content model
explicitly permits this metadata-only treatment for the current slice.

Proposed choice: if only provenance is needed, remove `decisions[]` enrichment and retain source
paths and revisions. If agents need to read the decisions, generate ordinary decision records from
domain-owned ADRs and link to them. Do not author another copy of token decisions in knowledge.
Do not build a general ADR publishing system merely to remove a small metadata object.

Completion evidence: identify the consumer job, update the content model and compiled schema as
needed, and verify provenance survives. If decision records are generated, verify their content,
status, revisions, relationships, and availability in a copied bundle.

## Suggested execution order

1. KR-02's link defect, with a consumer-level regression test.
2. KR-03's dead code and bookkeeping cleanup.
3. KR-01's token-policy cleanup.
4. Decide KR-02's reading-view scope and KR-04's required exports.
5. KR-05 against the chosen bundle shape.
6. KR-06 only after establishing whether decision content is needed.

Keep changes bounded. The work items overlap in `corpus.js`, `bundle.js`, schemas, and the content
model. When assigning work to separate agents, name the work item and coordinate those shared files.
Do not treat this document as a request to implement every proposal in one change.

## Verification and handoff expectations

Run the knowledge package tests for implementation changes:

```sh
pnpm --filter @stevegreco/design-system-knowledge test
```

Run the documentation consumer's relevant tests and build when changing record shapes, body links,
assets, or rendered guidance. Use the scripts in its current `package.json`. For export changes,
also verify a copied bundle without source access and package publication contents.

Each completed work item should report what was deleted, what became simpler, which KNOW-* IDs or
ADRs changed, the checks run, and any remaining compatibility implications. Preserve useful tests
of consumer behavior; replace tests that merely freeze a mechanism being deliberately removed.
