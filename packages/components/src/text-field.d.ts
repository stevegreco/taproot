export type TextFieldType = "text" | "email" | "password" | "search" | "url" | "tel";

/** The attributes `<ds-text-field>` accepts, for typing framework templates. */
export interface DsTextFieldAttributes {
  /** Visible label. This is the accessible name. */
  label?: string;
  /** Supporting guidance. Included in the accessible description when set. */
  hint?: string;
  /** What to fix. A non-empty value marks the control invalid and is included in the accessible description. */
  error?: string;
  /** Defaults to `"text"`. */
  type?: TextFieldType;
  /** Form field name. The value is submitted under this name. */
  name?: string;
  /** Current value. The attribute sets the initial value. */
  value?: string;
  /** Example text shown when the value is empty. Not a replacement for the label. */
  placeholder?: string;
  /** Hint for the browser autofill, such as email. */
  autocomplete?: string;
  /** Prevents editing. A disabled field does not submit its value. */
  disabled?: boolean;
  /** The value must be provided before submit. Conveyed by more than color. */
  required?: boolean;
}

/** `<ds-text-field>`: Use Text field to collect a single line of text with a label, hint, and error. */
export declare class DsTextField extends HTMLElement {
  static readonly formAssociated: true;

  /** Visible label. This is the accessible name. */
  label: string;
  /** Supporting guidance. Included in the accessible description when set. */
  hint: string;
  /** What to fix. A non-empty value marks the control invalid and is included in the accessible description. */
  error: string;
  /** Defaults to `"text"`. */
  type: TextFieldType;
  /** Form field name. The value is submitted under this name. */
  name: string;
  /** Current value. The attribute sets the initial value. */
  value: string;
  /** Example text shown when the value is empty. Not a replacement for the label. */
  placeholder: string;
  /** Hint for the browser autofill, such as email. */
  autocomplete: string;
  /** Prevents editing. A disabled field does not submit its value. */
  disabled: boolean;
  /** The value must be provided before submit. Conveyed by more than color. */
  required: boolean;
  /** The associated form, including association across the shadow boundary. */
  readonly form: HTMLFormElement | null;

  formDisabledCallback(disabled: boolean): void;
  formResetCallback(): void;
  formStateRestoreCallback(state: string | null, mode: string): void;
  /** Focuses the inner `<input>`. */
  focus(options?: FocusOptions): void;
  /** Blurs the inner `<input>`. */
  blur(): void;
}

/** Registers `<ds-text-field>`, or an alias when given a tag name. Safe to call more than once. */
export declare function defineTextField(tagName?: string): void;

declare global {
  interface HTMLElementTagNameMap {
    "ds-text-field": DsTextField;
  }
}
