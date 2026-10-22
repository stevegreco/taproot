/**
 * @stevegreco/design-system-components
 *
 * Importing this module registers every element with its default tag name.
 * Import from a subpath (e.g. "…/button") to register selectively, or use the
 * exported `define*` helpers to register under a custom tag name.
 */

import { defineAccordion } from "./accordion.js";
import { defineAlert } from "./alert.js";
import { defineAvatar } from "./avatar.js";
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
import { defineSpinner } from "./spinner.js";
import { defineCard } from "./card.js";

export { DsAccordion, DsAccordionSection, defineAccordion } from "./accordion.js";
export { DsAlert, defineAlert } from "./alert.js";
export { DsAvatar, defineAvatar } from "./avatar.js";
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
export { DsSpinner, defineSpinner } from "./spinner.js";
export { DsCard, defineCard } from "./card.js";

defineAccordion();
defineAlert();
defineAvatar();
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
defineSpinner();
defineCard();
