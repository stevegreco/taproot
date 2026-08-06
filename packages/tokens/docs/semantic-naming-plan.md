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

Background tokens are used only for fills. The working vocabulary currently contains 14 roles.

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

To discuss. No secondary-action background names are proposed yet.

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
The working vocabulary contains ten roles. It distinguishes functional boundaries, which must remain
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

- Action-specific borders, including primary and secondary action families.
- Interaction states such as hover and pressed. Add a state only when the border itself changes.
- Additional brand or status variants.
- Separate divider, outline, inverse, or selected roles. The accepted foundation and intent roles
  cover the current vocabulary.

Borders do not use an `on` family because they do not carry content. Transparent borders remain a
literal implementation value rather than a semantic color role.

## Secondary actions

**WIP:** To discuss.

## Typography

**WIP:** To discuss.

## Size

**WIP:** To discuss.
