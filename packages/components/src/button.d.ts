export type ButtonVariant = "primary" | "secondary" | "tertiary" | "destructive";
export type ButtonSize = "sm" | "md";
export type ButtonType = "button" | "submit" | "reset";

/** The attributes `<ds-button>` accepts, for typing framework templates. */
export interface DsButtonAttributes {
  /** Defaults to `"primary"`. */
  variant?: ButtonVariant;
  /** Defaults to `"md"`. */
  size?: ButtonSize;
  /** Defaults to `"button"`. */
  type?: ButtonType;
  disabled?: boolean;
  /** Fills the available inline size. */
  "full-width"?: boolean;
}

/** `<ds-button>`: Use Button to trigger an action or to submit or reset a form. */
export declare class DsButton extends HTMLElement {
  static readonly formAssociated: true;

  /** Defaults to `"primary"`. */
  variant: ButtonVariant;
  /** Defaults to `"md"`. */
  size: ButtonSize;
  /** Defaults to `"button"`. */
  type: ButtonType;
  disabled: boolean;
  /** The associated form, including association across the shadow boundary. */
  readonly form: HTMLFormElement | null;

  formDisabledCallback(disabled: boolean): void;
  /** Focuses the inner `<button>`. */
  focus(options?: FocusOptions): void;
  /** Blurs the inner `<button>`. */
  blur(): void;
}

/** Registers `<ds-button>`, or an alias when given a tag name. Safe to call more than once. */
export declare function defineButton(tagName?: string): void;

declare global {
  interface HTMLElementTagNameMap {
    "ds-button": DsButton;
  }
}
