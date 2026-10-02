/** The attributes `<ds-text-area>` accepts, for typing framework templates. */
export interface DsTextAreaAttributes {
  /** Visible label. This is the accessible name. */
  label?: string;
  rows?: number;
  readonly?: boolean;
  /** Supporting guidance. Included in the accessible description when set. */
  hint?: string;
  /** What to fix. A non-empty value marks the control invalid and is included in the accessible description. */
  error?: string;
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

/** `<ds-text-area>`: Use Text area to collect multiple lines of text with a label, hint, and error. */
export declare class DsTextArea extends HTMLElement {
  static readonly formAssociated: true;

  /** Visible label. This is the accessible name. */
  label: string;
  rows: number;
  readonly: boolean;
  /** Supporting guidance. Included in the accessible description when set. */
  hint: string;
  /** What to fix. A non-empty value marks the control invalid and is included in the accessible description. */
  error: string;
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
  /** Focuses the inner `<textarea>`. */
  focus(options?: FocusOptions): void;
  /** Blurs the inner `<textarea>`. */
  blur(): void;
}

/** Registers `<ds-text-area>`, or an alias when given a tag name. Safe to call more than once. */
export declare function defineTextArea(tagName?: string): void;

declare global {
  interface HTMLElementTagNameMap {
    "ds-text-area": DsTextArea;
  }
}
