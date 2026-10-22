import type { DsAccordionAttributes, DsAccordionSectionAttributes } from "./accordion.js";
import type { DsAlertAttributes } from "./alert.js";
import type { DsAvatarAttributes } from "./avatar.js";
import type { DsBadgeAttributes } from "./badge.js";
import type { DsButtonAttributes } from "./button.js";
import type { DsCheckboxAttributes } from "./checkbox.js";
import type { DsIconAttributes } from "./icon.js";
import type { DsLinkAttributes } from "./link.js";
import type { DsTextFieldAttributes } from "./text-field.js";
import type { DsDialogAttributes } from "./dialog.js";
import type { DsRadioGroupAttributes } from "./radio-group.js";
import type { DsSelectAttributes } from "./select.js";
import type { DsSwitchAttributes } from "./switch.js";
import type { DsTabPanelAttributes, DsTabsAttributes } from "./tabs.js";
import type { DsTextAreaAttributes } from "./text-area.js";
import type { DsTooltipAttributes } from "./tooltip.js";
import type { DsSpinnerAttributes } from "./spinner.js";
import type { DsCardAttributes } from "./card.js";

export * from "./accordion.js";
export * from "./alert.js";
export * from "./avatar.js";
export * from "./badge.js";
export * from "./button.js";
export * from "./checkbox.js";
export * from "./icon.js";
export * from "./link.js";
export * from "./text-field.js";
export * from "./dialog.js";
export * from "./radio-group.js";
export * from "./select.js";
export * from "./switch.js";
export * from "./tabs.js";
export * from "./text-area.js";
export * from "./tooltip.js";
export * from "./spinner.js";
export * from "./card.js";

/**
 * The attributes each element accepts, keyed by default tag name. Map it onto a
 * framework's intrinsic elements to type templates, such as JSX.
 */
export interface ElementAttributes {
  "ds-accordion": DsAccordionAttributes;
  "ds-accordion-section": DsAccordionSectionAttributes;
  "ds-alert": DsAlertAttributes;
  "ds-avatar": DsAvatarAttributes;
  "ds-badge": DsBadgeAttributes;
  "ds-button": DsButtonAttributes;
  "ds-checkbox": DsCheckboxAttributes;
  "ds-icon": DsIconAttributes;
  "ds-link": DsLinkAttributes;
  "ds-text-field": DsTextFieldAttributes;
  "ds-dialog": DsDialogAttributes;
  "ds-radio-group": DsRadioGroupAttributes;
  "ds-select": DsSelectAttributes;
  "ds-switch": DsSwitchAttributes;
  "ds-tabs": DsTabsAttributes;
  "ds-tab-panel": DsTabPanelAttributes;
  "ds-text-area": DsTextAreaAttributes;
  "ds-tooltip": DsTooltipAttributes;
  "ds-spinner": DsSpinnerAttributes;
  "ds-card": DsCardAttributes;
}
