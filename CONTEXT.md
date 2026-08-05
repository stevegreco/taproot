# Design System — Domain Context

## Token Tiers

The system uses a three-tier token architecture:

| Term | Definition |
|---|---|
| **Primitive token** | Raw, scale-based values with no semantic meaning (e.g. `primitives.color.robRoy.700`, `primitives.space.4`). Components may consume one directly when no semantic intent fits and another alias would add no meaning. |
| **Semantic token** | Intent-named aliases that reference primitive tokens (e.g. `semantic.color.accent.default`). The normal styling API for components; theme-aware variants have identical paths and different resolved values. |
| **Component token** | A selective component-scoped contract (e.g. `component.button.primary.background`), created when independent customization, reuse, or API stability justifies it. Not every component property needs one. |

## Token Selection Policy

Components may consume semantic tokens directly. Component tokens are a limited specialization
layer, not a mandatory stop between semantic tokens and component CSS. They generally alias
semantic tokens and should exist only when they add a meaningful component contract, such as an
independent customization point, a shared component-specific decision, a named variant or state,
or insulation from an implementation detail likely to change.

A component may consume a primitive directly when no semantic intent fits and a component token
would only be a redundant wrapper. Never use a primitive when a semantic or component token already
expresses the same intent, and do not create aliases solely to force every value through every tier.

The full decision and examples are recorded in [[adr-0003-token-tier-consumption]].

## Token Identity

| Term | Definition |
|---|---|
| **Token path** | Dot-separated key sequence identifying a token (e.g. `component.button.primary.background`). Derived from the nested JSON structure. |
| **CSS variable** | The CSS custom property name emitted by Style Dictionary for a token (e.g. `--component-button-primary-background`). Derived mechanically from the token path. |
| **Resolved value** | The final computed value of a token after Style Dictionary has followed all alias references (e.g. `#a0501d`). Lives in `dist/tokens/`. |
| **Raw value** | The alias reference as written in the source token file (e.g. `{semantic.color.accent.default}`). Lives in `tokens/`. |

## Themes

The semantic tier has two theme variants: **light** (default) and **dark**. Token paths are identical across themes; only resolved values differ.

How values are expected to differ — mirrored ramps, interaction-state direction, and what a numbered ramp stop promises — is recorded in [[adr-0002-theming-policy]].

## MCP Server

A local MCP server (`mcp/index.js`) that exposes design tokens to AI assistants and developer tooling. Reads from built output (`dist/tokens/`). See [[adr-0001-mcp-reads-from-dist]].

### Tools

| Tool | Description |
|---|---|
| `search_tokens` | Substring search across token paths and resolved values. Accepts optional `tier`, `type`, and `theme` filters. Defaults to light theme. |
| `get_token` | Exact lookup by token path. Returns a single [[Token Result]] or an error. Accepts optional `theme` parameter. |

### Token Result

The shape returned by both MCP tools. `value` is theme-dependent at every tier, including the component tier:

| Field | Light | Dark |
|---|---|---|
| `path` | `component.button.primary.background` | `component.button.primary.background` |
| `cssVariable` | `--component-button-primary-background` | `--component-button-primary-background` |
| `value` | `#a0501d` | `#e1ac3e` |
| `type` | `color` | `color` |
| `tier` | `component` | `component` |

Theme-dependent component tokens generally alias the semantic tier, so
`component.button.primary.background` always equals `semantic.color.accent.default` in the same
response. The two platforms carry that differently:

- **CSS** emits `var()` chains (`outputReferences: true`), so one `components.css` is correct for both themes and swaps at runtime.
- **JSON** has no equivalent — `json/nested` resolves aliases to literals — so the component tier is built once per theme as `components.light.json` and `components.dark.json`.

### Stale Build Detection

On every tool call, the MCP compares the `mtime` of source token files (`tokens/`) against the dist files (`dist/tokens/`). If any source file is newer, a warning is appended to the response.

## Guardrails

Checks that run as the last step of `pnpm build`, after `dist/` exists — they read resolved values, so they cannot run against source.

`pnpm audit` runs both. Contrast asks whether a pair is legible; parity asks whether the two themes are the same system. TOK-01 passed every contrast check it was subject to and was still wrong, which is why both exist.

| Script | Checks |
|---|---|
| `scripts/audit-contrast.js` | WCAG 2.1 contrast for every semantic foreground/background pair in both themes. Distinguishes 4.5:1 text pairs from 3:1 non-text (1.4.11) pairs; disabled states are computed but exempt. |
| `scripts/audit-parity.js` | Structural equivalence of the two themes, enforcing the machine-checkable half of [[adr-0002-theming-policy]]: identical key sets, every color token responds to the theme, and interaction states step the direction §2 requires. |
| `scripts/audit-ramps.js` | Ramp integrity per [[adr-0002-theming-policy]] §3 — monotonic lightness, saturation held within bounds, hue drifting without reversing. Catches a surface fill being given a ramp position it hasn't earned. |

All three are **blocking** — any failure exits non-zero and fails `pnpm build`. They ran report-only while the remediation landed; #8, #11 and #17 cleared the last of it, so the gate is now what keeps it clear. `pnpm audit --report-only` prints the full picture without failing, which is useful mid-change.

### Surfaces are not ramp stops

`primitives.color.surface.*` holds dark, desaturated, hue-tinted fills — the dark theme's status and accent backgrounds. They are deliberately outside the numbered ramps: a surface is not "one step darker" than anything, and giving it a stop number makes the ramp lie about what its numbers mean. `audit-ramps.js` enforces the separation, keyed on saturation, because a fill collapses 30–45 points below its neighbours while a true stop holds a tight band.

### Elevation is a semantic tier, not a primitive one

`primitives.shadow.*` is a warm brown tuned for light grounds; `primitives.shadowInk.*` is a near-black at roughly 4× the opacity, for dark ones. Neither is "the" shadow set — `semantic.elevation.{xs,sm,md,lg,xl,inset}` picks between them per theme, and components reference only that. The primitives are named for the pigment rather than the theme, the same reason `surface` is named for its role: a primitive describes what a value *is*, not who consumes it.

`elevation` lives in the per-theme files rather than `shape.tokens.json` precisely because it is the thing that has to differ between themes; radius, which does not, stays shared.

### Why parity compares tokens to themselves

The obvious mirroring test — "is the token darker than the page in light and lighter than it in dark?" — passes for `status.danger.default`, the exact token TOK-01 is about. Its L\* is 45 in both themes, the light page is L\*97 and the dark page is L\*10, so it satisfies the test without ever moving. The page moved past it. The assertion has to compare a token against **itself across themes**.

## Docs

| File | Description |
|---|---|
| `docs/token-docs.html` | Visual reference of all resolved token values across all tiers and themes. Open in a browser; no build step required. |
| `docs/agent-architecture.html` | Diagram of the agent/MCP architecture for this system. |
| `docs/token-architecture-audit.md` | Audit of the token architecture (2026-07-28). 12 findings covering theming inconsistency, ramp integrity, and contrast. |
| `docs/token-remediation-plan.md` | Work breakdown acting on the audit findings, with dependencies and release sequencing. |
