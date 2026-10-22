export type TooltipPlacement = "above" | "below";

/** The attributes `<ds-tooltip>` accepts, for typing framework templates. */
export interface DsTooltipAttributes {
  /** The text the bubble shows, and the trigger's accessible name. Required. */
  label?: string;
  /** Defaults to `"above"`. The bubble moves to the other side when there is no room. */
  placement?: TooltipPlacement;
}

/**
 * `<ds-tooltip>`: Use Tooltip to show the name of an icon-only control when a person points at it or focuses it.
 *
 * Wrap one focusable control. The tooltip sets that control's `aria-label` to `label`.
 */
export declare class DsTooltip extends HTMLElement {
  /** The bubble's text and the trigger's accessible name. */
  label: string;
  /** Defaults to `"above"`. */
  placement: TooltipPlacement;
}

/** Registers `<ds-tooltip>`, or an alias when given a tag name. Safe to call more than once. */
export declare function defineTooltip(tagName?: string): void;

declare global {
  interface HTMLElementTagNameMap {
    "ds-tooltip": DsTooltip;
  }
}
