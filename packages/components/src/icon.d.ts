export type IconSize = "inherit" | "small" | "medium" | "large";

/** The attributes `<ds-icon>` accepts, for typing framework templates. */
export interface DsIconAttributes {
  /** What the graphic means. Without it the icon is decorative and hidden from assistive technology. */
  label?: string;
  /** Defaults to `"inherit"`, the surrounding text size. */
  size?: IconSize;
}

/** `<ds-icon>`: Use Icon to size and color a graphic you supply, beside text or inside another component. */
export declare class DsIcon extends HTMLElement {
  /** What the graphic means. Empty means decorative. */
  label: string;
  /** Defaults to `"inherit"`. */
  size: IconSize;
}

/** Registers `<ds-icon>`, or an alias when given a tag name. Safe to call more than once. */
export declare function defineIcon(tagName?: string): void;

declare global {
  interface HTMLElementTagNameMap {
    "ds-icon": DsIcon;
  }
}
