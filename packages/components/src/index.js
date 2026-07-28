/**
 * @stevegreco/design-system-components
 *
 * Importing this module registers every element with its default tag name.
 * Import from a subpath (e.g. "…/button") to register selectively, or use the
 * exported `define*` helpers to register under a custom tag name.
 */

import { defineButton } from "./button.js";

export { DsButton, defineButton } from "./button.js";

defineButton();
