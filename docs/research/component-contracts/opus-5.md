# Component contract comparison and recommendations

- Analysis model: Opus 5, the model name available in the analysis session.
- Analysis date: 2026-09-07.
- Scope: Read-only review of the current component knowledge model against four external references. This document records findings and proposals, not accepted requirements or architectural decisions.
- Implementation status: No schema, content, binding, or compiler changes were made for this analysis. Source files and tests were read, not run.
- Companion analysis: [gpt-6.md](gpt-6.md) reviewed the same references on 2026-09-06. Agreements and one disagreement are recorded below.

## Assessment

Keep the architecture. The packaging, provenance, determinism, and projection layers are further along than three of the four references and should not be disturbed. The gap is inside the contract, and it has a single shape: fields that are typed at the container level but hold unstructured prose inside.

`states`, `behavior`, `accessibility.semantics`, and `checks[].requirement` are all valid against the schema and all unverifiable by a machine. `unevaluatedProperties: false` proves a record is well formed. It cannot prove that "Disabled prevents activation." is true of any implementation, or that a binding declaring `element: button` satisfies a contract declaring the string `"Button."`. Those are the seams where deterministic checking stops and inference restarts, which is precisely the boundary all four references are arguing about.

The second structural gap is that no path connects a configuration to a visual value. `tokenRef` names a namespace and compiled `tokens.entries` lists names, but nothing resolves `variant: danger` plus `state: pressed` plus `anatomy: control` to a token. A consumer can name the tokens and cannot use them.

## Sources and review boundaries

The local review covered:

- [Knowledge requirements](../../knowledge/requirements.md) and [content model](../../knowledge/content-model.md)
- [Knowledge README](../../knowledge/README.md) and [architecture review, 2026-09-04](../../knowledge/architecture-review-2026-09-04.md)
- [Authored record schema](../../../packages/knowledge/src/schema/knowledge-record.schema.json), [portable contract schema](../../../packages/knowledge/src/schema/portable-contract.schema.json), [host binding schema](../../../packages/knowledge/src/schema/host-binding.schema.json), and [compiled extensions](../../../packages/knowledge/src/schema/compiled-extensions.js)
- [Compiler entry](../../../packages/knowledge/src/compile/index.js) and [bundle projection](../../../packages/knowledge/src/compile/bundle.js)
- [Retrieval interface](../../../packages/knowledge/src/retrieve/index.js)
- [Button](../../../packages/knowledge/content/components/button.md) and its [web-component binding](../../../packages/knowledge/content/bindings/button.web-component.md)

External sources were read on the analysis date through page retrieval. These projects are evolving; this compares published approaches and does not certify their tooling or performance claims.

| Reference | Main contribution | Assessment against our model |
| --- | --- | --- |
| [Design System Documentation Spec](https://designsystemdocspec.org/) | A versioned, public interchange schema for docs, tokens, themes, and components, with per-section audience targeting (`for: human \| agent \| all`) | Useful as an export target, not as a replacement. Our record-level `jobs` is a better factoring than audience type, because a human and an agent performing a review need the same content. |
| [Nathan Curtis: Component contracts and schemas](https://nathanacurtis.substack.com/p/component-contracts-and-schemas) | Seven principles, and a Components to Props to Variants to Elements to Styles resolution model | The strongest benchmark. We satisfy platform independence, determinism, and governance. We fail "well-typed over loosely formed" inside several fields, and we have no equivalent of the Elements to Styles layer. |
| [Southleft: Use AI to Need Less AI](https://southleft.substack.com/p/use-ai-to-need-less-ai) | Author once with a model, then enforce mechanically; authority belongs to the layer that can refuse deterministically | Largely an argument for the architecture already built here. Its enthusiasm for MCP should not pull adapter work ahead of the contract gaps below. |
| [Spektral spec schema](https://spektral.design/docs/spec-schema/) | Behavioral breadth: trigger and guard and effect interactions, composition, structure with slots, explicit ARIA modeling | Broader behavior coverage than ours. It has no host binding layer, so its examples mix platform-specific spellings into the spec. Borrow the behavioral modeling, not the layering. |

## Where the current model already leads

Recorded so that the gap list does not prompt over-correction.

| Capability | Here | DSDS | Curtis | Spektral | Southleft |
| --- | --- | --- | --- | --- | --- |
| Host-neutral contract with a separate binding record | Implemented | No | Argued | No | Argued |
| Provenance with per-source revision pinning | Implemented | No | No | No | No |
| Byte-deterministic compile, hash-verified on open | Implemented | No | Claimed | No | Argued |
| Architectural decisions compiled as first-class data | Implemented | No | Discussed | No | No |
| Visibility projection with leak detection | Implemented | No | No | No | No |
| Protocol-independent retrieval, MCP deferred | Implemented | No | No | No | Argued |

The `sources[]`-plus-`revision` model and the public and internal projection have no counterpart in any of the four references.

## Recommended additions

### 1. Authored token relationships for configuration and state

Nothing connects a parameter value or a state to a token. This is the one functional capability Curtis's model has that ours does not.

The [2026-09-04 architecture review](../../knowledge/architecture-review-2026-09-04.md) item KR-01 correctly proposes removing `SIZE_BRIDGE` and the variant-group inference in `corpus.js`, which currently derive that relationship from token path naming. Sequence the replacement with the removal. Deleting inference without adding an authored mapping removes the only linkage that exists today, implicit though it is. Authoring the fact and validating the reference is Curtis's determinism principle applied literally.

Values stay in `packages/tokens`. Badge does not need a component-token namespace to declare relationships to semantic tokens.

Strengthens KNOW-002, KNOW-008, KNOW-023.

### 2. Typed states and behavior

```yaml
states: [default, hover, pressed, focus-visible, disabled]
behavior:
  - Disabled prevents activation.
```

Both are arrays of prose in a structure that claims to arbitrate. Neither can be validated, diffed usefully, or generated from.

Model states as objects carrying a trigger, the anatomy part they apply to, and mutual exclusions. Model behavior as given, when, and then triples with stable rule IDs. Those triples are directly executable as conformance tests, which is where a richer contract begins to pay for itself.

Hover, focus, and disabled are independent dimensions. Do not collapse every component into one mutually exclusive state machine, and do not adopt Spektral's executable-looking effect strings as the portable representation.

Strengthens KNOW-008, KNOW-010.

### 3. Role-typed accessibility

`accessibility.semantics` is the string `"Button."`. The binding declares `element: button`. Nothing can check that those agree, so the central accessibility claim of the contract is unverified.

Replace the prose with a role token and a structured ARIA attribute map, which lets the compiler check a binding against the contract it claims to implement. The same applies to `accessibility.requirements[]`: "Icon-only buttons have an accessible name" is a real constraint expressed as a sentence, even though `parameters.accessibleName` and `anatomy.content` already exist to make it checkable.

Strengthens KNOW-008, KNOW-010.

### 4. Portable content constraints

`portableContract.anatomyPart` holds a name, role, and description. The host binding holds `required: true` and `accepts: [text, decorative-icon, text-and-decorative-icon]`.

Whether Button's content is required, and whether it admits a decorative icon, is host-neutral. It leaked into the web-component layer, which inverts the host-neutrality decision in ADR 0002. Move `required` and `accepts` into `anatomy` and leave the binding mapping only the mechanism, such as `slot: default`.

Strengthens KNOW-008, KNOW-023.

### 5. Per-field deprecation

`status` is record-level and `specVersion` is `const 2` for the whole schema. There is no way to retire one enum value or rename one parameter short of a schema-wide version bump, so every rename presents to consumers as a breaking release with no migration signal.

Add an optional `deprecated` object carrying `since`, `replacement`, and a note to `parameter`, to individual `values` entries, and to `event`. Add this before there are external consumers rather than after. This is Curtis's evolution principle, which none of our current mechanisms serve.

Strengthens KNOW-007, KNOW-012.

### 6. Checks that reference contract fields

`check {id, level, requirement}` on guideline records is ahead of all four references: a review rubric with stable IDs and error and warning severity. Because `requirement` is prose, evaluation still falls to a model.

Adding an optional pointer from a check into a component contract path turns a subset of checks into machine-evaluable assertions and removes the model from that part of the review path. Keep human review for contextual judgments such as whether a label describes its result. The companion analysis reaches the same place from the runtime side; see the note under Agreement below.

Strengthens KNOW-010, KNOW-025, KNOW-026.

### 7. Parameter types, added when a component needs them

`parameter.kind` supports enum, boolean, and string, with no numeric kind and no way to mark a parameter conditionally required. Button and Badge do not need more. A component with `maxLines`, `columns`, or a numeric constraint does, and under the current model adding a kind is a schema version bump. Establish the necessary set from a real modeling exercise rather than adopting every field the external systems offer.

Strengthens KNOW-008.

### 8. Body structure validation

Record bodies are free Markdown with no validated structure. The 2026-09-04 review found a broken link in exported Button Markdown that the full test suite did not catch. Validating that intra-body links resolve to record IDs or bundled assets is a small compile check against a defect already observed in output.

Strengthens KNOW-014, KNOW-023, KNOW-025.

## Recommended simplifications

- **Remove component naming policy from the generic compiler.** `SIZE_BRIDGE` hardcodes `sm` to `small` and `md` to `medium`, making one library's naming convention into infrastructure. Covered by KR-01 and by item 1 above.
- **Resolve alternatives to record references.** `instead: Badge` should resolve to `component.badge` and be validated. Keep a separate representation for concepts such as a native link, and do not invent records to satisfy the field.
- **Make `rationale` optional.** It is required but may be empty, so it currently guarantees a container rather than a justification. Require justification for consequential decisions through review policy, with ADRs authoritative for the decisions they own.

## Decisions to retain

- Component-owned portable contracts with separate host bindings.
- Token values and token policy owned by `packages/tokens`.
- Strict validation, deterministic compilation, and self-contained bundles.
- Markdown authoring with schema-validated frontmatter. Curtis's "verifiable over readable" argument targets Markdown used as the contract. Ours is not; the frontmatter is validated YAML and the body is separate narrative.
- Deferring the MCP adapter, per KNOW-016 and KNOW-028. Southleft's argument supports this: an adapter should be a thin consumer of `openCatalog` and never the source.
- Record-level `jobs` in preference to DSDS's audience targeting. The residual gap is only that `jobs` is not expressible per body section.

## Agreement with the companion analysis

[gpt-6.md](gpt-6.md) and this review independently reach the same conclusions on structured behavior, explicit token-to-anatomy mapping, portable content constraints, richer parameter types, removal of the size bridge, resolvable `instead` references, and optional `rationale`. Two analyses converging on those without shared context is reasonable evidence they are real.

This review adds per-field deprecation (item 5) and body structure validation (item 8), neither of which the companion covers. The companion's runtime conformance item is the stronger form of item 6 here and should absorb it: connecting contract rule IDs to runtime tests demonstrates a failure on mismatch, which a static pointer alone does not.

One disagreement. The companion defers DSDS export on the grounds that no concrete consumer needs it. That reasoning is sound and the recommendation here is still to do it early, because the cost is asymmetric: `projectBundle` already emits five views of the same record, a sixth emitter changes no schema and creates no authoring burden, and a projection can be deleted if it goes unused. Weigh it as cheap optionality rather than as a feature, and drop it if it competes for the same review attention as items 1 through 3.

## Proposed work items

Proposals for planning, not created issues or approved scope. Update requirements, the content model, and ADRs with each accepted change.

| Order | Work item | Deliverable and acceptance criteria | Requirements |
| --- | --- | --- | --- |
| 1 | Validate body links at compile time | Compile fails when an intra-body link does not resolve to a record ID or a bundled asset. Reproduce the known broken Button link as a failing case first. | KNOW-014, KNOW-023, KNOW-025 |
| 2 | Pressure-test the schema against a complex component | Draft a Dialog or Select contract without implementing it. Record what the schema cannot express, what needs interpretation, and what belongs in the binding. Mark proposed fields distinctly from valid current fields. | KNOW-008, KNOW-010 |
| 3 | Type states, behavior, and accessibility | One `specVersion: 3` change covering items 2, 3, and 5 above: stable rule IDs with declarative conditions, state dimensions, a role-typed accessibility block, and per-field deprecation. Validate every reference. Migrate Button's disabled and activation rules as the first example. | KNOW-007, KNOW-008, KNOW-010, KNOW-012 |
| 4 | Make token relationships explicit | Map anatomy parts and configurations to token references for Button and Badge, validated against the token package. Remove the size bridge and naming inference in the same change. | KNOW-002, KNOW-008, KNOW-023 |
| 5 | Move content constraints into the portable contract | `required` and `accepts` move from binding anatomy to portable anatomy. Bindings retain slot names and element spellings. Add cardinality only where item 2 shows a need. | KNOW-008, KNOW-023 |
| 6 | Prove runtime conformance | Connect contract rule IDs from item 3 to runtime tests covering defaults, enum mappings, disabled activation, keyboard activation, and accessible naming. An intentional implementation mismatch must fail. Report automated coverage separately from human review. | KNOW-010, KNOW-025, KNOW-026 |
| 7 | Emit a DSDS projection | `dist/public/dsds.json` alongside the existing views, with no schema or authoring change. See the disagreement recorded above; drop this if it competes with items 3 and 4. | KNOW-014, KNOW-017 |

### Dependencies and milestones

- Item 1 is independent and can land immediately.
- Item 2 sets the scope for items 3, 4, and 5.
- Items 4 and 5 can proceed in parallel with item 3 where they touch different schema regions.
- Item 6 starts once item 3 provides stable rule IDs. Items 3 and 6 together are the milestone that determines whether a richer contract actually catches implementation mistakes.

### Deferred scope

Defer Figma generation, additional platform bindings, a layout schema, and section-level `jobs` until a consumer needs them. The binding schema supports web components only; separating portable intent from that binding is a sound foundation, not evidence that a second platform has been validated.
