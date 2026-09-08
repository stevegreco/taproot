# Component contract comparison and recommendations

- Analysis model: GPT-6, the model name available in the analysis session.
- Analysis date: 2026-09-06.
- Scope: Read-only review of the current component knowledge model against four external references. This document records findings and proposals, not accepted requirements or architectural decisions.
- Implementation status: No schema, component, binding, or compiler changes were made for this analysis. Tests were inspected, not run.

## Assessment

Keep the architecture and strengthen the component contract itself. The repository has a well-structured knowledge system for a small component library, but it does not yet express enough structured detail to reliably arbitrate implementation differences.

The main imbalance is precision about packaging, provenance, and record ownership alongside behavior and accessibility decisions that still require interpretation. Schema validation can prove that a record is well formed without proving that an implementation follows it.

The strongest existing decisions are component-owned portable contracts, separate host bindings, domain-owned tokens, strict validation, and portable compiled bundles. ADR 0003 remains a sound foundation. Button and Badge are a useful first slice, but they provide limited evidence about the model's suitability for complex components.

## Sources and review boundaries

The local review covered:

- [Knowledge requirements](../../knowledge/requirements.md)
- [Content model](../../knowledge/content-model.md)
- [ADR 0003: Component-owned portable contracts](../../adr/0003-component-owned-portable-contracts.md)
- [Portable contract schema](../../../packages/knowledge/src/schema/portable-contract.schema.json)
- [Host binding schema](../../../packages/knowledge/src/schema/host-binding.schema.json)
- [Semantic validation](../../../packages/knowledge/src/schema/validator.js)
- [Compiler agreement checks](../../../packages/knowledge/src/compile/corpus.js) and [compiler tables](../../../packages/knowledge/src/compile/tables.js)
- [Button](../../../packages/knowledge/content/components/button.md) and [Badge](../../../packages/knowledge/content/components/badge.md) component records
- [Button](../../../packages/knowledge/content/bindings/button.web-component.md) and [Badge](../../../packages/knowledge/content/bindings/badge.web-component.md) bindings
- [Button review guidance](../../../packages/knowledge/content/guidelines/button-review.md), component declarations and styles, and relevant knowledge and component tests

External sources were inspected as available on the analysis date. These projects are evolving, and this is a comparison of their published approaches, not an independent certification of their tooling or performance claims. Spektral's schema page was available through indexed search content after direct page retrieval failed.

| Reference | Main contribution | Assessment against our model |
| --- | --- | --- |
| [Design System Documentation Spec](https://designsystemdocspec.org/) and [schema](https://designsystemdocspec.org/schema) | Shared documentation, relationships, lifecycle metadata, and combination constraints | Useful as a potential interchange format. It would not replace our portable contract. The live version was 0.20.0, substantially newer than the 0.15.2 described in the Southleft article. |
| [Nathan Curtis: Component contracts and schemas](https://nathanacurtis.substack.com/p/component-contracts-and-schemas) | Typed decisions, normalization, platform independence, deterministic verification, and evolution | The most useful architectural benchmark. Our approach follows much of the philosophy, but the contract expresses less than those principles demand. |
| [Southleft: Use AI to Need Less AI](https://southleft.substack.com/p/use-ai-to-need-less-ai) | Deterministic enforcement after authoring | The useful lesson is the feedback loop that checks implementations against a contract. The linked [reference implementation](https://github.com/southleft/ds-contracts-poc) also explicitly documents unfinished capabilities. Its reported results should not be treated as independently verified evidence for our system. |
| [Spektral spec schema](https://spektral.design/docs/spec-schema/) | Interactions, composition, focus behavior, and announcements | Broader behavioral coverage than ours. Its examples still include web-specific types and executable-looking strings that should not be copied into a portable contract. |

## Recommended additions

### 1. Structured behavior and combination rules

Button lists states and says that disabled prevents activation. The current contract cannot express, in a machine-checkable way, which inputs cause activation, which conditions suppress it, or which states can coexist. Events have descriptions, while behavior is an array of strings.

Add declarative conditions and outcomes with stable rule IDs. For example, an activation request while disabled must emit no activation event. Conditions should reference declared parameters and states, with validation for unresolved references.

Do not force every component into one mutually exclusive state machine. Hover, focus, and disabled are different dimensions. Do not use JavaScript strings such as `setState('open')` as the portable representation of behavior.

This would strengthen KNOW-008 and KNOW-010.

### 2. Explicit token-to-anatomy mappings

Button identifies a component-token namespace, but the compiler connects variants and sizes largely through naming conventions. Badge declares no token source, so its exact semantic-token choices remain in its CSS. A consumer without repository access cannot reliably determine which token styles Badge's success background or which anatomy part receives a particular Button token.

Add references describing the anatomy part, visual property, applicable configuration, and token. Keep values in the token package. Badge does not need a component-token namespace to publish relationships to semantic tokens.

[Curtis's schema overview](https://www.specsplugin.com/schema/) provides a useful example of explicit connections between elements, configurations, and styles. Borrow that precision without adopting its entire layout model.

This would strengthen KNOW-002, KNOW-008, and KNOW-023.

### 3. Portable content and composition constraints

Portable anatomy currently supports a name, role, and description. Required content and accepted content types live in the web binding.

Whether a component requires a label, permits a decorative icon, or allows repeated children is a design decision that should survive a platform change. Put those constraints in the portable contract. Keep HTML slots and element names in bindings.

Existing `uses` relationships already cover basic dependencies. Extend the model only where placement, cardinality, or permitted child types require more detail.

This would strengthen KNOW-008 and KNOW-023.

### 4. Conformance checks connecting contracts to runtime tests

Binding agreement checks that anatomy, parameter, and event names match. That is useful but does not establish runtime agreement.

Connect stable contract requirement IDs to implementation tests. Start with parameter defaults, enum mappings, disabled activation, keyboard activation, and accessible naming. Preserve human review for contextual judgments, such as whether a label clearly describes its action.

The goal is a demonstrable failure when an implementation violates a declared requirement. A larger schema without that connection risks adding authoring cost without improving reliability. Conformance procedures should consume portable requirements while remaining separate from them, consistent with KNOW-026.

This would strengthen KNOW-010, KNOW-025, and KNOW-026.

### 5. Richer types and accessibility fields when a component needs them

Parameters currently support enum, boolean, and string. Events only have a description. A Slider or Select will need numeric constraints, structured values, or event payloads.

Add these alongside a real modeling need. For Dialog, investigate explicit initial focus, focus restoration, dismissal, and announcement requirements. Keep platform-specific spellings in bindings.

Do not add every field offered by the external systems in anticipation of future use. A Dialog and Select modeling exercise should establish which extensions are necessary.

## Recommended removals and simplifications

### Remove component naming assumptions from the generic compiler

The global size bridge recognizes only `sm → small` and `md → medium`. This makes a component naming convention into infrastructure policy. Explicit mappings should carry that knowledge and permit validation without a globally hardcoded size vocabulary.

### Reduce manually repeated normative guidance

Button variant meanings appear in both YAML and prose. Badge repeatedly states that it is not interactive. Some repetition helps readers, but manually maintained factual restatements can disagree.

Generate factual tables from structured fields where practical. Let prose contribute examples and reasoning. The concern is duplicated authorship, not deterministic projections of the same source.

### Use references for resolvable alternatives

`instead: Badge` should resolve to `component.badge`. Preserve a separate representation for general concepts such as a native link when no corresponding component record exists. Do not invent component records merely to satisfy a reference field.

### Make rationale optional

The contract schema requires `rationale` but permits an empty array. Require justification for consequential decisions through review policy rather than requiring every component to carry an empty container. Existing ADRs should remain authoritative for the decisions they own.

## Decisions to retain

- Keep component-owned contracts and separate host bindings.
- Keep token values and token policy with their domain owner.
- Keep strict validation and self-contained portable bundles.
- Keep Markdown authoring. YAML frontmatter has schema and semantic validation here; criticism of unvalidated Markdown does not automatically apply.
- Keep support for component records that do not yet publish a contract.
- Keep the current component record shape unless a larger component makes one-file review impractical, as already anticipated in ADR 0003.

## Proposed work items

These items are proposals for planning, not created issues or approved implementation scope. Update requirements, the content model, and ADRs with each accepted change rather than deferring architectural documentation until the end.

| Order | Work item | Deliverable and acceptance criteria | Requirements |
| --- | --- | --- | --- |
| 1 | Pressure-test the schema with Dialog and Select | Draft both contracts without implementing components. Identify what the current schema cannot express, what requires interpretation, and what belongs in bindings. Propose the smallest extensions supported by those examples. Clearly distinguish illustrative proposed fields from valid current-schema fields. | KNOW-008, KNOW-010 |
| 2 | Model behavior and accessibility requirements | Add stable rule IDs, declarative conditions and outcomes, state combinations, and focus or announcement requirements demonstrated by item 1. Validate references. Migrate Button's disabled and activation rules as the first working example. | KNOW-008, KNOW-010, KNOW-023 |
| 3 | Make visual token relationships explicit | Map anatomy parts and configurations to token references for Button and Badge. Validate references through the token package. Replace the hardcoded size bridge and naming assumptions while retaining domain ownership of values. | KNOW-002, KNOW-008, KNOW-023 |
| 4 | Extend portable content and API constraints | Move required content and accepted content types into portable anatomy. Add cardinality, parameter types, constraints, and event payloads only where item 1 demonstrates a need. Bindings retain platform spellings and implementation details. | KNOW-008, KNOW-023 |
| 5 | Prove runtime conformance to Button's contract | Connect contract rule IDs to runtime tests. Cover defaults, enum mappings, disabled behavior, keyboard activation, and accessible naming. Demonstrate that an intentional implementation mismatch fails the relevant check. Report automated coverage separately from human review requirements. | KNOW-010, KNOW-025, KNOW-026 |
| 6 | Simplify authoring and document the revised model | Replace resolvable alternative names with references, make rationale optional, and remove duplicated factual prose where documentation can render structured data. Complete authoring and migration guidance for accepted changes. | KNOW-004, KNOW-007, KNOW-023 |

### Dependencies and milestones

- Item 1 establishes the scope of the schema extensions.
- Items 2, 3, and 4 can proceed independently after item 1, with coordination where they touch shared schema files.
- Item 5 starts once item 2 provides stable rules.
- Documentation and schema migration notes accompany each change. Item 6 handles remaining authoring cleanup.

The recommended first milestone is items 1, 2, and 5. It establishes whether a richer contract catches implementation mistakes. Item 3 is the next strongest investment because it closes an existing portability gap for Badge.

### Deferred scope

Defer DSDS export, Figma generation, additional platform bindings, and a general layout schema until a concrete consumer needs them. None is necessary to prove the proposed contract improvements work.

The existing binding schema currently supports web components only. Separating portable intent from that binding is a useful architectural foundation, but it is not evidence that another platform has already been validated.
