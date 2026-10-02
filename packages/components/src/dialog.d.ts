export interface DsDialogAttributes {
  open?: boolean;
  label?: string;
  description?: string;
  /** Defaults to true. Use "false" to block Escape dismissal. */
  dismissible?: boolean | "true" | "false";
}

/** A named modal task with focus containment and restoration. */
export declare class DsDialog extends HTMLElement {
  open: boolean;
  label: string;
  description: string;
  dismissible: boolean;
  showModal(): void;
  close(): void;
  focus(options?: FocusOptions): void;
  blur(): void;
}

export declare function defineDialog(tagName?: string): void;

declare global {
  interface HTMLElementTagNameMap {
    "ds-dialog": DsDialog;
  }
}
