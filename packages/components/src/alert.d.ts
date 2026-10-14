export type AlertVariant = "info" | "success" | "warning" | "danger";
export type AlertAnnounce = "off" | "polite" | "urgent";

/** The attributes `<ds-alert>` accepts, for typing framework templates. */
export interface DsAlertAttributes {
  /** Defaults to `"info"`. */
  variant?: AlertVariant;
  /** Optional visible title, read before the message. */
  label?: string;
  /** Defaults to `"off"`: shown without being announced. */
  announce?: AlertAnnounce;
  /** Shows a control that dismisses the alert. */
  dismissible?: boolean;
  /** Accessible name of the dismiss control. Defaults to `"Dismiss"`. */
  "dismiss-label"?: string;
}

/** `<ds-alert>`: Use Alert for a short status message in the flow of the page, announced only when you ask. */
export declare class DsAlert extends HTMLElement {
  /** Defaults to `"info"`. */
  variant: AlertVariant;
  label: string;
  /** Defaults to `"off"`. */
  announce: AlertAnnounce;
  dismissible: boolean;
  /** Defaults to `"Dismiss"`. */
  dismissLabel: string;
}

/** Registers `<ds-alert>`, or an alias when given a tag name. Safe to call more than once. */
export declare function defineAlert(tagName?: string): void;

declare global {
  interface HTMLElementTagNameMap {
    "ds-alert": DsAlert;
  }
}
