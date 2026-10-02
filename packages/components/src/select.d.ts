/** The attributes `<ds-select>` accepts, for typing framework templates. */
export interface DsSelectAttributes {
  /** Visible label. This is the accessible name. */
  label?: string;
  /** Supporting guidance. Included in the accessible description when set. */
  hint?: string;
  /** What to fix. A non-empty value marks the control invalid and is included in the accessible description. */
  error?: string;
  /** Form field name. The value is submitted under this name. */
  name?: string;
  /** Current value. The attribute sets the initial value. */
  value?: string;
  /** Prevents editing. A disabled field does not submit its value. */
  disabled?: boolean;
  /** The value must be provided before submit. Conveyed by more than color. */
  required?: boolean;
}

/** `<ds-select>`: Use Select to choose one value from a list with a label, hint, and error. */
export declare class DsSelect extends HTMLElement {
  static readonly formAssociated: true;

  /** Visible label. This is the accessible name. */
  label: string;
  /** Supporting guidance. Included in the accessible description when set. */
  hint: string;
  /** What to fix. A non-empty value marks the control invalid and is included in the accessible description. */
  error: string;
  /** Form field name. The value is submitted under this name. */
  name: string;
  /** Current value. The attribute sets the initial value. */
  value: string;
  /** Prevents editing. A disabled field does not submit its value. */
  disabled: boolean;
  /** The value must be provided before submit. Conveyed by more than color. */
  required: boolean;
  /** The associated form, including association across the shadow boundary. */
  readonly form: HTMLFormElement | null;

  formDisabledCallback(disabled: boolean): void;
  formResetCallback(): void;
  formStateRestoreCallback(state: string | null, mode: string): void;
  /** Focuses the inner `<select>`. */
  focus(options?: FocusOptions): void;
  /** Blurs the inner `<select>`. */
  blur(): void;
}

/** Registers `<ds-select>`, or an alias when given a tag name. Safe to call more than once. */
export declare function defineSelect(tagName?: string): void;

declare global {
  interface HTMLElementTagNameMap {
    "ds-select": DsSelect;
  }
}
