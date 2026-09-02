# ADR 0002: Knowledge-owned portable contracts

**Status:** Accepted

This decision supersedes [ADR 0001](./0001-portable-design-system-knowledge.md). ADR 0001 remains
the record of the original catalog architecture. This ADR changes ownership of portable component
contracts. It restates the catalog rules that still apply.

## Context

ADR 0001 put component contracts with the component package because each fact had one domain owner.
That rule did not ask whether a contract was host-specific. The only spec we had mixed usage,
parameters, and accessibility with `tagName`, slots, parts, FACE, and `HTMLFormElement`. Nothing in
the component package read, shipped, or tested that file. The knowledge compiler was the only
consumer, and it copied the mixed YAML onto `component.button`.

Portable contracts need to be implementation-independent. A design or review agent that calls
`get("component.button")` must not receive `ds-button`. Host mappings still need an authored home.
Implementation-independence is new reasoning. It does not rewrite ADR 0001's accepted decision in
place.

Token values and token ADRs stay with `packages/tokens`. Component runtime stays in
`packages/components`. The retrieve interface stays `openCatalog`, `get`, `list`, `search`, and
`related`.

## Decision

We will author portable component contracts as `type: spec` records under
`packages/knowledge/content/specs/` and host mappings as `type: binding` records under
`packages/knowledge/content/bindings/`.

A spec's `contract` is host-neutral. It has no `tagName`, slots, parts, attribute spellings, or DOM
types. A binding's `host` is the only authored object that may name a custom-element tag, FACE,
slots, parts, or `HTMLFormElement`.

A component that has a contract `uses` exactly one spec. The compiler copies that spec's `contract`
onto the compiled component so `get("component.button")` still returns usage, anatomy, parameters,
events, states, behavior, and accessibility. It does not copy `title`, `summary`, or `status`. A
binding `implements` the component. `related("component.button")` reaches the host through
`implementedBy`.

Provenance of a contract is the spec record's `kind: authored` source. The `component-spec` source
kind is removed. `packages/components/specs/` is not an authored path.

Binding anatomy names, parameters, and events are a bijection with the portable contract they
implement. Token checks read `contract.parameters`. `tokenRef` is authored on the component, not on
the spec.

## Consequences

- `get("component.button").contract` has no `tagName`. `ds-button` lives on
  `get("binding.button.web-component").host.defaultTagName`.
- Authors write specs and bindings as the same Markdown records they already write.
- A second host, such as React, does not belong under `packages/components`.
- Compiled schema version becomes 2 because the contract shape changed.
- KNOW-002, KNOW-006, KNOW-008, the content model, and `AGENTS.md` must name the same owners.

## Alternatives considered

**Leave YAML in `packages/components/specs/` and drop `tagName` from the compiled schema.** The
component package would still appear to own a file nothing in that package consumes. KNOW-002, this
ADR, the content model, and `AGENTS.md` would point at a path we emptied or a path we kept as a
second source. Rejected.

**Portable YAML under `packages/knowledge/contracts/` plus host YAML under
`packages/components/bindings/`, compiled as two namespaces on one record.** Callers would still
`get` one mixed object and have to know which namespace is portable. The component package would
own a binding file the runtime never reads. A second host would have no honest directory. Rejected.

**Fold the portable contract into `component.button` frontmatter and skip `type: spec`.** The graph
would be smaller. Narrative and contract would share a diff, and a spec could not be listed,
searched, or related to without the component hub. Rejected.
