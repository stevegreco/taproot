/** The attributes `<ds-switch>` accepts, for typing framework templates. */
export interface DsSwitchAttributes {
  /** Visible label. This is the accessible name. */
  label?: string;
  /** Supporting guidance. Included in the accessible description when set. */
  hint?: string;
  /** What to fix. A non-empty value marks the control invalid and is included in the accessible description. */
  error?: string;
  /** Whether the option is on. The attribute sets the initial state; form reset restores it. */
  checked?: boolean;
  /** Form field name. The value is submitted under this name when checked. */
  name?: string;
  /** Value submitted when checked. Defaults to "on", as for a native checkbox. */
  value?: string;
  /** Prevents toggling. A disabled switch does not submit its value. */
  disabled?: boolean;
}

/** `<ds-switch>`: Use Switch to turn a setting on or off and apply it immediately. */
export declare class DsSwitch extends HTMLElement {
  static readonly formAssociated: true;

  /** Visible label. This is the accessible name. */
  label: string;
  /** Supporting guidance. Included in the accessible description when set. */
  hint: string;
  /** What to fix. A non-empty value marks the control invalid and is included in the accessible description. */
  error: string;
  /** Whether the option is on. The attribute sets the initial state; form reset restores it. */
  checked: boolean;
  /** Form field name. The value is submitted under this name when checked. */
  name: string;
  /** Value submitted when checked. Defaults to "on", as for a native checkbox. */
  value: string;
  /** Prevents toggling. A disabled switch does not submit its value. */
  disabled: boolean;
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

/** Registers `<ds-switch>`, or an alias when given a tag name. Safe to call more than once. */
export declare function defineSwitch(tagName?: string): void;

declare global {
  interface HTMLElementTagNameMap {
    "ds-switch": DsSwitch;
  }
}
