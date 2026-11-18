# Building with Taproot

Taproot ships as web components (`<ds-button>`, `<ds-alert>`, …). Every export on `window.Taproot` is a
thin React wrapper that renders one of those elements. The elements style themselves inside shadow DOM,
so you cannot restyle them with classes. Choose the look through props, and use tokens for your own
layout.

## Setup

- No provider is needed. Load `styles.css` (it brings the tokens, the page base styles, and the
  Lora / Source Sans 3 / JetBrains Mono fonts) and `_ds_bundle.js`. The bundle registers every element.
- Theme: the tokens follow the OS color scheme. To force one, set `data-theme="light"` or
  `data-theme="dark"` on `<html>`. Do not set it on an inner element.
- `styles.css` also styles `body` and `h1`–`h6` (font, color, background). Plain text and headings
  you write already match. Don't override the font family.

## Props, children, slots, events

- Props are camelCase forms of the element's attributes: `fullWidth`, `headingLevel`, `dismissLabel`.
  Button's accessible name is `aria-label`. Read each `<Name>.d.ts` for the exact set and values.
- Children go in the default slot. Put a child in a named slot with `slot`: Alert has `icon` and
  `actions`; Card has `media` and `actions`; Dialog has `actions`.
- Compound parts: `Accordion` takes `AccordionSection label=…` children; `Tabs` takes
  `TabPanel label=… value=…` children (`value` on Tabs picks the selected tab).
- `Select` and `RadioGroup` take native `<option>` (and `<optgroup>`) children. Don't pass an options prop.
- `Icon` wraps an inline `<svg>` you supply. There is no icon set. Give `label` only when the icon
  carries meaning by itself.
- Events: `onChange`, `onInput`, `onClick`, `onClose`, `onDismiss`, `onToggle`. Read state from
  `event.currentTarget` (`.value`, `.checked`). For controlled use, pass `value`/`checked`/`open` and update them in the handler.
- Dialog is controlled with `open` plus `onClose`. Close it from action buttons by setting `open` to false.

## Tokens for your own layout

Use `var(--…)` with the real names. Never hard-code colors or fonts.

| Need | Tokens |
|---|---|
| Spacing (gap, padding) | `--ds-primitives-space-1` … `-2 -3 -4 -5 -6 -8 -10 -12 -16 -20 -24 -32` |
| Page and surfaces | `--ds-semantic-color-background-default`, `-surface`, `-sunken` |
| Text | `--ds-semantic-color-foreground-default`, `-muted`, `--ds-semantic-color-foreground-brand-default` |
| Borders and radius | `--ds-semantic-color-border-default`, `--ds-semantic-radius-surface`, `--ds-semantic-radius-control` |
| Shadow | `--ds-semantic-elevation-sm`, `-md`, `-lg` |
| Type | `--ds-semantic-typography-<role>-font-size` and the same with `-font-family`/`-font-weight`/`-line-height`; roles: `title`, `heading-lg`, `heading-md`, `heading-sm`, `body-md`, `body-sm`, `label-md`, `label-sm`, `eyebrow`, `code-md`, `code-sm` |

The full list is in `tokens/` and `styles.css`. Per-component usage is in `components/components/<Name>/<Name>.prompt.md`.

## Example

```jsx
const { Card, Badge, Button, TextField, Alert } = window.Taproot;

<div style={{ display: "grid", gap: "var(--ds-primitives-space-4)", maxWidth: 360 }}>
  <Alert variant="success" label="Changes saved">Your profile is up to date.</Alert>
  <TextField label="Email address" type="email" hint="We only use this to send receipts." />
  <Card label="Quarterly revenue report" href="#q3-report">
    Revenue grew 12% over the previous quarter.
    <Badge variant="success">Published</Badge>
    <Button slot="actions" variant="tertiary" size="small">Share</Button>
  </Card>
</div>
```
