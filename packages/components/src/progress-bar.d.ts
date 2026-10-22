/** The attributes `<ds-progress-bar>` accepts, for typing framework templates. */
export interface DsProgressBarAttributes {
  /** Visible text that names the task. Also the accessible name. Required. */
  label: string;
  /** How much is done, from 0 to `max`. Defaults to `0`; out-of-range values are clamped. */
  value?: number;
  /** The amount that means done. Defaults to `100`; a value that is not a positive number reads as `100`. */
  max?: number;
}

/** `<ds-progress-bar>`: Use Progress bar to show how much of a task is done when you can measure it, such as an upload or a multi-step setup. */
export declare class DsProgressBar extends HTMLElement {
  /** Visible text that names the task. Also the accessible name. */
  label: string;
  /** How much is done. Reads back clamped to 0 through `max`. Defaults to `0`. */
  value: number;
  /** The amount that means done. Reads back as `100` when missing or not a positive number. */
  max: number;
}

/** Registers `<ds-progress-bar>`, or an alias when given a tag name. Safe to call more than once. */
export declare function defineProgressBar(tagName?: string): void;

declare global {
  interface HTMLElementTagNameMap {
    "ds-progress-bar": DsProgressBar;
  }
}
