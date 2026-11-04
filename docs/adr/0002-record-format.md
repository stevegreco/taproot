# ADR 0002: Record format

**Status:** Accepted
**Amended by:** [ADR 0004](0004-repeated-items.md) and [ADR 0005](0005-part-options.md).

This ADR and ADRs 0001 and 0003 replaced earlier ADRs, which are in git history.

The field reference is [`packages/spec/SPEC.md`](../../packages/spec/SPEC.md). This ADR records
the choices and why. It does not list the fields.

## Context

The earlier format wrapped the contract in a `contract:` block, kept a state priority order, and
mixed content, behavior, and accessibility rules in separate lists. It also recorded token
references in this repository's tier and path terms. Other design systems could not reuse it.

## Decision

**A fixed set of record types:** component, pattern, guideline, and example. Adopters cannot add
types, so tools and agents can rely on a record's shape.

**Identity by id, not path.** A record is found by its `id`, so files can move without breaking
links.

**A flat component record.** There is no `contract:` wrapper, and states are an unordered list.

**One list of rules.** Each rule has a stable id, an RFC 2119 level, and a topic, and has an
address that a review can cite.

**Typed links, written once.** Tools add the inverse. Alternatives come from `usage.avoid`, so the
reason travels with the link.

**Section addressing.** A link can point at one heading, rule, field, or annotation in a record.

**A token map as reference data.** It names which token paints each part under each condition.
Token references are opaque strings, and the map defines no rule for combining conditions.

**YAML for components, Markdown for the rest.** Most of a component is structured. The other types
are prose.

**Validation by JSON Schema plus cross-record checks.** The format version is the number at the end
of the schema's `$id`.

## Consequences

- An agent can cite, link to, and review against one rule or one parameter value.
- A change that invalidates existing records raises the format version.
- The token map cannot compute the final style of a combination. Authors write a combination as
  its own condition when it matters.
- Token names, tiers, and file formats belong to the adopter.

## Alternatives considered

**A `foundation` record type for color, type, and spacing.** Guidelines cover it for now. Revisit
if guidelines prove too loose.

**Ordered states with per-channel priority.** It let a tool compute styles, but only a tool that
computes styles needs it. Rejected.

**Separate content, behavior, and accessibility lists.** Three lists meant three ID spaces and
three ways to cite a rule. A `topic` field replaces them.

**Markdown for components.** Structured fields were awkward to parse and validate in prose.
Rejected.
