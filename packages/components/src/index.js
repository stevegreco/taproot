/**
 * @stevegreco/design-system-components
 *
 * Importing this module registers every element with its default tag name.
 * Import from a subpath (e.g. "…/button") to register selectively, or use the
 * exported `define*` helpers to register under a custom tag name.
 */

import { defineAlert } from "./alert.js";
import { defineBadge } from "./badge.js";
import { defineButton } from "./button.js";
import { defineCheckbox } from "./checkbox.js";
import { defineIcon } from "./icon.js";
import { defineLink } from "./link.js";
import { defineTextField } from "./text-field.js";
import { defineDialog } from "./dialog.js";
import { defineRadioGroup } from "./radio-group.js";
import { defineSelect } from "./select.js";
import { defineSwitch } from "./switch.js";
import { defineTabs } from "./tabs.js";
import { defineTextArea } from "./text-area.js";

export { DsAlert, defineAlert } from "./alert.js";
export { DsBadge, defineBadge } from "./badge.js";
export { DsButton, defineButton } from "./button.js";
export { DsCheckbox, defineCheckbox } from "./checkbox.js";
export { DsIcon, defineIcon } from "./icon.js";
export { DsLink, defineLink } from "./link.js";
export { DsTextField, defineTextField } from "./text-field.js";
export { DsDialog, defineDialog } from "./dialog.js";
export { DsRadioGroup, defineRadioGroup } from "./radio-group.js";
export { DsSelect, defineSelect } from "./select.js";
export { DsSwitch, defineSwitch } from "./switch.js";
export { DsTabPanel, DsTabs, defineTabs } from "./tabs.js";
export { DsTextArea, defineTextArea } from "./text-area.js";

defineAlert();
defineBadge();
defineButton();
defineCheckbox();
defineIcon();
defineLink();
defineTextField();

defineDialog();
defineRadioGroup();
defineSelect();
defineSwitch();
defineTabs();
defineTextArea();
