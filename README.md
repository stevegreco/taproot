# @stevegreco/design-system

Design tokens for the Ember & Sage design system — distributed as CSS custom properties and JSON. Built with [Style Dictionary](https://styledictionary.com).

## Install

```bash
pnpm add @stevegreco/design-system
```

## Quick start

Link the single CSS file once at the root of your app. All token tiers are included.

```html
<link rel="stylesheet" href="node_modules/@stevegreco/design-system/dist/css/tokens.css" />
```

Or import via a bundler:

```js
import "@stevegreco/design-system/css";
```

Then use tokens in your CSS:

```css
.card {
  background: var(--semantic-color-background-surface);
  border: 1px solid var(--semantic-color-border-default);
  color: var(--semantic-color-foreground-default);
}

.btn-primary {
  background: var(--semantic-color-background-action-primary-default);
  color: var(--semantic-color-foreground-on-action-primary);
  border-radius: var(--semantic-radius-control);
}
```

## Fonts

The design system uses three typefaces, each mapped to a font token:

| Token                       | Family         | Role                             |
| --------------------------- | -------------- | -------------------------------- |
| `--primitives-font-display` | Lora           | Headings, card titles, logotype  |
| `--primitives-font-sans`    | Source Sans 3  | Body text, UI labels, buttons    |
| `--primitives-font-mono`    | JetBrains Mono | Code, token values, numeric data |

Each token includes a system fallback stack, so the UI remains readable if Google Fonts fails to load. To use the intended typefaces, add the following `<link>` tags to your document `<head>` **before** the tokens stylesheet:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400..700;1,400..700&family=Source+Sans+3:wght@300..900&family=JetBrains+Mono:wght@400;500;600&display=swap"
  rel="stylesheet"
/>
```

The `display=swap` parameter ensures text renders immediately in the fallback font while the custom fonts load, avoiding invisible text during page load.

If you are using a bundler with a `<head>` injection plugin (e.g. Vite's `vite-plugin-html`) or a framework like Next.js, load the fonts using your framework's preferred font mechanism instead of a raw `<link>` tag.

## Token architecture

Primitive and semantic tokens form the shared foundation. A component tier is
available only where a published component contract adds a useful customization boundary.

```
Primitives  →  Semantic  →  Component (optional)
  (scale)       (intent)       (scoped API)
```

| Tier          | Prefix           | Use when                                                     |
| ------------- | ---------------- | ------------------------------------------------------------ |
| **Primitive** | `--primitives-*` | No semantic role expresses the raw scale choice              |
| **Semantic**  | `--semantic-*`   | Styling components and product interfaces by intent          |
| **Component** | `--component-*`  | Styling or customizing a component with a published contract |

### Semantic token groups

| Group                       | Example                                              | Purpose                                 |
| --------------------------- | ---------------------------------------------------- | --------------------------------------- |
| `background`                | `--semantic-color-background-default`                | Page and surface fills                  |
| `foreground`                | `--semantic-color-foreground-muted`                  | Text and icon colors                    |
| `border`                    | `--semantic-color-border-default`                    | Dividers and outlines                   |
| `background.action.primary` | `--semantic-color-background-action-primary-default` | Primary interactions                    |
| `background.brand`          | `--semantic-color-background-brand-muted`            | Brand surfaces                          |
| `foreground.on`             | `--semantic-color-foreground-on-action-primary`      | Content paired with a specific fill     |
| `*.status.*`                | `--semantic-color-background-status-success-default` | Feedback surfaces, content, and borders |

## Theming

With no `data-theme` attribute on `<html>`, semantic tokens follow the user's system preference. A
dark system preference activates the dark theme through `prefers-color-scheme`; light is the
default.

Set `data-theme` to override the system preference. The attribute always takes priority.

```html
<html data-theme="light"></html>
<html data-theme="dark"></html>
```

```js
document.documentElement.setAttribute("data-theme", "dark");
document.documentElement.setAttribute("data-theme", "light");
document.documentElement.removeAttribute("data-theme"); // follow the system preference
```

When the attribute is absent, changes to the system preference apply without JavaScript or a page
refresh. The stylesheet also sets `color-scheme`, so supported browser controls and scrollbars
match the active theme.

The sidebar and other always-dark surfaces should define their own local aliases referencing primitive tokens, since they are not affected by the semantic theme switch.

## JSON tokens

Resolved token values are also available as JSON for use in design tooling, style pipelines, or non-CSS targets.

```js
import primitives from "@stevegreco/design-system/tokens/primitives";
import semantic from "@stevegreco/design-system/tokens/semantic-light";
import components from "@stevegreco/design-system/tokens/components";
```

The semantic tier is theme-specific. Import the semantic file that matches the
theme whose resolved values you need.

```js
import semantic from "@stevegreco/design-system/tokens/semantic-dark";
```

Descriptions are theme-independent. Import the meta file to read every semantic token's type and purpose. `description` is the token's own purpose, or null when none has been written. `groupDescription` is the purpose of a parent group, used by typography recipes, or null when the token has no described group.

```js
import semanticMeta from "@stevegreco/design-system/tokens/semantic-meta";
```

The CSS build needs no such split: `dist/css/tokens.css` carries both themes and swaps at runtime.

## Build outputs

| File                              | Contents                                              |
| --------------------------------- | ----------------------------------------------------- |
| `dist/css/tokens.css`             | Primitive, semantic light/dark, and component aliases |
| `dist/tokens/primitives.json`     | Raw primitive scale values                            |
| `dist/tokens/semantic.light.json` | Resolved semantic tokens for light theme              |
| `dist/tokens/semantic.dark.json`  | Resolved semantic tokens for dark theme               |
| `dist/tokens/semantic.meta.json`  | Type and purpose for every semantic token             |
| `dist/tokens/components.json`     | Theme-independent references to shared tokens         |

## Building from source

```bash
pnpm install
pnpm run build
```

Source tokens live in `src/tokens/`. Never edit `dist/` files directly — they are regenerated on every build.

### Developing this repository

`pnpm --filter <pkg> build` and `pnpm --filter <pkg> test` skip Turbo's `^build` graph. On a clean
tree they fail looking for missing `dist/` files. From the repository root, use Turbo to build or
test one package and its workspace dependencies:

```bash
pnpm exec turbo run build --filter=documentation
pnpm exec turbo run test --filter=documentation
pnpm test
```

`pnpm build` and `pnpm test` are `turbo run` wrappers. After packages are already built,
`pnpm exec vitest run` still runs the Vitest workspace from the repo root.

## Publish checklist

1. `pnpm run build`
2. Bump version in `package.json`
3. `pnpm publish`
