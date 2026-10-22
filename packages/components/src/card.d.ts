/** The attributes `<ds-card>` accepts, for typing framework templates. */
export interface DsCardAttributes {
  label?: string;
  href?: string;
  /** Defaults to `3`. */
  "heading-level"?: number;
}

/** `<ds-card>`: Use Card to present one subject as a bounded summary, such as an item in a collection, that a person can scan and act on. */
export declare class DsCard extends HTMLElement {
  label: string;
  href: string;
  /** Defaults to `3`. */
  headingLevel: number;
}

/** Registers `<ds-card>`, or an alias when given a tag name. Safe to call more than once. */
export declare function defineCard(tagName?: string): void;

declare global {
  interface HTMLElementTagNameMap {
    "ds-card": DsCard;
  }
}
