# ADR 0002: Record format

**Status:** Accepted
**Source:** [RFC 0002](../rfcs/0002-knowledge-layer-architecture.md). This ADR and ADRs 0001 and
0003 replaced the earlier ADRs 0001 through 0007, which are available in git history.

The normative text is [`packages/knowledge/SPEC.md`](../../packages/knowledge/SPEC.md). This ADR
records the choices and why. It does not repeat the fields.

## Context

The earlier format wrapped the contract in a `contract:` block, kept a state priority order, and
mixed content, behavior, and accessibility rules in separate lists. It also recorded token
references in this repository's tier and path terms. Other design systems could not reuse it.

## Decision

**Four record types:** `component`, `pattern`, `guideline`, and `example`. Adopters cannot add
types. A fixed set lets tools and agents rely on a record's shape.

**Common fields:** `id` (`<type>.<name>`), `type`, `title`, `summary`, and optional `tags`,
`status`, `links`, and `sources`. A record's identity is its `id`, not its path. `sources` is
provenance only.

**Component fields:** `description`, `usage`, `anatomy`, and optional `parameters`, `events`,
`states`, `preferences`, `rules`, `accessibility`, `tokens`, and `rationale`. There is no
`contract:` wrapper. `states` is an unordered list.

**Rules** share one list. Each has a stable `id`, a `level` (`must`, `should`, or `may`, with RFC
2119 meaning), and a `topic` (`content`, `behavior`, or `accessibility`). A rule's address is
`<record id>#<rule id>`, so a review can cite it.

**Typed links:** `alternative`, `composes`, `follows`, `example-of`, and `related`. Each link is
written once. Tools add the inverse (`alternative-to`, `used-in`, `followed-by`, `examples`).
`alternative` is derived from `usage.avoid[].instead`, so the reason travels with the link. A
rule's `references` also create links.

**Section addressing:** a link target is a record ID with an optional `#section`. A section is a
heading slug in Markdown, a rule ID or field path in a component, and an annotation ID in an
example.

**Token map:** `tokens` maps an anatomy part to conditions, and a condition to properties and
token references. A condition is `base`, a parameter value, a state, a preference value, or
several joined with ` + `, such as `variant.primary + hover`. A token reference is an opaque
string. The map is reference data and defines no rule for combining conditions.

**File formats:** YAML for components, because most of a component is structured. Markdown with
front matter for the other types, because they are prose.

Validation is a JSON Schema plus cross-record checks for links, sections, and token conditions.
The format version is the number at the end of the schema's `$id`.

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
