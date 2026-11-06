---
id: guideline.accessibility
type: guideline
title: Accessibility
summary: Requirements every component shares, for keyboard focus, forced colors, color, and parts that are not controls.
tags:
  - accessibility
  - a11y
  - focus
  - forced-colors
  - high-contrast
  - color
rules:
  - id: visible-focus
    level: must
    topic: accessibility
    statement: Keyboard focus is visibly indicated on every focusable part, in every variant and state.
    applicability: A part of the component takes keyboard focus.
  - id: forced-colors
    level: must
    topic: accessibility
    statement: >-
      Under forced colors, every boundary, indicator, and focus ring that carries meaning stays
      visible, and each state stays distinguishable without the theme's colors.
  - id: not-color-alone
    level: must
    topic: accessibility
    statement: Meaning never depends on color alone. Text, shape, or position carries it too.
  - id: not-a-control
    level: must
    topic: behavior
    statement: The component is not focusable and does not activate.
    applicability: The component is not interactive.
---

Every component follows this guideline and inherits the rules above. A component narrows a rule to
say what it means for its own parts, such as which outline and indicator must stay visible.

## System colors under forced colors

Forced colors, such as Windows Contrast Themes, replace the page's colors with a small set that the
person chose. Backgrounds, shadows, and most colors are dropped. Meaning carried only by a fill
color disappears, and so does a boundary drawn only by a fill or a shadow.

Where a part keeps meaning under forced colors, draw it with the system color for its role:

| Role | System color |
| --- | --- |
| Text and the boundary of a surface, such as a card or dialog | `CanvasText` on `Canvas` |
| The boundary and text of a control's own surface, such as a button or field | `ButtonText` on `ButtonFace`, or `CanvasText` |
| A checked, selected, or strongly emphasized part, such as a checked box or a primary button | `Highlight`, with `HighlightText` on it |
| A focus ring | `Highlight` |
| A disabled part | `GrayText` |

Tones that only color a part, such as a badge's status or the difference between a primary and a
destructive button, look the same under forced colors. Their text says which one it is
(`not-color-alone`), so nothing is lost.

## Focus

Draw every focus ring with the system focus constants (`taproot format`), so focus looks the same
across components. A component that draws focus somewhere other than the focused part, such as
around a whole card, says so in its own `visible-focus` rule.
