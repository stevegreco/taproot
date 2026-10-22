export type DividerOrientation = "horizontal" | "vertical";

/** The attributes `<ds-divider>` accepts, for typing framework templates. */
export interface DsDividerAttributes {
  /** Defaults to `"horizontal"`. */
  orientation?: DividerOrientation;
}

/** `<ds-divider>`: Use Divider to separate groups of related content within one surface or region with a thin line. */
export declare class DsDivider extends HTMLElement {
  /** Defaults to `"horizontal"`. */
  orientation: DividerOrientation;
}

/** Registers `<ds-divider>`, or an alias when given a tag name. Safe to call more than once. */
export declare function defineDivider(tagName?: string): void;

declare global {
  interface HTMLElementTagNameMap {
    "ds-divider": DsDivider;
  }
}
