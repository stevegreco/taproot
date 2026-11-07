---
id: guideline.page-setup
type: guideline
title: Page setup
summary: Set the page's base font, text color, background, and heading type from semantic tokens, because components style only themselves.
tags:
  - page
  - layout
  - typography
  - type
  - text
  - heading
  - font
  - body
  - background
  - theme
  - base-styles
  - setup
rules:
  - id: load-tokens
    level: must
    topic: behavior
    statement: >-
      Load the token package once, at the root of the page, before any component renders. Without
      it, components have no colors, spacing, or type.
  - id: page-base-text
    level: must
    topic: behavior
    statement: >-
      The page's base text uses the body recipe, `semantic.typography.body.md`, in
      `semantic.color.foreground.default`. Text the components do not draw would otherwise fall
      back to the platform's default font and color.
  - id: page-background
    level: must
    topic: behavior
    statement: >-
      The page background is `semantic.color.background.default`, so it follows the active theme
      with the components on it.
  - id: heading-recipes
    level: should
    topic: behavior
    statement: >-
      Each heading level uses a heading recipe: the page title `semantic.typography.heading.lg`,
      section headings `semantic.typography.heading.md`, subsection headings
      `semantic.typography.heading.sm`, and deeper levels `semantic.typography.title`. Choose the
      level by the document outline, and the recipe by the level.
  - id: base-stylesheet
    level: should
    topic: behavior
    statement: >-
      Where the token package offers a base stylesheet for your technology, load it rather than
      writing the page defaults by hand. It applies these rules with names that are already right.
  - id: no-guessed-names
    level: must
    topic: behavior
    statement: >-
      Take each token's name in your technology from the token package or a lookup, never from a
      guess. A misspelled token name fails silently and the platform default shows instead.
links:
  related:
    - guideline.compose-or-propose
    - guideline.accessibility
---

The components style only themselves. The page around them, the text between them, and the
headings above them get no style from any component. Without these defaults, components look right
while the page around them falls back to the platform's serif font and plain white, and nothing
reports the gap.

## What the page sets

| Page element | Token | Notes |
| --- | --- | --- |
| Background | `semantic.color.background.default` | The page itself. Raised areas use `semantic.color.background.surface`. |
| Base text | `semantic.typography.body.md` | Font family, size, weight, line height, and letter spacing. |
| Text color | `semantic.color.foreground.default` | Supporting text uses `semantic.color.foreground.muted`. |
| Small print | `semantic.typography.body.sm` | Captions and fine print. |
| Page title (level 1) | `semantic.typography.heading.lg` | One per page. |
| Section heading (level 2) | `semantic.typography.heading.md` | |
| Subsection heading (level 3) | `semantic.typography.heading.sm` | The recipe Card uses for its title. |
| Deeper headings (levels 4 to 6) | `semantic.typography.title` | The bold sans title Alert and Dialog use. |
| Code | `semantic.typography.code.md` | Inline code and code blocks. |
| Eyebrow above a heading | `semantic.typography.eyebrow` | A short category line, not a heading. |

A typography token such as `semantic.typography.body.md` is a recipe: it groups a font family,
size, weight, line height, and letter spacing, and each is its own token
(`semantic.typography.body.md.fontFamily`). Set all five together. Mixing parts of two recipes
produces a size and line height that were never designed together.

For the values in each theme, read the token package, or resolve a component that uses the
recipe, such as `taproot tokens card --part title --resolve`.

## Fonts

The font tokens name the system's typefaces with fallbacks. The token package does not ship the
font files. Load the typefaces the way your platform does, before the page renders; the token
package's readme lists them. Without them, the fallbacks keep the page readable but it does not
look like the system.

## Theme

The token package follows the reader's light or dark preference, and lets the page choose one
instead. Set the theme at the root of the page so the background, the base text, and every
component change together. A part of the page that sets its own colors without semantic tokens
does not change with them.

## Spacing and layout

Lay out the page with the spacing primitives, `primitives.space.*`, and put product layout
between components rather than inside them (`guideline.compose-or-propose`). The system has no
grid, container, or page template component; compose those in product code.
