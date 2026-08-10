# Semantic naming plan

**Status:** Working draft

## Strategy

Semantic color names start with how the color is applied:

```text
semantic.color.<application>.<intent>[.<variant>][.<state>]
```

The initial application groups are:

- `background` for fills;
- `foreground` for text, icons, and SVG content; and
- `border` for borders, dividers, outlines, and focus indicators.

The naming strategy is intentionally minimal:

- Add a semantic token only when a current shipped consumer needs it.
- Keep background, foreground, and border contracts separate even when they resolve to the same
  primitive value.
- Keep identical semantic paths in light and dark themes; themes select the primitive values.
- Put interaction state last and use `pressed`, not `press`.
- Use `default` for an application's canonical baseline or the resting value in a stateful family.
- Use `brand` for identity and non-interactive emphasis.
- Use `action.primary` for the primary interaction hierarchy.
- Do not make one semantic contract alias another merely because their current values match.
- Use a genuinely neutral, theme-independent gray primitive scale for achromatic roles. The scale
  runs from near-white to near-black ink without inheriting a palette hue; light and dark semantics
  select the appropriate step.

Deferred roles are not part of the published vocabulary. A proposed token joins the working
vocabulary only when its contract is deliberately accepted.

## Background

Background tokens are used only for fills. The working vocabulary currently contains 19 roles.

### Foundation

| Proposed token                       | Purpose                                          | Replaces                             |
| ------------------------------------ | ------------------------------------------------ | ------------------------------------ |
| `semantic.color.background.default`  | Page or application background                   | Unchanged                            |
| `semantic.color.background.surface`  | Cards, panels, popovers, and containing surfaces | `semantic.color.background.raised`   |
| `semantic.color.background.sunken`   | Wells, inset regions, and grouped control beds   | Unchanged                            |
| `semantic.color.background.muted`    | Quiet supporting regions and low-emphasis fills  | Unchanged                            |
| `semantic.color.background.disabled` | Unavailable control or action fill               | `semantic.color.disabled.background` |

In the light theme, `background.surface` uses `gray.25` to provide a near-white neutral containing layer
against the warm `background.default`. It does not imply elevation.

`background.disabled` uses the proposed neutral gray scale so it does not inherit the warm cast of
`clay` or the green cast of `blueSmoke`. The prototype currently maps it to `gray.100` in the light
theme and `gray.900` in the dark theme.

### Brand

| Proposed token                            | Purpose                                               | Replaces                     |
| ----------------------------------------- | ----------------------------------------------------- | ---------------------------- |
| `semantic.color.background.brand.default` | Solid non-interactive brand fill                      | New role                     |
| `semantic.color.background.brand.muted`   | Tinted brand surface for highlighted cards and badges | `semantic.color.accent.soft` |

### Actions

| Proposed token                                     | Purpose                     | Replaces                                           |
| -------------------------------------------------- | --------------------------- | -------------------------------------------------- |
| `semantic.color.background.action.primary.default` | Resting primary-action fill | Background uses of `semantic.color.accent.default` |
| `semantic.color.background.action.primary.hover`   | Hovered primary-action fill | `semantic.color.accent.hover`                      |
| `semantic.color.background.action.primary.pressed` | Pressed primary-action fill | `semantic.color.accent.press`                      |

### Secondary actions

| Proposed token                                       | Purpose                       | Replaces                              |
| ---------------------------------------------------- | ----------------------------- | ------------------------------------- |
| `semantic.color.background.action.secondary.default` | Resting secondary-action fill | New role; previously transparent      |
| `semantic.color.background.action.secondary.hover`   | Hovered secondary-action fill | `semantic.color.background.muted`     |
| `semantic.color.background.action.secondary.pressed` | Pressed secondary-action fill | `semantic.color.background.sunken`    |

Secondary actions use an opaque achromatic surface so the control remains visually stable across
foundation, brand, and quiet status backgrounds. The light theme maps default, hover, and pressed
to `gray.25`, `gray.50`, and `gray.100`; the dark theme maps them to `gray.900`, `gray.800`, and
`gray.700`. These are action-specific roles rather than aliases to foundation backgrounds because
their state progression belongs to the interaction contract.

### Tertiary actions

| Proposed token                                      | Purpose                         | Replaces                           |
| --------------------------------------------------- | ------------------------------- | ---------------------------------- |
| `semantic.color.background.action.tertiary.hover`   | Hovered tertiary-action overlay | `semantic.color.background.muted`  |
| `semantic.color.background.action.tertiary.pressed` | Pressed tertiary-action overlay | `semantic.color.background.sunken` |

Tertiary actions are transparent at rest, so no `.default` background token is published.
`transparent` remains a literal implementation value rather than a semantic color role. Hover and
pressed use neutral translucent overlays so the underlying semantic background remains visible.
The light theme uses `gray.950` at 5% and 9% opacity; the dark theme uses `gray.25` at 6% and 10%
opacity. These mappings require dedicated neutral-alpha primitives before the semantic contracts
can be implemented; semantic tokens must alias those primitives rather than embed alpha literals.

### Status

| Proposed token                                     | Purpose                                      | Replaces                                   |
| -------------------------------------------------- | -------------------------------------------- | ------------------------------------------ |
| `semantic.color.background.status.success.default` | Positive outcome or confirmation fill        | `semantic.color.status.success.background` |
| `semantic.color.background.status.warning.default` | Caution or attention-required fill           | `semantic.color.status.warning.background` |
| `semantic.color.background.status.info.default`    | Informational or guidance fill               | `semantic.color.status.info.background`    |
| `semantic.color.background.status.danger.default`  | Negative, error, or destructive-outcome fill | `semantic.color.status.danger.background`  |

Only the default quiet fill is accepted. Lighter and stronger status-background variants remain
deferred until a shipped consumer needs them. The light theme uses each hue's `100` stop. The dark
theme uses `moss.900`, `amber.900`, `sky.800`, and `rust.800` respectively; semantic mappings choose
perceptually appropriate stops rather than forcing matching step numbers across palettes.

## Foreground

Foreground tokens are used only for visible content: text, icons, and SVG content. They do not
describe a surface beneath that content. The vocabulary starts with three foundation roles, then
adds brand content and only the explicit background pairings currently under discussion.

### Foundation

| Proposed token                       | Purpose                                                                     |
| ------------------------------------ | --------------------------------------------------------------------------- |
| `semantic.color.foreground.default`  | Primary text and icons on supported foundation and quiet status backgrounds |
| `semantic.color.foreground.muted`    | Secondary or supporting text and icons                                      |
| `semantic.color.foreground.disabled` | Unavailable text and icons                                                  |

`foreground.default` and `foreground.muted` are semantic roles, not a numbered emphasis scale.
Start with one supporting-content role; add another only when a concrete use case has a purpose that
cannot be expressed by `default` or `muted`.

Both enabled roles must meet 4.5:1 against every background on which they are supported.
`foreground.default` additionally supports all four `background.status.*.default` quiet fills. This
text requirement is intentionally stronger than the 3:1 requirement for non-text icons because the
same foreground token can serve either kind of content. Disabled content is exempt from WCAG
contrast requirements, but its value should still be recognisable and visibly distinct from enabled
content.

The achromatic foundation roles should resolve through the neutral `gray` scale. Exact primitive
selections remain to be tested across `background.default`, `.surface`, `.sunken`, and `.muted` in
both themes before they are accepted.

### Brand

| Proposed token                            | Purpose                                                                          |
| ----------------------------------------- | -------------------------------------------------------------------------------- |
| `semantic.color.foreground.brand.default` | Non-interactive brand-colored text and icons on supported foundation backgrounds |

This role expresses brand identity through the content color itself. It is not a foreground for
content placed on a brand fill.

### Paired content

Foregrounds intended for a specific background contract use an explicit `on` segment:

```text
semantic.color.foreground.on.<background-intent>[.<variant>][.<state>]
```

| Proposed token                                | Purpose                                       | Supported background pair                                     |
| --------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------- |
| `semantic.color.foreground.on.brand.default`  | Text and icons placed on the solid brand fill | `background.brand.default`                                    |
| `semantic.color.foreground.on.action.primary` | Text and icons placed on primary-action fills | `background.action.primary.default`, `.hover`, and `.pressed` |

`foreground.on.action.primary` has no state suffix because one foreground value is expected to meet
contrast requirements across all three background states. Add foreground states only if the
foreground itself must change. A generic role such as `foreground.inverse` is not proposed because
it cannot identify or guarantee a compatible background.

### Status

Status foregrounds communicate status through the content color on supported foundation
backgrounds. Quiet status fills already support `foreground.default`, so they do not introduce a
second set of `on.status.*` roles.

| Proposed token                                     | Purpose                                                            |
| -------------------------------------------------- | ------------------------------------------------------------------ |
| `semantic.color.foreground.status.success.default` | Success-colored text and icons on supported foundation backgrounds |
| `semantic.color.foreground.status.warning.default` | Warning-colored text and icons on supported foundation backgrounds |
| `semantic.color.foreground.status.info.default`    | Informational text and icons on supported foundation backgrounds   |
| `semantic.color.foreground.status.danger.default`  | Danger-colored text and icons on supported foundation backgrounds  |

If a stronger status fill later requires a foreground different from `foreground.default`, that
specific pairing can introduce an `on.status.*` contract at that time.

### Deferred foreground roles

- Content placed on other brand, action, or status fills.
- Additional status variants or interaction states.
- Action-colored content on neutral or transparent backgrounds, including
  `semantic.color.foreground.action.primary`. No current foreground role is reserved for this;
  introduce it later only if a concrete use case needs it.

These roles will be named when their background pair or concrete use case is considered. They should
not be inferred from the current foreground roles.

## Border

Border tokens are used for visible boundaries: borders, dividers, outlines, and focus indicators.
The working vocabulary contains thirteen roles. It distinguishes functional boundaries, which must remain
perceivable, from decorative boundaries, which may be quieter but cannot be the only visual cue.

### Foundation

| Proposed token                   | Purpose                                                                 |
| -------------------------------- | ----------------------------------------------------------------------- |
| `semantic.color.border.default`  | Standard functional boundary for controls and other perceivable regions |
| `semantic.color.border.strong`   | Emphasized functional boundary                                          |
| `semantic.color.border.subtle`   | Decorative dividers and quiet surface edges                             |
| `semantic.color.border.disabled` | Unavailable control boundary                                            |
| `semantic.color.border.focus`    | Focus indicator, whether rendered as a border or an outline             |

`border.default`, `border.strong`, and `border.focus` must meet the 3:1 non-text contrast requirement
against every supported foundation background. `border.subtle` is deliberately decorative and must
not be the sole way a control, region, or state is identified. Disabled boundaries are exempt from
the WCAG contrast minimum, but they should remain recognisable and visibly distinct from enabled
boundaries.

The achromatic foundation roles resolve through the neutral `gray` scale. `border.focus` retains the
brand hue because focus is a functional state rather than an achromatic foundation edge.

The accepted foundation mappings are `gray.500`, `gray.600`, `gray.200`, and `gray.300` for default,
strong, subtle, and disabled in the light theme; the dark theme uses `gray.400`, `gray.300`,
`gray.800`, and `gray.700`. Focus uses `robRoy.700` in light and `robRoy.400` in dark.

### Brand

| Proposed token                      | Purpose                                                   |
| ----------------------------------- | --------------------------------------------------------- |
| `semantic.color.border.brand.muted` | Quiet brand-colored boundary for non-interactive emphasis |

`border.brand.muted` replaces palette-oriented language such as `border.warm` with the intent it
serves. It is decorative and must not be the sole boundary of an interactive control. The light
theme maps it to `robRoy.200`; the dark theme maps it to `robRoy.800`.

### Actions

| Proposed token                                 | Purpose                              |
| ---------------------------------------------- | ------------------------------------ |
| `semantic.color.border.action.primary.default` | Primary action boundary at rest      |
| `semantic.color.border.action.primary.hover`   | Primary action boundary on hover     |
| `semantic.color.border.action.primary.pressed` | Primary action boundary when pressed |

Primary action borders match their corresponding `background.action.primary` values so a filled
control has one visually unified surface. The light theme maps default, hover, and pressed to
`robRoy.700`, `robRoy.800`, and `robRoy.900`; the dark theme maps them to `robRoy.400`,
`robRoy.300`, and `robRoy.200`. Separate border contracts preserve the application boundary while
allowing the border role to evolve independently later. Each state must retain 3:1 non-text
contrast against every supported foundation background.

### Status

Status borders communicate an outcome or condition through the boundary itself. Their default roles
must meet 3:1 against their paired quiet status background and against supported foundation
backgrounds.

| Proposed token                                 | Purpose                                 |
| ---------------------------------------------- | --------------------------------------- |
| `semantic.color.border.status.success.default` | Positive or confirmed boundary          |
| `semantic.color.border.status.warning.default` | Caution or attention-required boundary  |
| `semantic.color.border.status.info.default`    | Informational or guidance boundary      |
| `semantic.color.border.status.danger.default`  | Error, invalid, or destructive boundary |

Status borders use each hue's `700` stop in the light theme and `300` stop in the dark theme. This
keeps every status boundary comfortably above 3:1 on both its quiet status fill and all supported
foundation backgrounds.

### Deferred border roles

- Secondary action borders.
- Additional interaction states. Add a state only when the border itself changes.
- Additional brand or status variants.
- Separate divider, outline, inverse, or selected roles. The accepted foundation and intent roles
  cover the current vocabulary.

Borders do not use an `on` family because they do not carry content. Transparent borders remain a
literal implementation value rather than a semantic color role.

## Secondary actions

An outlined secondary action combines the complete `background.action.secondary` state family with
`foreground.default` and `border.default`. Its resting fill is intentionally opaque rather than
transparent, allowing the control to retain a consistent neutral surface when placed on any
supported semantic background. The persistent border remains responsible for communicating the
control boundary when the default fill matches or closely approaches its surrounding surface.

Ghost actions remain transparent at rest and continue to use foundation `background.muted` and
`background.sunken` roles for hover and pressed states until the tertiary action contract is
implemented.

## Tertiary actions

A tertiary action combines a literal transparent resting background with
`background.action.tertiary.hover`, `background.action.tertiary.pressed`, `foreground.default`, and
a literal transparent border. The translucent state overlays preserve the character of the
underlying semantic surface and keep tertiary actions visually below opaque secondary actions.

`tertiary` names the semantic hierarchy and may support text buttons, icon buttons, toolbar
actions, and other low-emphasis controls. A component may retain a visual variant name such as
`ghost`; its component background tokens should alias the shared tertiary semantic roles. The
semantic vocabulary does not publish a `ghost` family because that name describes one component
appearance rather than a reusable action intent.

## Typography

Typography tokens describe complete, reusable text roles rather than independent public property
scales:

```text
semantic.typography.<role>[.<variant>].<property>
```

The published vocabulary contains ten recipes across `heading`, `body`, `label`, `eyebrow`, and
`code`. A role uses `large`, `default`, or `small` only when it needs more than one supported
expression. `default` is explicit whenever siblings exist; a single-expression role such as
`eyebrow` has no redundant variant segment.

### Recipe contract

Every recipe publishes five atomic leaf tokens beneath the same path:

- `fontFamily`;
- `fontSize`;
- `fontWeight`;
- `lineHeight`; and
- `letterSpacing`.

For example, the `body.default` contract is:

```text
semantic.typography.body.default.fontFamily
semantic.typography.body.default.fontSize
semantic.typography.body.default.fontWeight
semantic.typography.body.default.lineHeight
semantic.typography.body.default.letterSpacing
```

The shared `body.default` path is the recipe; the five leaves are the published tokens. Consumers
can address a leaf individually, and future composite tokens, utilities, or components may apply a
complete recipe as a convenience. System cohesion is guaranteed only when all five properties come
from the same recipe. A consumer that mixes leaves from different recipes owns the risk that later
remapping causes those values to drift apart.

Recipes remain complete even when values repeat. Every `body.*` recipe publishes its own
`fontFamily` leaf rather than inheriting a shared family token. This keeps each recipe portable and
allows its five properties to evolve as one contract.

Primitive typography values are implementation inputs, not the intended public API. The target
distribution will keep primitives private while semantic leaves alias them internally. A missing
recurring use case should produce a deliberate semantic recipe or component contract rather than
requiring consumers to depend on a primitive path.

### Published vocabulary

| Semantic recipe                       | Purpose                                                   | Family    | Size   | Weight    | Line height | Tracking |
| ------------------------------------- | --------------------------------------------------------- | --------- | ------ | --------- | ----------- | -------- |
| `semantic.typography.heading.large`   | Primary page and major region headings                    | `display` | `2xl`  | `medium`  | `tight`     | `tight`  |
| `semantic.typography.heading.default` | Standard section and card headings                        | `display` | `xl`   | `medium`  | `snug`      | `snug`   |
| `semantic.typography.heading.small`   | Compact headings within dense surfaces                    | `display` | `lg`   | `medium`  | `snug`      | `snug`   |
| `semantic.typography.body.default`    | Default interface copy and prose                          | `sans`    | `base` | `regular` | `normal`    | `normal` |
| `semantic.typography.body.small`      | Supporting copy, descriptions, and compact interface text | `sans`    | `sm`   | `regular` | `normal`    | `normal` |
| `semantic.typography.label.default`   | Control labels, buttons, tabs, and prominent metadata     | `sans`    | `sm`   | `medium`  | `snug`      | `normal` |
| `semantic.typography.label.small`     | Badges, compact metadata, and space-constrained labels    | `sans`    | `xs`   | `medium`  | `snug`      | `normal` |
| `semantic.typography.eyebrow`         | Short contextual text that introduces a following heading | `sans`    | `xs`   | `medium`  | `snug`      | `caps`   |
| `semantic.typography.code.default`    | Code blocks and technical values                          | `mono`    | `sm`   | `regular` | `normal`    | `normal` |
| `semantic.typography.code.small`      | Inline code and compact technical metadata                | `mono`    | `xs`   | `regular` | `normal`    | `normal` |

The values in the table are primitive suffixes. For example, the complete `eyebrow` recipe maps to
`primitives.font.sans`, `primitives.text.xs`, `primitives.weight.medium`,
`primitives.leading.snug`, and `primitives.tracking.caps` internally.

All heading recipes use the display family, currently Lora. Family is part of their semantic
distinction, so a compact heading does not switch to the sans family merely because its size is
closer to body text. Body and label use Source Sans 3; code uses JetBrains Mono.

### Typography and foreground composition

Color is not part of a typography recipe. Typographic role and content color are independent axes,
and combining them at the semantic leaf level would multiply the vocabulary for every muted,
disabled, brand, status, and explicit background-pairing case. Components and higher-level text
styles may combine the two contracts:

```text
semantic.typography.body.small + semantic.color.foreground.muted
semantic.typography.body.small + semantic.color.foreground.status.danger.default
semantic.typography.label.default + semantic.color.foreground.on.action.primary
semantic.typography.eyebrow + semantic.color.foreground.brand.default
```

Foreground semantics continue to own contrast requirements and supported background pairings.
Typography recipes are theme-independent and keep identical mappings in light and dark themes.

### Fixed text behavior

The five-leaf recipe does not include `text-transform`, text decoration, alignment, wrapping, or
truncation. These are application behaviors rather than independently customizable typography
values. A composite eyebrow style is expected to apply `text-transform: uppercase` alongside the
five `typography.eyebrow.*` leaves; source text can remain normally capitalized. Link underlines and
other decorations belong to the relevant style or component, while native elements such as `del`
continue to carry content semantics.

`eyebrow` names contextual text that precedes and introduces a heading. It does not participate in
the HTML heading hierarchy itself. The following heading remains an appropriate `h1`–`h6`, and its
visual recipe is chosen independently from its document level.

### Application rules

- Choose a recipe from the text's purpose, not from the primitive value it currently resolves to.
- Use all five leaves from one recipe for the cohesive, supported result. Individual leaves remain
  available for intentional composition, with the compatibility risk owned by the consumer.
- HTML heading levels express document structure; `heading.large`, `.default`, and `.small` express
  visual hierarchy and do not map directly to `h1`, `h2`, and `h3`.
- Responsive typography is a consumer composition concern. A consumer may switch from one complete
  semantic recipe to another at a breakpoint, but responsive behavior is not encoded in token
  names.
- Component names such as `button` and `badge` belong in the component tier, not the semantic
  typography vocabulary.

### Deferred typography roles

- Display or hero typography beyond the accepted heading hierarchy.
- Additional heading, body, label, eyebrow, or code variants.
- Link, quote, numeric, and data-visualization roles.
- Emphasized body or label variants. Use native emphasis semantics and inheritance unless a repeated
  visual contract emerges.
- Component-specific typography outside a component's published contract.

Add a role or variant only when a shipped consumer demonstrates that its typography must move as a
stable unit across the system.

## Size

**WIP:** To discuss.
