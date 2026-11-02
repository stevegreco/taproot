# ADR 0004: Repeated items

**Status:** Accepted
**Amends:** [ADR 0002](0002-record-format.md). The field reference is
[`packages/spec/SPEC.md`](../../packages/spec/SPEC.md).

## Context

Accordion and Tabs are built from a part the author repeats: one section per heading, one panel per
tab. Each copy carries its own options. A section has a label and says whether it starts expanded;
a tab panel has a label and a value.

`parameters` describes options of the whole component, so these had nowhere to go. They were
written in an anatomy description, explained in `rationale`, and listed only in prose in the web
implementation file. Agents could not read them as options, and the implementation coverage check
could not see them, so nothing failed when the web API missed one. Radio group options, Select
options, and a future Menu have the same shape.

## Decision

**A top-level `items` field.** Each key is the anatomy part that repeats, and its value holds the
`parameters` and `events` each copy has. These use the same shape as the component's own
`parameters` and `events`, and the same checks apply.

```yaml
items:
  section:
    parameters:
      label:
        kind: string
        description: Visible text of the section's trigger.
      expanded:
        kind: boolean
        default: false
```

**The anatomy part keeps its role and description.** `items` adds options to a part; it does not
describe it again.

**Whole-component fields stay whole-component.** States, rules, accessibility, and tokens are
written once for the component. A token condition names a component parameter or state, not an
item parameter. When an item's option changes how it looks, the component declares the matching
state, as Accordion does with `expanded`.

**Items are addressable.** `items.section` and `items.section.parameters.label` are sections that
links and rules can cite, and an item enum parameter's `guidance` creates links the same way a
component parameter's does.

**Implementations map items too.** An implementation lists each item with how it is realized and
its own API rows, and the coverage check requires a row for every item parameter and event, as it
does for the component's.

## Consequences

- An agent reading Accordion sees `label` and `expanded` as options of each section, not prose.
- A web implementation that leaves out an item attribute fails the check.
- Adding an optional field leaves every existing record valid, so the format version stays 1.
- Tabs, Radio group, and Select can move their item options out of prose one at a time.

## Alternatives considered

**Parameters on the anatomy part.** Fewest new fields, but it mixes a part's description with its
options, and would later need events and more fields on anatomy too. Rejected in favor of one place
that lists what an item carries.

**A scope tag on each parameter.** One flat list, with `scope: section` on item options. The
smallest schema change, but whole-component and per-item options sit side by side, and every
reader has to filter them. Rejected.

**Item states and token maps.** A per-item state list and token map would let each item be styled
alone. No component needs it yet, since the component's own states cover each part. Revisit if one
does.
