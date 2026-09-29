# ADR 0007: Simplified knowledge model

**Status:** Accepted

This decision supersedes the separate binding records of
[ADR 0002](./0002-knowledge-owned-portable-contracts.md) and
[ADR 0003](./0003-component-owned-portable-contracts.md), the state resolution of
[ADR 0004](./0004-compact-visual-authoring.md), and the version fields of
[ADR 0005](./0005-yaml-component-specs.md). It keeps component-owned contracts, YAML component
specs with generated bodies, compact visuals, and host-neutral contract vocabulary.

## Context

The knowledge package has two jobs: a contract that the web components and the Figma components
are built from, and one source of knowledge served to the docs site and agents. It held about 1,800
lines of content for five components on one platform, and about 5,600 lines of compiler and
retrieval code. Most of that weight came from four places:

- a binding record per component, with its own schema and version, for a split between contract
  and platform that only one platform used;
- small languages authors had to learn: `stateResolution` with suppress, overlay, and independent
  states, and seven relation verbs;
- facts stated more than once: review checks restated spec rules, with their own severity scale;
- hand-written metadata: two copied `specVersion` values, and required `jobs`, `tags`, and
  `status`.

The contract also used CSS names, such as `padding-inline` and `focus-visible`, which a Figma
author has no reason to know.

## Decision

- **One file per component.** Each spec carries a `web:` section with what its binding held. The
  `binding` record type, `content/bindings/`, and the separate contract and host schemas are gone.
  One record schema holds the `contract` and `web` definitions.
- **States in priority order.** `contract.states` lists states highest priority first. For each
  channel, the first active state that sets it wins. A state hides a lower one only on the channels
  it sets. `default` is the rest state and comes last. This replaces `stateResolution`. Every
  configuration and combination of states in the five components resolved the same way before and
  after.
- **Neutral channel names.** `focus-ring`, `padding-horizontal`, `padding-vertical`, `motion`,
  `motion-duration`, and `motion-easing` replace the CSS names. State `focus` replaces
  `focus-visible`, and axis `reducedMotion` replaces `prefersReducedMotion`. The compiler's
  `CHANNEL_CSS` maps each channel to its CSS property.
- **One relation.** `related` is a top-level list that links both ways.
- **Rules are the review checklist.** Guideline `checks` and their error and warning levels are
  gone. Review uses the contract rules and their `must`, `should`, and `may` levels.
- **Less authored metadata.** Authors write `id`, `type`, `title`, and `summary`. The build
  defaults `status`, derives `jobs` from the type, and adds the record's name to `tags`. The
  contract and host `specVersion` fields are gone; `compiledSchemaVersion` 8 is the only format
  version a consumer checks.
- **Usage bullets have no IDs.** Only rules need stable IDs.

## Consequences

- A designer or writer edits one file per component and can stop before its `web:` section.
- A second platform, such as Figma, adds a section beside `web:` rather than a new record type.
- `openCatalog().get("component.button").web` replaces the binding record. Search for a tag name
  returns the component.
- Compiled records keep `relations.related` and `backlinks.related`, so `related()` works as
  before with one relation name.
- Authors must set a channel on a higher state when it should hide a lower state's value on that
  channel. The component contract tests render every pair of states, so a missing value fails a
  test instead of shipping.

## Alternatives considered

**Split each component by audience**, with usage prose in Markdown and the contract in YAML.
Rejected for now: it keeps two files per component and loses the structured usage the build
renders. Revisit if writers find YAML a barrier.

**Keep bindings until a second platform exists.** Rejected: Figma is already a second consumer of
the contract, and it needs no host facts. A `figma:` section can sit beside `web:` when it is
added.
