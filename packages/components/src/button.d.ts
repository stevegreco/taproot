export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "md" | "sm";
export type ButtonType = "button" | "submit" | "reset";

export declare class DsButton extends HTMLElement {
  static readonly formAssociated: true;
  static readonly observedAttributes: string[];

  /** Reflects the `disabled` attribute. */
  disabled: boolean;
  /** Reflects the `type` attribute. Defaults to `"button"`. */
  type: ButtonType;
  /** Reflects the `variant` attribute. Defaults to `"primary"`. */
  variant: ButtonVariant;
  /** Reflects the `size` attribute. Defaults to `"md"`. */
  size: ButtonSize;
  /** The containing `<form>`, resolved across the shadow boundary. */
  readonly form: HTMLFormElement | null;

  formDisabledCallback(disabled: boolean): void;
  focus(options?: FocusOptions): void;
  blur(): void;
}

/** Registers the element. Safe to call more than once. Defaults to `"ds-button"`. */
export declare function defineButton(tagName?: string): void;

declare global {
  interface HTMLElementTagNameMap {
    "ds-button": DsButton;
  }
}
