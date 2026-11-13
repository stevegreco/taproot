/** The attributes `<ds-slider>` accepts, for typing framework templates. */
export interface DsSliderAttributes {
  label?: string;
  hint?: string;
  error?: string;
  value?: number;
  /** Defaults to `0`. */
  min?: number;
  /** Defaults to `100`. */
  max?: number;
  /** Defaults to `1`. */
  step?: number;
  name?: string;
  disabled?: boolean;
}

/** `<ds-slider>`: Use Slider to choose one number from a continuous range when the approximate value matters more than the exact one. */
export declare class DsSlider extends HTMLElement {
  /** Visible label. This is the accessible name. */
  label: string;
  /** Supporting guidance, read as part of the description. */
  hint: string;
  /** What to fix. A non-empty value marks the slider invalid and blocks form submission. */
  error: string;
  /**
   * The current value, always between min and max and on a step. The `value` attribute sets the
   * initial value, which form reset restores. Setting this property fires no events.
   */
  value: number;
  /** Defaults to `0`. */
  min: number;
  /** Defaults to `100`. */
  max: number;
  /** Defaults to `1`. */
  step: number;
  /** Form field name. The value submits under it. */
  name: string;
  disabled: boolean;
  /** The associated form, or null. */
  readonly form: HTMLFormElement | null;
}

/** Registers `<ds-slider>`, or an alias when given a tag name. Safe to call more than once. */
export declare function defineSlider(tagName?: string): void;

declare global {
  interface HTMLElementTagNameMap {
    "ds-slider": DsSlider;
  }
}
