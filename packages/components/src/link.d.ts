export type LinkVariant = "inline" | "standalone";

/** The attributes `<ds-link>` accepts, for typing framework templates. */
export interface DsLinkAttributes {
  /** Destination. Without it the control is not a link and cannot receive focus. */
  href?: string;
  /** Defaults to `"inline"`. */
  variant?: LinkVariant;
}

/** `<ds-link>`: Use Link to navigate to another page, a location on the page, or a resource. */
export declare class DsLink extends HTMLElement {
  /** Destination. Without it the control is not a link and cannot receive focus. */
  href: string;
  /** Defaults to `"inline"`. */
  variant: LinkVariant;

  /** Focuses the inner `<a>`. */
  focus(options?: FocusOptions): void;
  /** Blurs the inner `<a>`. */
  blur(): void;
}

/** Registers `<ds-link>`, or an alias when given a tag name. Safe to call more than once. */
export declare function defineLink(tagName?: string): void;

declare global {
  interface HTMLElementTagNameMap {
    "ds-link": DsLink;
  }
}
