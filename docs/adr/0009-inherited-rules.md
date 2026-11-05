# ADR 0009: Inherited rules

**Status:** Accepted
**Amends:** [ADR 0002](0002-record-format.md). The field reference is
[`packages/spec/SPEC.md`](../../packages/spec/SPEC.md). Tracked in
[#322](https://github.com/stevegreco/taproot/issues/322).

## Context

Rules are how agents review work: each has an address, a level, and a topic, and `rules` lists
them. Only components could have rules. A requirement shared by several components was either
prose in a pattern, with no address, or copied into each component in its own words.

`pattern.form-field` showed both problems. Its requirements for labels, errors, required, disabled,
and form values were prose, so `rules --id pattern.form-field` returned nothing, and Text field,
which has no rules of its own, returned nothing either. Five components restated `form-value`, each
differently. A change to a shared requirement meant editing every copy, and nothing caught a copy
that was missed.

## Decision

**Patterns and guidelines may have `rules`.** They take the same shape as a component's, and each
has an address in the record that writes it, such as `pattern.form-field#error-blocks-submit`.
The body keeps the explanation people read.

**A component inherits the rules of each record in its `links.follows`.** It does not restate them.
`rules --id <component>` and `get` list them at their own addresses, so an agent cites the record
that writes the requirement.

**A component changes an inherited rule only on purpose.** Repeating an inherited rule's `id`
without saying how is an error. `extends: <address>` narrows the rule for the component: it keeps
the `id`, `topic`, level, and condition, and may raise the level but not lower it. Its examples,
rationale, and references are its own, since they describe the statement it rewrites.
`waived: <reason>` sets the rule aside, with the reason in the record.

## Consequences

- A shared requirement is written once. Form components keep only rules about their own control,
  and narrow `form-value` to say what their value is.
- Every form component has citable rules, Text field included.
- `component:status` counts inherited MUST rules, so a component that follows a pattern needs tests
  tagged with those rule ids, and lists the ones that have none.
- A rule ID in a pattern or guideline is a section, so it must not repeat a heading's slug.
  `pattern.form-field`'s "Form value" heading became "Value" so the shared `form-value` id could stay.
- The format version stays at 1: every record that was valid is still valid.

## Alternatives considered

**Inherit through rule `references` or any `follows` link, including derived ones.** Parameter
guidance and rule references create `follows` links too, but they say where to read more, not that
every requirement applies. Only an authored `links.follows` inherits rules. Rejected.

**Let a component restate a rule with the same id to override it.** Silent overrides are how the
copies drifted. Rejected in favor of `extends` and `waived`, which validation checks.

**Address inherited rules under the component, such as `component.text-field#error-blocks-submit`.**
It would give one requirement an address per component, and a review would cite several addresses
for one fix. Rejected: a rule has one address, in the record that writes it.
