export type TextFieldType = "text" | "email" | "password" | "search" | "url" | "tel";

export declare class DsTextField extends HTMLElement {
  static readonly formAssociated: true;
  static readonly observedAttributes: string[];

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
  /** Current value. The attribute sets the initial value. */
  value: string;
  /** Example text shown when the value is empty. */
  placeholder: string;
  /** Browser autofill hint. */
  autocomplete: string;
  /** Reflects the `type` attribute. Defaults to `"text"`. */
  type: TextFieldType;
  /** The containing `<form>`, resolved across the shadow boundary. */
  readonly form: HTMLFormElement | null;

  formDisabledCallback(disabled: boolean): void;
  formResetCallback(): void;
  formStateRestoreCallback(state: string | null, mode: string): void;
  focus(options?: FocusOptions): void;
  blur(): void;
}

/** Registers the element. Safe to call more than once. Defaults to `"ds-text-field"`. */
export declare function defineTextField(tagName?: string): void;

declare global {
  interface HTMLElementTagNameMap {
    "ds-text-field": DsTextField;
  }
}
