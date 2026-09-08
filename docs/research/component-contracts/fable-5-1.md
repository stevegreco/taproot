# Component contract comparison and recommendations

- Analysis model: Fable 5.1, the model name available in the analysis session.
- Analysis date: 2026-09-07.
- Scope: Read-only review of the current component knowledge model against four external references. This document records findings and proposals, not accepted requirements or architectural decisions.
- Implementation status: No schema, content, binding, compiler, or component changes were made for this analysis. Source files, runtime code, CSS, and tests were read, not run.
- Companion analyses: [gpt-6.md](gpt-6.md) (2026-09-06) and [opus-5.md](opus-5.md) (2026-09-07) reviewed the same references. This review deliberately reads two inputs neither companion opened: the component runtime and stylesheets in `packages/components`, and the runtime tests. Agreements, additions, and one tiebreak are recorded below.

## Assessment

Keep the architecture. The gap is not that the contract is thin. The gap is that the contract is thin in exactly the place where the running code is rich, and rich in exactly the place where the running code is silent.

Compared with the Southleft proof of concept, our contract is the mirror image. Theirs records only canvas-expressible facts: props, anatomy, token bindings per visual channel, and states. It deliberately excludes behavior. Ours records usage, behavior, keyboard, and accessibility, and says nothing about which token paints which part under which configuration. The stylesheet in `button.css` is the real visual contract today. It holds design decisions that exist nowhere in the token file or the knowledge record:

- Secondary and ghost buttons have a transparent disabled background rather than the disabled token.
- Ghost has a transparent rest background and border, so the "sparse variant" the content model tolerates is a decision, not an omission.
- Secondary border does not change on hover or press; it reuses the default border token.
- Transitions are removed under `prefers-reduced-motion`.

None of these can be retrieved by a consumer of the compiled bundle. A designer building the Figma counterpart, or an agent writing a second host, would have to guess or read CSS. That is the single most concrete portability failure in the current model, and it is a stronger example than the general "no token mapping" finding both companions reached.

The second finding is a normalization problem, which Curtis names as the property that lets a contract arbitrate. The same design rule is currently authored in up to five places. "The label describes the result of the action" appears in the Button contract's accessibility requirements, the Button body, the implementation guideline, the action hierarchy pattern, and the review check `button-review-label`. "Danger is only for destructive or difficult-to-reverse actions" appears in the variant description, the body, the pattern, and the review check `button-review-danger`. Each copy is hand-written prose, so any two can drift, and a consumer has no way to know which one wins.

## Sources and review boundaries

The local review covered:

- [Knowledge requirements](../../knowledge/requirements.md), [content model](../../knowledge/content-model.md), and the [2026-09-04 architecture review](../../knowledge/architecture-review-2026-09-04.md)
- [ADR 0002](../../adr/0002-knowledge-owned-portable-contracts.md) and [ADR 0003](../../adr/0003-component-owned-portable-contracts.md)
- [Authored record schema](../../../packages/knowledge/src/schema/knowledge-record.schema.json), [portable contract schema](../../../packages/knowledge/src/schema/portable-contract.schema.json), [host binding schema](../../../packages/knowledge/src/schema/host-binding.schema.json), and [semantic validation](../../../packages/knowledge/src/schema/validator.js)
- [Compiler tables](../../../packages/knowledge/src/compile/tables.js) and the agreement checks in [corpus.js](../../../packages/knowledge/src/compile/corpus.js)
- [Button](../../../packages/knowledge/content/components/button.md) and [Badge](../../../packages/knowledge/content/components/badge.md) records, both [web-component bindings](../../../packages/knowledge/content/bindings/), the [review](../../../packages/knowledge/content/guidelines/button-review.md) and [implementation](../../../packages/knowledge/content/guidelines/button-implementation.md) guidelines, and the [action hierarchy pattern](../../../packages/knowledge/content/patterns/action-hierarchy.md)
- [Button runtime](../../../packages/components/src/button.js), [Button styles](../../../packages/components/src/button.css), [Badge runtime](../../../packages/components/src/badge.js), [Badge styles](../../../packages/components/src/badge.css), and the [Button tokens](../../../packages/tokens/src/tokens/components/button.tokens.json)
- The [Button runtime tests](../../../packages/components/test/button.test.js)

External sources were read on the analysis date through page retrieval. These projects are evolving. This compares published approaches and does not certify their tooling or the performance figures they report.

| Reference | Main contribution | Assessment against our model |
| --- | --- | --- |
| [Design System Documentation Spec](https://designsystemdocspec.org/) v0.20.0 | Interchange schema for docs, tokens, themes, and components. `traits` with `setBy: consumer \| component`, `combos` with must/should/may levels, per-platform `status` with a required `deprecationNotice`, and `for: human \| agent \| all` on sections | A documentation format, not a behavior contract. Its `setBy` distinction and `combos` are the two ideas worth borrowing. Moved from 0.15.2 to 0.20.0 in a few months, which matters for the export question below. |
| [Nathan Curtis: Component contracts and schemas](https://nathanacurtis.substack.com/p/component-contracts-and-schemas) and the [Specs schema](https://www.specsplugin.com/schema/) | Seven principles, and a Component to Props to Variants to Elements to Styles model where variants are deltas and styles resolve through token references, prop bindings, and conditionals | The benchmark for the visual half we lack. Our contract already satisfies the platform-independence, determinism, and governance principles. It fails "normalized over redundant" in the content, not the schema. |
| [Southleft: Use AI to Need Less AI](https://southleft.substack.com/p/use-ai-to-need-less-ai) and the [reference implementation](https://github.com/southleft/ds-contracts-poc) | Author once, enforce deterministically. Contracts hold props, anatomy, token bindings per channel, states, and semantics, and exclude behavior by design. A three-way parity differ across code, canvas, and contract, and a "carried, named, or refused" disposition for every fact | The clearest statement of what a visual contract should carry. Its own limitations document says overlay states are unmeasured and canvas-to-code is a starting point, so treat the 100/100 A/B figure as a demonstration, not evidence for our system. Our `SOURCE_CONFLICT` failures are already the "refused by name" pattern. |
| [Spektral spec schema](https://spektral.design/docs/spec-schema/) | Behavioral breadth: `interactions` as trigger, guard, and effect; per-element `aria`; `focus`, `announcements`, `reducedMotion`, and `contrast` under accessibility | Widest behavioral coverage, and the only reference with a home for reduced motion. Its guards and effects are JavaScript strings and its regions name HTML elements, so it has no portable layer. Borrow the field list, not the value language. |

## Coverage by concern

Rows are contract concerns. Cells describe what each model can state, not how well any of them is used.

| Concern | Here | DSDS | Curtis | Spektral | Southleft |
| --- | --- | --- | --- | --- | --- |
| Typed parameters with enum values and defaults | Yes, three kinds | `traits`, boolean or enum | Props: enum, number, boolean, string, instance | Props with `type`, `enum`, `default` | Props |
| Consumer-set versus component-set distinction | No. `disabled` is both a parameter and a state | `setBy` | Variants carry `configuration` | Flat `states` list | Flat `states` list |
| Combination constraints | No | `combos` with requirement levels | Variant deltas | `guard` expressions | No |
| Behavior rules | Prose strings | No | No | Trigger, guard, effect | Excluded by design |
| Anatomy part to style to token | No. Lives in CSS | Token entries and combos only | Full: elements, styles, `TokenReference`, `Conditional` | No | Token bindings per CSS channel |
| Accessibility role as data | Prose `semantics` | No | No | `aria.role` per element | ARIA roles in semantics |
| Focus, announcement, reduced motion | Keyboard only | No | No | All three plus `contrast` | No |
| Host binding as a separate record | Yes | `sourceFiles` and `imports` per platform | Argued | No | Generated per emitter |
| Field-level deprecation | No | Entry-level, per platform, notice required | Through ADRs | Entry-level `status` | No |
| Review checks with IDs and severity | Yes | Guideline items with `level` | No | No | Conformance kits |
| Provenance with revision pinning | Yes | `origin`, `updated`, `reviewed` | No | No | No |
| Audience targeting | Record-level `jobs` | Section-level `for` | No | No | No |

The bottom three rows are where the current model leads. Nothing in this review proposes changing them.

## Recommended additions

### 1. A visual mapping layer, sourced from what CSS already decides

Both companions propose mapping anatomy parts and configurations to tokens. This review adds the evidence for why it is urgent and the shape it should take.

`button.css` already contains the mapping. Each `:host([variant=...])` block assigns a token to a visual channel for a configuration, and the `.button:hover`, `:active`, `:focus-visible`, and `:disabled` rules assign a token per state. Reading that file as a table gives roughly forty rows of the form: anatomy part, channel, configuration, state, token or literal. Four of those rows resolve to `transparent` and one reuses a default-state token for hover and press. Those five are decisions the token file cannot express and the contract does not record.

Author that table on the component. Keep values in `packages/tokens` and validate every token reference against the token source, which the compiler already reads. Permit a small closed set of literals such as `transparent` and `inherit` so the ghost and secondary decisions have a home. Badge needs the same table against semantic tokens and does not need a component namespace to get it.

Then delete `SIZE_BRIDGE` and `assignGroup` in the same change, as KR-01 proposes. The mapping replaces the inference; do not remove the inference first.

Curtis's delta model is the right economy here: author the default configuration fully and author each variant as only the channels it changes. That is how the CSS is already written.

Strengthens KNOW-002, KNOW-008, KNOW-023.

### 2. Reduced-motion and focus-indication requirements

The stylesheet disables transitions under `prefers-reduced-motion: reduce` and draws a two-pixel focus outline from `component.button.focus.border`. The contract's only trace of either is the sentence "Keyboard focus remains visibly indicated." Spektral is the only reference with fields for `reducedMotion` and `focus`, and both are host-neutral concerns.

Add an optional `motion` entry stating that interaction transitions must be suppressible by a user preference, and add the focus indication requirement as a structured fact rather than a sentence. Both are cheap and both are decisions the implementation has already made without a portable record.

Strengthens KNOW-008.

### 3. Separate consumer-set parameters from component-set states

`disabled` is listed under `parameters` and again under `states`. `hover`, `pressed`, and `focus-visible` are states no consumer can set. DSDS resolves this with one field, `setBy`, on every trait. Adopting the same distinction lets the compiler know which states a token mapping may key on and which a binding must expose as a parameter. It also removes the current ambiguity in the bijection check, which compares parameters and events but not states.

Model states as objects with a name, whether they are exclusive of one another, and which anatomy part they affect. Hover, focus, and disabled are independent axes. Do not collapse them into one machine, and do not adopt Spektral's `setState('hover')` strings.

Strengthens KNOW-008, KNOW-010.

### 4. Behavior as typed rules with stable IDs

Agreed with both companions. Two specifics from the runtime read.

The runtime coerces an unknown `size` to `md` and an unknown `type` to `button`, but passes an unknown `variant` through unchanged, where the stylesheet silently falls back to primary. The contract says nothing about unknown values, so neither the coercion nor the inconsistency between the three parameters is a contract violation. A rule shape that can state "an unrecognized enum value resolves to the default" would make this checkable and would have flagged the asymmetry.

"Submit and reset participate in a form when the host supports form association" is a conditional on host capability inside the portable layer. It is the one place the contract assumes a web form model, and a non-web binding would have to map `submit` and `reset` to nothing. Keep it, since the concept is reasonable, but a typed rule should be able to mark a behavior as conditional on a declared binding capability rather than on a sentence.

Strengthens KNOW-008, KNOW-010.

### 5. Checks that point into the contract instead of restating it

`checks[]` with `id`, `level`, and `requirement` is ahead of every reference. The problem is that seven of the eight Button checks restate a fact that already exists elsewhere as prose. The fix is not richer prose. Add an optional reference from a check to a contract path or rule ID, and let the check's `requirement` be generated from that target when one is given. A check with no reference stays a human judgment, which `button-review-label` legitimately is.

This is the same conclusion opus-5 reached from the schema side. The runtime read adds a reason to sequence it early: it is the mechanism that removes the five-copy duplication described in the assessment, which no amount of schema work fixes on its own.

Strengthens KNOW-004, KNOW-010, KNOW-025.

### 6. Runtime conformance, with the current gaps named

Twelve Button tests exist. They cover fieldset disabling, form submit and reset, accessible-label mirroring, focus forwarding, and four token-alignment assertions. Nothing tests Enter or Space activation, the default values of `variant`, `size`, or `action`, the `activate` event firing at all, or that a disabled button emits no activation when clicked directly rather than through a fieldset. Those are the five contract facts most likely to regress and none is under test.

Connect rule IDs from item 4 to tests. The first milestone is a deliberately broken implementation failing a named check. Both companions propose this; the list above is what "coverage" should mean for Button specifically.

Strengthens KNOW-010, KNOW-025, KNOW-026.

### 7. Per-field deprecation and an `anatomyPart.role` vocabulary that survives Dialog

Agreed with opus-5 on deprecation. One correction: per-platform status is already partly expressible here, because each binding is its own record with its own `status`. What is missing is per-field retirement inside a contract, not per-platform lifecycle.

`anatomyPart.role` is a closed enum of four values. A Dialog needs at least a backdrop, a heading, and a dismiss control, and a Select needs a listbox and options. Expect this enum to change in the Dialog exercise both companions propose, and treat that as the trigger for the `specVersion: 3` bump rather than bumping for each addition separately.

Strengthens KNOW-007, KNOW-008, KNOW-012.

## Recommended removals

### Remove `hidden` from the Badge contract

Badge declares `hidden` as a portable boolean parameter. Its binding maps it to the native `hidden` attribute with no property, and its runtime defines nothing for it. Button supports the identical `:host([hidden])` rule in CSS and declares no such parameter. `hidden` is a host-platform feature, not a Badge design decision. Declaring it on one component and not the other is the kind of inconsistency Curtis's normalization principle exists to catch. Drop it from the contract and let the binding note native hiding if it needs to.

### Remove or constrain `behavior` on host bindings

Every `behavior` string on the Button binding restates a structured field beside it. "A disabled ancestor fieldset disables the button" is `formAssociation.fieldsetDisables: true`. "Programmatic focus and blur are forwarded to the inner native control" is `focus.forwardsTo: control`. Badge's one entry restates the `hidden` mapping. The prose field is one hundred percent redundant with typed data on the only two bindings that exist. Remove it, or restrict it to facts with no structured home and have the compiler reject an entry when a structured sibling covers the same mechanism.

### Move consumer obligations out of `accessibility.requirements`

The four Button requirements mix two audiences. "Keyboard focus remains visibly indicated" is a promise the component makes. "The label describes the resulting action" and "Meaning does not depend on color alone" are obligations on whoever uses the component. The second kind belongs in guideline checks, where it already is. Keeping both under one contract field is where the duplication in the assessment starts.

### Agreed removals

- `SIZE_BRIDGE` and inferred variant groups, replaced by item 1, per KR-01.
- `rationale` as a required field. Make it optional.
- `instead: Badge` as a bare string. Resolve to a record reference when one exists.

## Decisions to retain

- Component-owned portable contracts with separate host bindings. The web bias in `action` is small and named; the layering itself is correct.
- Token values and policy in `packages/tokens`. Item 1 adds references, never values.
- Strict validation, deterministic compilation, `SOURCE_CONFLICT` refusal, and self-contained bundles.
- `checks[]` with IDs and severity. Extend it; do not replace it with DSDS guideline items.
- Markdown authoring with validated frontmatter.
- Record-level `jobs`. DSDS's per-section `for` is a finer split with no consumer here.
- Deferring the MCP adapter.

## Agreement with the companion analyses

All three reviews independently reach: typed behavior with rule IDs, explicit token relationships, portable content constraints, richer parameter types when a component needs them, removing the size bridge, resolvable `instead`, and optional `rationale`. That convergence without shared context is good evidence.

This review adds the CSS-as-hidden-contract evidence for item 1, the reduced-motion and focus gap, the `setBy` distinction, the `hidden` and binding `behavior` removals, the audience split inside `accessibility.requirements`, the unknown-value asymmetry, and the specific untested contract facts.

One tiebreak. gpt-6 defers a DSDS export until a consumer exists. opus-5 recommends emitting it early as cheap optionality. This review sides with gpt-6. DSDS moved from 0.15.2 to 0.20.0 between the Southleft article and today, and its own site calls it a draft with no standards-body endorsement. A projection of a fast-moving draft is not free: every upstream change becomes a decision about whether the emitter still conforms. Revisit when the schema reaches 1.0 or when a named tool asks for it.

## Proposed work items

Proposals for planning, not created issues or approved scope. Update requirements, the content model, and ADRs with each accepted change.

| Order | Work item | Deliverable and acceptance criteria | Requirements |
| --- | --- | --- | --- |
| 1 | Remove redundant and misplaced fields | Drop `hidden` from the Badge contract. Remove `behavior` from the binding schema or reject entries that duplicate a structured sibling. Make `rationale` optional. No compiled output for Button changes except the removed fields. | KNOW-007, KNOW-023 |
| 2 | Pressure-test the schema with Dialog and Select | Draft both contracts without implementing them. Record which of items 1 through 7 above each one needs, what the `anatomyPart.role` enum must become, and what belongs in the binding. | KNOW-008, KNOW-010 |
| 3 | Type states, behavior, and accessibility | One `specVersion: 3` change: `setBy` or equivalent on states, rule triples with stable IDs, a role-typed accessibility block, motion and focus requirements, and per-field deprecation. Migrate Button. Every reference validated. | KNOW-007, KNOW-008, KNOW-010, KNOW-012 |
| 4 | Author the visual mapping and delete the inference | Transcribe `button.css` and `badge.css` into anatomy-channel-configuration-state-token rows on each component, with a closed literal set. Validate token references against the token source. Remove `SIZE_BRIDGE` and `assignGroup` in the same change. A build with the CSS and mapping disagreeing must fail. | KNOW-002, KNOW-008, KNOW-023 |
| 5 | Move content constraints into the portable contract | `required` and `accepts` move from binding anatomy to portable anatomy. Bindings keep slots and element names. | KNOW-008, KNOW-023 |
| 6 | Let checks reference the contract | Optional target on `check`, with `requirement` generated when a target is given. Rewrite the Button review guideline so that only judgment checks keep hand-written text. Remove the duplicated rule prose from the body, the pattern, and the implementation guideline where a check or contract field now owns it. | KNOW-004, KNOW-010, KNOW-025 |
| 7 | Prove runtime conformance | Tests bound to rule IDs for Enter and Space activation, every parameter default, `activate` emission, direct disabled activation, and unknown-enum resolution. An intentional mismatch fails a named check. | KNOW-010, KNOW-025, KNOW-026 |

### Dependencies and milestones

- Item 1 is independent and can land first. It shrinks the surface before the version bump.
- Item 2 sets the scope for items 3, 4, and 5.
- Item 4 can proceed before item 3 lands, because it touches `tokens` and a new mapping field rather than `states` or `behavior`. Sequence its inference removal after its mapping is authored, never before.
- Item 6 depends on item 3 for rule IDs and on item 4 for token targets.
- Item 7 depends on item 3. Items 3 and 7 together are the milestone that shows whether a richer contract catches implementation mistakes.

### Deferred scope

Defer the DSDS projection per the tiebreak above. Defer Figma generation, a second platform binding, a general layout schema, and section-level audience targeting until a consumer needs them. The Southleft parity differ is a good idea for a system with a canvas; it has no meaning here until there is a second implementation to compare.
