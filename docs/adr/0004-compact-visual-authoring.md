# ADR 0004: Compact visual authoring and explicit state resolution

**Status:** Accepted; `stateResolution`, CSS channel names, and authored `mappings` superseded by
[ADR 0007](./0007-simplified-knowledge-model.md). Compact visuals remain; `mappings` is compiler
output only.

This decision extends [ADR 0003](./0003-component-owned-portable-contracts.md). It does not change
component-owned contract authorship or host neutrality.

It implements [issue #85](https://github.com/stevegreco/design-system/issues/85).

## Context

PR #81 authored visual token relationships as flat `contract.mappings` rows. That removed Button
compiler inference and made Badge's semantic bindings portable. The compiled row shape is the
right consumer format: anatomy part, channel, configuration, state, and a token name or closed
literal.

The authored form did not scale. Button repeated 55 rows and Badge 26, about 500 lines. Ghost
restated a transparent border on every state. Secondary restated the same border token for
default, hover, and pressed. State combination rules lived only in CSS
(`:hover:not(:disabled)`, `:focus-visible` still applying when disabled). Reordering
`contract.states` had no documented relationship to visual precedence.

## Decision

Author compact `contract.visuals` grouped by anatomy part and configuration axis. Compile that
source into the existing `contract.mappings` rows. Do not keep a second authored copy of the same
facts.

At acceptance, portable `specVersion` was 4 and compiled schema version was 6. Bundles whose
compiled schema version does not match the compiler fail closed. [ADR 0005](./0005-yaml-component-specs.md)
bumps both.

### Authored source

`visuals.<part>` may contain:

- `base` — channels that apply regardless of state. Compiled rows omit `state`.
- `states` — part-level state overrides. Reserved; not a configuration axis.
- one object per contract parameter or `configurationAxes` name. Values must be declared on that
  axis. `base` and `states` cannot be parameter or axis names.

Under an axis value, sibling channel assignments are the rest appearance. If that value also has
`states`, those rest channels compile with `state: default` when `default` is in `contract.states`.
If it has no nested `states`, the rows omit `state` (size padding, Badge variant colors). Nested
`states` replace only the channels they name.

Bare strings resolve to a published token name or the closed literals `transparent`, `inherit`,
and `none`. Unknown names are missing tokens, not arbitrary literals. The compiler never infers a
token path from a variant or size name.

Authoring both `visuals` and `mappings` is a conflict. `mappings` remain legal on compiled records
and in fixtures that skip compact authoring.

### State resolution

`contract.states` is a vocabulary. Its order does not decide visuals. Simultaneous states use
`contract.stateResolution`:

- `suppress` — when the winner is active, named losers do not contribute channels. Button
  `disabled` suppresses `hover` and `pressed`.
- `overlay` — remaining interaction states apply in this list order, later replacing overlapping
  channels. Button overlays `hover` then `pressed`.
- `independent` — states that still apply after suppression and overlay. Button `focus-visible`
  contributes alongside an enabled interaction state and alongside `disabled`, matching
  `.button:focus-visible` in `button.css`.

`default` is the rest layer. It is not listed in `suppress`, `overlay`, or `independent`.

Consumers resolve a configuration and a set of active states with
`resolveMappings(mappings, stateResolution, { configuration, states, part })` from
`@stevegreco/design-system-knowledge/compile`. Results are grouped by anatomy part in
`parts`. `channels` is a data property when `part` is passed or when only one
part matched, so serialization still works. Reading `channels` without `part`
when more than one part matched throws via a non-enumerable getter: explicit
reads fail loudly, while `JSON.stringify` and object spread omit the key
instead of throwing. That way a second anatomy part cannot turn
`.channels.background` into a silent TypeError.
Compiled mappings are **partial rules**, not a cartesian product of state combinations.

Layering is:

1. Base rows (no `state`). Specificity is the number of configuration keys; a
   variant rule beats a part-level `base` rule for the same channel.
2. `default`.
3. Overlay states, in `overlay` list order.
4. Suppress winners that are still active.
5. Independent states.

Independent states are orthogonal: they may combine with overlay and suppress
winners, but they must not assign the same part and channel as those states when
the configurations can apply together. The compiler rejects that overlap so
`focus-visible` cannot silently replace a disabled fill. Independent states may
still override base and `default` (Button outline). YAML object order and
`contract.states` order do not decide any of these ranks.

Precedence alone is not enough. If Ghost is hovered and disabled, a disabled rule that only
changes foreground would retain the hover background unless `disabled` suppresses `hover`. That
case is a required regression: resolved Ghost hover+disabled background is `transparent`.

Do not add combined-condition syntax until a component needs a rule that this model cannot
express. Incomparable axis assignments for the same part and channel (for example size and
variant both setting `background`) fail closed. YAML object order does not decide precedence.
Axis-specific rules may override part-level `base` for that configuration.

### Reduced motion

`transition: none` is a bounded shorthand, not a general motion abstraction. When that assignment
matches, it replaces `transition-duration` and `transition-timing-function` for the resolved
configuration. Compiled output still carries the base duration and easing rows plus the reduce
`transition` row. Resolvers must clear the longhands rather than leaving CSS shorthand behavior
implicit.

### Compiled output relative to specVersion 3

The compiled mapping row shape is unchanged except for the added `visualCoverage` object.
Compiled contracts omit `visuals` and omit compiler-only `source` paths used during validation.
Button compiled mappings drop rows that only restated a rest-layer value on another state,
including Ghost disabled `background: transparent` (inherited from rest) and Ghost/Secondary
border copies. Host CSS may still copy those inherited values into `--_*-hover` /
`--_*-disabled` custom properties; mapping stylesheet tests no longer assert those copies.

Badge compiled mapping coverage is unchanged (26 rows).

### Coverage

Compiled `visualCoverage` records which parts, axes, axis values, states, and channels were
authored. Anatomy parts and parameters with no visuals are listed as `uncoveredParts` and
`uncoveredAxes` rather than failing the build. Button `content`, `action`, `disabled`,
`fullWidth`, and `accessibleName` are uncovered by intent. When an axis is used, omitted values
appear on `missingValues` so a new variant is an absence, not silent success. Incomplete axes do
not fail compilation in this slice.

## Consequences

- Button and Badge author grouped visuals. Compiled `get("component.button").contract.mappings`
  stays the consumer table.
- Component CSS is the runtime copy of these facts, not a second authored source. Two tests keep
  it honest: `contract-mappings.test.js` checks every compiled mapping by computed style, and
  `mapping-css.test.js` fails when a stylesheet reads a token variable no mapping names.
  (Amended 2026-09: these replaced the earlier regex needle check.)
- Host custom properties that copy an inherited value into a state-specific variable
  (`--_border-hover: transparent` or Ghost `--_background-disabled: transparent`) are no longer
  asserted once the repeated mapping row is gone. Confirm those copies visually or by reading
  `button.css` until a host adapter exists.
- Figma agreement remains a manual check.
- Token-value-only changes still need no mapping or CSS-reference edits.

## Change workflow

1. Accept the design intent.
2. Edit the component contract `visuals` (and `stateResolution` if interaction rules change) and
   token sources when new names or values are required.
3. Update component CSS and any other host implementation to match.
4. Run knowledge compile, the component mapping tests, and token build gates.
5. Check Figma by hand until an adapter exists.
6. Release token, knowledge, and component packages together when the published contract or CSS
   references change.

## Alternatives considered

**Keep flat authored mappings.** Rejected. The catalog cannot maintain per-state repetition of
unchanged channels.

**Fully resolved combination rows.** Rejected for this slice. Partial rules plus explicit
suppression match the CSS model and avoid combined-condition syntax.

**Infer suppression from `contract.states` order.** Rejected. Reordering the vocabulary must not
change visuals.

**Fail compilation when an axis is incomplete or a parameter has no visuals.** Deferred. Button
`action` and `disabled` are parameters, not visual axes. Incomplete axis values belong on
`visualCoverage.missingValues` so the gap is visible. A later component can turn missing values
into errors once the catalog has a completeness policy.

**Keep inherited state copies that CSS still declares as `--_*-hover` variables.** Rejected. The
portable rest-layer assignment is the authored fact. Host variable copies are implementation
detail until a binding adapter exists.

## Requirements

KNOW-002, KNOW-008, KNOW-023.
