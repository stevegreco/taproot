# ADR 0005: Part options

**Status:** Accepted
**Amends:** [ADR 0002](0002-record-format.md) and [ADR 0004](0004-repeated-items.md). The field
reference is [`packages/spec/SPEC.md`](../../packages/spec/SPEC.md).

## Context

ADR 0004 gave repeated parts their own options. A part that appears at most once, such as a card's
title, had none. Its options were written as component parameters, and only their descriptions
said which part they shaped. Card's `label` and `headingLevel` both shape the title, but nothing an
agent or a check could read connected them to it.

Real systems often build these as compound components, with a child for the part that takes its
own options. A spec that cannot say which part an option belongs to cannot describe those systems,
and a mapping cannot show that a prop lives on the child.

## Decision

**A top-level `parts` field, the same shape as `items`.** Each key is an anatomy part that appears
at most once, and its value holds that part's `parameters` and `events`, with the same checks.

```yaml
parts:
  title:
    parameters:
      label:
        kind: string
      headingLevel:
        kind: number
        default: 3
```

**A part is in `parts` or `items`, never both.** Repeated or not is a fact about the part, and its
options live in one place.

**Whole-component options stay in `parameters`.** An option that shapes the whole component, or
more than one part, is a component parameter. Card's `href` makes the whole surface a target, so it
stays on the card.

**The spec does not say where an implementation puts them.** An implementation lists each part
with its own API rows. A part without a tag name or export is set on the component itself, as the
web Card sets `label` on `<ds-card>`. A part with one is its own element or component, as a
compound React API would give `CardTitle`. The coverage check requires a row for every part
parameter and event either way.

**Parts are addressable.** `parts.title` and `parts.title.parameters.label` are sections, and an
enum part parameter's `guidance` creates links, as items' do.

**Whole-component fields stay whole-component.** As with items, a token condition names a
component parameter or state, not a part parameter.

## Consequences

- An agent reading Card sees `label` and `headingLevel` as options of the title.
- A mapping can show an option on a child element or component without the spec naming it.
- Adding an optional field leaves every existing record valid, so the format version stays 1.
- Card, Dialog, and Alert declare their part options this way.

## Alternatives considered

**A `repeats: false` flag on `items`.** One field for both, but `items` would stop meaning
"repeated", and every reader would have to check the flag.

**A `part:` tag on each parameter.** The smallest change, but it is the scope tag ADR 0004
rejected: options for different parts sit side by side and every reader has to filter them.

**Token conditions on part parameters.** A part enum, such as a title size, could select tokens
directly. No component needs it yet. Revisit if one does.
