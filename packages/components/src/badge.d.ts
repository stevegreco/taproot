export type BadgeVariant = "default" | "accent" | "success" | "danger" | "warning" | "info";

export declare class DsBadge extends HTMLElement {
  /** Reflects the `variant` attribute. Defaults to `"default"`. */
  variant: BadgeVariant;
}

/** Registers the element. Safe to call more than once. Defaults to `"ds-badge"`. */
export declare function defineBadge(tagName?: string): void;

declare global {
  interface HTMLElementTagNameMap {
    "ds-badge": DsBadge;
  }
}
