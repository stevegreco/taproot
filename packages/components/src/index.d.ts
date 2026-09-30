import type { DsBadgeAttributes } from "./badge.js";
import type { DsButtonAttributes } from "./button.js";
import type { DsCheckboxAttributes } from "./checkbox.js";
import type { DsLinkAttributes } from "./link.js";
import type { DsTextFieldAttributes } from "./text-field.js";

export * from "./badge.js";
export * from "./button.js";
export * from "./checkbox.js";
export * from "./link.js";
export * from "./text-field.js";

/**
 * The attributes each element accepts, keyed by default tag name. Map it onto a
 * framework's intrinsic elements to type templates, such as JSX.
 */
export interface ElementAttributes {
  "ds-badge": DsBadgeAttributes;
  "ds-button": DsButtonAttributes;
  "ds-checkbox": DsCheckboxAttributes;
  "ds-link": DsLinkAttributes;
  "ds-text-field": DsTextFieldAttributes;
}
