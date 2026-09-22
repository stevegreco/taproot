export type LinkVariant = "inline" | "standalone";

export declare class DsLink extends HTMLElement {
  static readonly observedAttributes: string[];

  /** Reflects the `href` attribute. Empty when there is no destination. */
  href: string;
  /** Reflects the `variant` attribute. Defaults to `"inline"`. */
  variant: LinkVariant;

  focus(options?: FocusOptions): void;
  blur(): void;
  /** Activates the inner anchor, as a native `<a>.click()` would. */
  click(): void;
}

/** Registers the element. Safe to call more than once. Defaults to `"ds-link"`. */
export declare function defineLink(tagName?: string): void;

declare global {
  interface HTMLElementTagNameMap {
    "ds-link": DsLink;
  }
}
