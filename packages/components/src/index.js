/**
 * @stevegreco/design-system-components
 *
 * Importing this module registers every element with its default tag name.
 * Import from a subpath (e.g. "…/button") to register selectively, or use the
 * exported `define*` helpers to register under a custom tag name.
 */

import { defineBadge } from "./badge.js";
import { defineButton } from "./button.js";

export { DsBadge, defineBadge } from "./badge.js";
export { DsButton, defineButton } from "./button.js";

defineBadge();
defineButton();
