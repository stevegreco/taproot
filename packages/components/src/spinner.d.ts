export type SpinnerSize = "inherit" | "small" | "medium" | "large";

/** The attributes `<ds-spinner>` accepts, for typing framework templates. */
export interface DsSpinnerAttributes {
  /** What is loading, read as the accessible name. Empty or missing reads as `"Loading"`. */
  label?: string;
  /** Defaults to `"inherit"`, the surrounding text size. */
  size?: SpinnerSize;
}

/** `<ds-spinner>`: Use Spinner to show that something is loading or working when you cannot say how long it will take. */
export declare class DsSpinner extends HTMLElement {
  /** The accessible name. Returns `"Loading"` when the attribute is empty or missing. */
  label: string;
  /** Defaults to `"inherit"`. */
  size: SpinnerSize;
}

/** Registers `<ds-spinner>`, or an alias when given a tag name. Safe to call more than once. */
export declare function defineSpinner(tagName?: string): void;

declare global {
  interface HTMLElementTagNameMap {
    "ds-spinner": DsSpinner;
  }
}
