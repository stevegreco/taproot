# RFC 0001: Component contract record shape

**Status:** Proposed
**Created:** 2026-09-02
**Discussion:** Not yet opened

## Summary

Decide whether a portable component contract should remain a separate `type: spec` record or belong
directly to its `type: component` record.

ADR 0002 currently defines three authored records for a component with one web-component host:

- `component.button` owns narrative guidance, discovery metadata, token references, and decisions;
- `spec.button` owns the portable contract; and
- `binding.button.web-component` owns the host mapping.

The compiler copies `spec.button.contract` onto `component.button`. Most consumers therefore
retrieve the component and never need the spec as a separate record. The split preserves a separate
contract diff, but it also duplicates record metadata and creates another result for search, list,
status, and relationship queries.

This RFC recommends putting the portable contract directly on the component record. Host bindings
would remain separate because a component can have more than one host implementation.

## Status of existing decisions

This proposal does not change the current system while its status is `Proposed`. ADR 0002 remains
accepted, and KNOW-002, KNOW-006, and KNOW-008 remain authoritative.

If this RFC is accepted, a new ADR must supersede the affected parts of ADR 0002. The same change
must update the requirements, content model, schema, compiler, records, tests, and agent guidance.

## Evidence

These facts describe the system as built today. They are the basis for the problem statement below.

- Every spec is a degree-one node in the compiled graph. `spec.button` and `spec.badge` each have
  `relations: {}` and a single backlink, `usedBy`, naming their one component. No pattern,
  guideline, or example references a spec.
- No consumer outside `packages/knowledge` reads a spec record. A search of `apps/` and `packages/`
  for `spec.button`, `spec.badge`, or `type: "spec"` returns no matches.
- `apps/documentation` enumerates `list({ type: "component" })` and reaches host details through
  `related()` to a binding. It reads `contract` from the component, which the compiler has already
  attached. It never retrieves a spec.
- `content/specs/button.md` is 20 lines of record metadata, 82 lines of contract, and a two-line
  body written only to satisfy `body` `minLength: 1`.

These facts can change. A named consumer that retrieves a spec independently would answer review
question 1 and weaken the case for Option B.

## Problem

The component and spec are conceptually distinct but do not yet have distinct operational lives.

`component.button` already receives the complete portable contract in compiled output. The authored
records also repeat facts, in two distinct ways.

Record metadata is duplicated because a spec is a record. Purpose, jobs, tags, status, and
visibility are authored twice for one component. Merging the records removes this duplication.

Narrative also restates the structured contract. The component body describes variants, behavior,
and accessibility guidance that the contract already carries, so `component.button` ships both
copies today. Merging the records relocates this duplication into one file rather than removing it.
It needs its own remedy under any option.

The separate spec record adds these costs for each component:

- authors coordinate component, spec, and binding records for one component change;
- every spec needs its own ID, title, summary, status, visibility, jobs, tags, relations, sources,
  and body;
- search and list return both a component and its contract for closely related queries;
- the compiler must attach the contract through a relation and preserve cross-record provenance; and
- component and spec statuses can disagree without representing a useful product state.

The split earns that cost only if a spec needs independent ownership, reuse, retrieval, or
lifecycle. The Button and Badge records do not currently demonstrate any of those needs.

## Goals

- Give each component fact one clear authored home.
- Keep portable contracts independent of web components, React, or another host.
- Keep `get("component.button")` sufficient for design, implementation, and review jobs.
- Support any number of host bindings without duplicating the portable contract.
- Reduce metadata, search, status, relationship, and provenance drift.
- Preserve readable diffs and practical review boundaries.

## Non-goals

- Move host-specific facts onto the component record.
- Move token values or token decisions out of `packages/tokens`.
- Change the retrieval operations `search`, `get`, `list`, or `related`.
- Decide how internal knowledge roots are stored.
- Merge patterns, guidelines, examples, or bindings into component records.

## Decision criteria

The chosen model should answer these questions with concrete behavior:

1. How many authored records must change for a normal component contract update?
2. Can a consumer retrieve complete portable component knowledge with one stable ID?
3. Can narrative and structured contract changes be reviewed without obscuring each other?
4. Does search return distinct concepts rather than two records for the same component?
5. Can the bundle identify the source and revision of every compiled field?
6. Can multiple platform bindings implement the same portable contract?
7. Does the model have a demonstrated need for an independent spec lifecycle?

Question 7 is decisive. A named current or planned consumer that retrieves a spec independently
defeats the recommendation below whatever the other answers are.

## Options

### Option A: Keep component and spec as separate records

This is the ADR 0002 model. A component `uses` one spec, and the compiler copies the spec contract
onto the compiled component.

Advantages:

- narrative and contract changes have separate files and diffs;
- consumers can search, list, retrieve, and relate specs independently; and
- a spec can have a status and relationship graph separate from its component.

Costs:

- every contract needs full record metadata and an agent-readable body;
- component and spec metadata can drift;
- ordinary searches can return both records for one concept;
- contract provenance requires a cross-record lookup or explicit copied provenance; and
- the compiler needs attachment and agreement rules that do not exist when the component owns the
  contract.

Choose this option only if independent spec retrieval or lifecycle is a real consumer requirement.

### Option B: Put the portable contract on the component record

`component.button` would author its host-neutral `contract` in frontmatter. A binding would continue
to `implement` the component and map portable names to one host.

Advantages:

- the authored and compiled component have the same contract owner;
- one ID returns the component narrative, contract, tokens, decisions, and relationships;
- component status, visibility, jobs, tags, and provenance apply to the whole portable component;
- search has one primary result for Button;
- contract rationale and declared sources sit on one record, closing the gap where `spec.badge`
  cites ADR 0003 in its rationale while `component.badge` is the record that declares that ADR as a
  source; and
- the compiler no longer copies contracts between records.

Costs:

- narrative and contract edits share one Markdown file;
- a large contract can make frontmatter cumbersome; and
- specs cannot be queried independently because they are no longer records.

This is the recommended option unless review finds a concrete consumer that needs specs as separate
records.

### Option C: Keep a separate contract source, but not a separate record

The component would reference a contract file under the knowledge package. The compiler would
compose that file into `component.button`, much as it composes token sources, without publishing
`spec.button`.

Advantages:

- contract and narrative retain separate files and diffs;
- retrieval and search still expose one component record; and
- host bindings remain separate.

Costs:

- the compiler needs another source contributor and source schema, reintroducing the kind of source
  ADR 0002 removed when it retired `component-spec`;
- the contract source is not independently searchable or retrievable;
- authors must coordinate two files even though consumers see one record; and
- generated provenance must identify the contract file and revision.

Choose this option if separate diffs matter enough to justify another source format but independent
spec retrieval does not.

## Comparison

| Question | Separate spec record | Contract on component | Separate contract source |
| --- | --- | --- | --- |
| Primary published records per component and host | 3 | 2 | 2 |
| Authored files per component and host | 3 | 2 | 3 |
| Component lookup | Attached contract | Direct contract | Composed contract |
| Contract has a separate search result | Yes | No | No |
| Narrative and contract use separate files | Yes | No | Yes |
| Duplicate record metadata | Yes | No | No |
| Narrative can restate the contract | Yes | Yes | Yes |
| Provenance | Spec relation or copied reference | Component source | Contract source revision |
| Multiple host bindings | Yes | Yes | Yes |
| Compiler work | Cross-record attachment | Direct validation | Source composition |

## Recommendation

Adopt Option B. Author the portable contract directly on the component record and keep each host
binding as a separate record.

A portable contract describes the component itself. Platform bindings describe implementations of
that component. The host-neutral boundary does not require the component and its contract to be
separate records.

The change is reversible. A contract authored on a component can be extracted back into a separate
record by the same composition machinery in reverse, so adopting Option B does not foreclose an
independent spec lifecycle if one is later demonstrated.

Option C is the fallback if maintainers find that contract-heavy frontmatter makes component
reviews hard to use. That concern should be tested with Button and one more complex component before
choosing another source format.

## Proposed model

The authored graph would be:

```text
component.button
  owns: narrative, contract, tokenRef, sources, relations
  implemented by: binding.button.web-component
  guided by: patterns and guidelines
  demonstrated by: examples

binding.button.web-component
  owns: tag name, registration, attributes, properties, events, slots, parts, FACE
  implements: component.button
```

`component.button.contract` would remain host-neutral. It could not contain tag names, attribute
spellings, slots, parts, FACE, DOM types, or framework-specific APIs. Those fields would remain
legal only under a binding's `host` object.

The same constraint would apply to the component body. `components/button.md` currently describes
`type="submit"`, a disabled ancestor `fieldset`, and focus forwarding to an inner native button in
prose, and the documentation site renders that section. Removing the spec record removes the
boundary that makes such prose legible as host content, so the rule has to cover narrative as well
as structure.

### Retrieval before and after

For Button, with Option B adopted:

| Call | Today | After |
| --- | --- | --- |
| `get("component.button")` | Narrative and attached contract | Same shape, contract authored in place |
| `get("spec.button")` | The contract record | `undefined` |
| `list({ type: "component" })` | `component.badge`, `component.button` | Unchanged |
| `list({ type: "spec" })` | Two records | `unknown-filter-value` once `spec` leaves the vocabulary |
| `search("button")` | Eight records, including `spec.button` | Seven, without the spec |
| `related("component.button")` | Seven neighbours, including `spec.button` | Six, without the spec |

## Requirement and decision impact

Acceptance would require these documentation changes:

- KNOW-002 would say portable component contracts are authored on component records in the knowledge
  package.
- KNOW-006 would no longer require `spec` as a record type unless another use case justifies it.
- KNOW-008 would continue to require structured component contracts.
- The content model would remove contract attachment through `relations.uses`.
- A new ADR would supersede the contract ownership and spec-record sections of ADR 0002.
- `AGENTS.md` would point to component records as the portable contract owner.

Token values and token ADRs would remain in `packages/tokens`. Component runtime would remain in
`packages/components`. Host bindings would remain in `packages/knowledge/content/bindings`.

## Implementation impact

An accepted implementation would need to:

1. Allow and require `contract` on component records that publish a portable contract.
2. Remove `spec` from the record vocabulary, unless the accepted decision preserves it for a defined
   independent use case.
3. Move Button and Badge contracts into their component records.
4. Remove the component-to-spec `uses` relations and the two standalone spec records.
5. Validate bindings directly against the component contract.
6. Remove compiler contract attachment and its conflict paths.
7. Preserve direct source revision provenance for the component contract.
8. Update documentation integration and search expectations.
9. Raise the compiled schema version to 3, following ADR 0002's precedent of bumping the compiled
   version while the authored `schemaVersion` stays 1. `src/retrieve/load.js` already rejects any
   bundle whose `compiledSchemaVersion` is not 2, so older bundles fail closed and no compatibility
   shim is needed.
10. Update tests for schema validation, binding agreement, retrieval, determinism, and package
    output.
11. Add a guard test that `spec` does not return to the record vocabulary, in the manner of
    `no-component-specs.test.js`, if the accepted decision removes it.

## Migration sketch

Button should be the migration test:

1. Copy `spec.button.contract` into `component.button.contract` without changing the contract
   fields.
2. Remove body statements that the contract now carries, so the merge does not import the narrative
   duplication described under Problem.
3. Keep `binding.button.web-component` unchanged except for any relation changes required by the
   accepted schema.
4. Remove `spec.button` and the component's `uses: [spec.button]` edge.
5. Compare the old and new compiled `component.button.contract` objects for equality.
6. Verify `get("component.button")`, search, list, related records, and documentation output.
7. Verify bundle-level results: the public record count drops by exactly one per migrated
   component, `related("component.button")` returns no spec neighbour, and the build stays
   deterministic across runs.
8. Repeat for Badge only after Button passes.

## Review questions

Reviewers should answer these questions and cite a consumer, workflow, or test where possible:

1. Does any current or planned consumer need to retrieve a spec independently from its component?
2. Can a portable contract be shared by multiple components without making those components the same
   conceptual component?
3. Does a spec need a status, visibility, job list, tags, or relationships that differ from its
   component?
4. Is one Markdown file containing narrative and structured contract practical for larger
   components?
5. Would a separate non-record contract source solve a demonstrated review problem?
6. Which option produces the clearest provenance for an agent with only the compiled bundle?
7. Is the reduced record count worth a schema and migration change before the first release?

## Decision process

- Review happens on the RFC pull request and its linked GitHub Discussion.
- Review comments should identify an option, evidence, and any required change.
- Acceptance requires a new ADR and coordinated updates to the requirements and content model.
- Rejection leaves ADR 0002 and the current records unchanged. This RFC should then record the
  reason and change its status to `Rejected`.
