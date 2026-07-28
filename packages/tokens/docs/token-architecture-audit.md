# Token Architecture Audit

**Date:** 2026-07-28
**Scope:** `packages/tokens` — 488 lines across 9 source files, 3 tiers, 2 themes
**Method:** Static review of token sources and build config; WCAG 2.1 contrast and CIE L\* computed from resolved values; hue/saturation measured in HSL.

Findings are recorded here as a durable audit record. The work breakdown that acts on them lives in [token-remediation-plan.md](./token-remediation-plan.md).

## Summary

12 findings: 2 critical, 5 major, 5 minor. 5 of 26 tested contrast pairs fail.

The headline defect is a **theming policy applied inconsistently**. `semantic.color.accent.*` inverts lightness between themes; `semantic.color.status.*` does not. Button variants that read as one family in light mode stop doing so in dark mode. The root cause is structural: the status color ramps expose 4 stops where the brand ramps expose 13, so status tokens have nothing to flip *to*.

| ID | Severity | Finding |
|---|---|---|
| [TOK-01](#tok-01) | Critical | Accent is theme-responsive; status is not |
| [TOK-02](#tok-02) | Critical | Hover moves in opposite directions within one theme |
| [TOK-03](#tok-03) | Major | Status ramps have 4 stops; brand ramps have 13 |
| [TOK-04](#tok-04) | Major | Terminal ramp stops are surface fills in disguise |
| [TOK-05](#tok-05) | Major | No dark-theme elevation |
| [TOK-06](#tok-06) | Major | JSON build flattens aliases, so the MCP `theme` flag lies |
| [TOK-07](#tok-07) | Major | `border.default` fails 3:1 in both themes |
| [TOK-08](#tok-08) | Minor | Two tokens for one concept |
| [TOK-09](#tok-09) | Minor | Dead token in the public API |
| [TOK-10](#tok-10) | Minor | Status group is asymmetric |
| [TOK-11](#tok-11) | Minor | Press state coverage is uneven |
| [TOK-12](#tok-12) | Minor | Components reach past the semantic tier |

---

## Critical

### TOK-01

**Accent is theme-responsive; status is not**

`semantic.color.accent.default` flips `robRoy.700 → robRoy.400` between themes — a 30-point L\* jump — and `accent.foreground` flips with it from near-white to near-black. All four `status.*.default` tokens hold a single value across both themes.

| Token | Light | L\* | Dark | L\* | Moves? |
|---|---|---|---|---|---|
| `accent.default` | `#a0501d` | 43 | `#e1ac3e` | 73 | flips |
| `accent.foreground` | `#faf6f0` | 97 | `#171c1a` | 10 | flips |
| `status.danger.default` | `#b8472a` | 45 | `#b8472a` | 45 | **static** |
| `status.danger.onDefault` | `#ffffff` | 100 | `#ffffff` | 100 | **static** |
| `status.success.default` | `#6b8e5a` | 55 | `#6b8e5a` | 55 | **static** |
| `status.info.default` | `#4a7896` | 48 | `#4a7896` | 48 | **static** |

Consequence, measured against each theme's page background:

| | Light | Dark |
|---|---|---|
| Primary button vs page | 5.33 | 8.36 |
| Danger button vs page | 4.91 | **3.26** |

In light mode the two are near-twins. In dark mode primary is a luminous gold chip and danger barely separates from the background. The inconsistency — not the flip itself — is what reads as the buttons changing dramatically between modes.

**Files:** `tokens/semantic/light.tokens.json`, `tokens/semantic/dark.tokens.json`

### TOK-02

**Hover moves in opposite directions within one theme**

In dark mode, hovering primary steps toward the *light* end of the ramp while hovering danger steps toward the *dark* end:

| Variant | Dark rest | Dark hover | L\* | Direction |
|---|---|---|---|---|
| Primary | `robRoy.400` | `robRoy.300` | 73 → 81 | lighter |
| Danger | `rust.500` | `rust.700` | 45 → 32 | darker |

Same theme, same component, same gesture, inverted feedback. No written rule governs interaction-state direction, so both were locally defensible when authored.

**Files:** `tokens/semantic/dark.tokens.json:25-27`, `:50-52`

---

## Major

### TOK-03

**Status ramps have 4 stops; brand ramps have 13**

Root cause of TOK-01 and TOK-02.

| Ramp | Stops | Values |
|---|---|---|
| `robRoy` | 13 | 50, 100, 200, 300, 400, 500, 600, 700, 800, 850, 900, 925, 950 |
| `blueSmoke` | 12 | 50 … 900, 950, 975 |
| `clay` | 10 | 50 … 900 |
| `rust` | **4** | 100, 500, 700, 900 |
| `moss` | **4** | 100, 500, 700, 900 |
| `sky` | **4** | 100, 500, 700, 900 |

There is no `rust.400`, so `status.danger` *cannot* mirror what `accent` does — the token it would need does not exist. The dark theme was authored as far as the palette allowed, then stopped.

**Files:** `tokens/primitives.tokens.json:47-64`

### TOK-04

**Terminal ramp stops are surface fills in disguise**

Lightness stays monotonic across every ramp, so nothing in the build warns. But hue and chroma break at the end of the short ramps — these values were retrofitted as dark-mode backgrounds and given ramp positions they don't earn.

| Stop | Hex | Hue | Sat | Reads as |
|---|---|---|---|---|
| `rust.500` | `#b8472a` | 12.3° | 63% | true ramp stop |
| `rust.700` | `#84301c` | 11.5° | 65% | true ramp stop |
| `rust.900` | `#483930` | 22.5° | 20% | **surface fill** |
| `moss.900` | `#394739` | 120.0° | 11% | **surface fill** |
| `sky.900` | `#34464a` | 190.9° | 18% | **surface fill** |
| `robRoy.850` | `#51432d` | 36.7° | 29% | **surface fill** |
| `robRoy.925` | `#3a2e1e` | 34.3° | 32% | **surface fill** |

Neighbouring true stops hold hue within ~1° and saturation within ~3 points. These break by 10–30° and drop 30–50 points of saturation, so "one stop darker" means different things depending on where you are in the ramp.

**Files:** `tokens/primitives.tokens.json:16,18,51,57,63`

### TOK-05

**No dark-theme elevation**

All eight shadow primitives are `rgba(61, 26, 11, …)` — a warm brown tuned for light grounds. On a `#171c1a` surface they are invisible, so cards and inputs lose elevation entirely in dark mode. There is no semantic elevation tier at which to swap them; components reference `primitives.shadow.*` directly.

**Files:** `tokens/primitives.tokens.json:132-141`, consumed by `tokens/components/card.tokens.json`, `input.tokens.json`

### TOK-06

**JSON build flattens aliases, so the MCP `theme` flag lies**

*Not an architecture defect.* The component tier correctly references the semantic tier, and because the CSS platform sets `outputReferences: true` it emits `var(--semantic-color-accent-default)` chains that swap with the theme as designed. **CSS consumers are unaffected.**

The bug is in the other platform. `json/nested` resolves aliases to literal hex, and `loadTokens(theme)` swaps the semantic file while always loading the single light-built `components.json`:

```js
// src/read-tokens.js
for (const file of [DIST.primitives, semanticFile, DIST.components])
//                                   ^ swaps       ^ never swaps
```

A dark-theme request returns a payload that contradicts itself:

```
LIGHT  semantic.color.accent.default #a0501d   component.button.primary.background #a0501d
DARK   semantic.color.accent.default #e1ac3e   component.button.primary.background #a0501d  ← stale
```

A component token whose entire definition is "equals `accent.default`" reports a value disagreeing with `accent.default` in the same response. This breaks the contract documented in [CONTEXT.md](../../../CONTEXT.md), which advertises a `theme` parameter on both MCP tools. ADR-0001's mtime staleness check does not catch it — the build is current; the format is lossy.

**Files:** `style-dictionary.config.js:70-77`, `src/read-tokens.js:57-68`

### TOK-07

**`border.default` fails 3:1 in both themes**

| | Light | Dark |
|---|---|---|
| `border.default` vs page | 1.51 | 1.53 |

Input borders and secondary/ghost button borders are effectively invisible. For text inputs the border is the sole boundary indicator, making this a WCAG 1.4.11 (Non-text Contrast) failure rather than a stylistic preference.

**Files:** `tokens/semantic/light.tokens.json:19`, `tokens/semantic/dark.tokens.json:19`

---

## Minor

### TOK-08

**Two tokens for one concept**

`semantic.color.foreground.onAccent` and `semantic.color.accent.foreground` hold byte-identical values in both themes (`clay.50` / `blueSmoke.950`). `button.tokens.json` uses the second; `examples/dashboard.css:721` uses the first. Two names for one job will drift.

### TOK-09

**Dead token in the public API**

`semantic.color.secondary.hover` is defined in both themes and consumed by zero components — button's secondary hover uses `secondary.soft` instead. It ships in the published CSS as a trap.

### TOK-10

**Status group is asymmetric**

`status.danger` carries `onDefault` and `hover`; `success`, `warning` and `info` carry neither. The group presents as a uniform set of four, but only one member can back a solid button.

### TOK-11

**Press state coverage is uneven**

| Variant | hover | press | disabled |
|---|---|---|---|
| primary | yes | yes | yes |
| secondary | yes | *same token as hover* | yes |
| ghost | yes | **none** | yes |
| danger | yes | **none** | yes |

Secondary's press points at `secondary.soft`, identical to its hover, so pressing produces no visual feedback.

**Files:** `tokens/components/button.tokens.json:24-51`

### TOK-12

**Components reach past the semantic tier**

Components take color from the semantic tier but shape and depth straight from primitives. `input.radius` uses `primitives.radius.sm` (6px), routing around `semantic.radius.control` (10px) — so inputs and buttons have mismatched corners and the tier that exists to keep them in sync was bypassed.

**Files:** `tokens/components/input.tokens.json:14`, `card.tokens.json:6-8`

---

## Contrast reference

26 pairs tested. Full results for the notable ones:

| Pair | Light | Dark | Requirement |
|---|---|---|---|
| `border.default` vs page | 1.51 FAIL | 1.53 FAIL | 3:1 non-text |
| `foreground.faint` vs `background.raised` | 3.41 FAIL | 2.41 FAIL | 4.5:1 text |
| `disabled.fg` vs `disabled.bg` | 4.42 low | 5.40 pass | exempt, inconsistent |
| `status.danger.default` vs page | 4.91 pass | 3.26 low | 3:1 non-text |
| `accent.default` vs `accent.foreground` | 5.33 pass | 8.36 pass | 4.5:1 text |
| `status.danger.default` vs `onDefault` | 5.29 pass | 5.29 pass | 4.5:1 text |
| `secondary.default` vs page | 8.68 pass | 10.61 pass | 4.5:1 text |
| `foreground.default` vs page | 16.02 pass | 16.02 pass | 4.5:1 text |
