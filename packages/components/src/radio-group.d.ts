/** Native option children supply labels, unique nonempty values, and disabled states. */
export interface DsRadioGroupAttributes {
  label?: string;
  hint?: string;
  error?: string;
  name?: string;
  value?: string;
  disabled?: boolean;
  required?: boolean;
}
export declare class DsRadioGroup extends HTMLElement {
  static readonly formAssociated: true;
  label: string;
  hint: string;
  error: string;
  name: string;
  /** Live selection. The value attribute supplies the initial and reset selection. */
  value: string;
  disabled: boolean;
  required: boolean;
  readonly form: HTMLFormElement | null;
  formDisabledCallback(disabled: boolean): void;
  formResetCallback(): void;
  formStateRestoreCallback(state: string | null, mode: string): void;
  focus(options?: FocusOptions): void;
  blur(): void;
}
export declare function defineRadioGroup(tagName?: string): void;
declare global {
  interface HTMLElementTagNameMap {
    "ds-radio-group": DsRadioGroup;
  }
}
