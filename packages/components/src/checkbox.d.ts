export declare class DsCheckbox extends HTMLElement {
  static readonly formAssociated: true;
  static readonly observedAttributes: string[];

  /** Live checked state. The `checked` attribute sets the initial state. */
  checked: boolean;
  /** Reflects the `indeterminate` attribute. Activation clears it. */
  indeterminate: boolean;
  /** Reflects the `disabled` attribute. */
  disabled: boolean;
  /** Reflects the `required` attribute. */
  required: boolean;
  /** Visible label and accessible name. */
  label: string;
  /** Supporting guidance. Empty removes the hint. */
  hint: string;
  /** What to fix. A non-empty value marks the control invalid. */
  error: string;
  /** Form field name. */
  name: string;
  /** Value submitted when checked. Defaults to `"on"`. */
  value: string;
  /** The containing `<form>`, resolved across the shadow boundary. */
  readonly form: HTMLFormElement | null;

  formDisabledCallback(disabled: boolean): void;
  formResetCallback(): void;
  formStateRestoreCallback(state: string | null, mode: string): void;
  focus(options?: FocusOptions): void;
  blur(): void;
}

/** Registers the element. Safe to call more than once. Defaults to `"ds-checkbox"`. */
export declare function defineCheckbox(tagName?: string): void;

declare global {
  interface HTMLElementTagNameMap {
    "ds-checkbox": DsCheckbox;
  }
}
