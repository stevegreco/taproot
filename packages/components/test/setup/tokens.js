/**
 * Load the published token stylesheet once per browser test file, as a page
 * would. Without it every var(--semantic-…) in a component stylesheet is
 * unresolved and a computed style falls back to the inherited value.
 */
import "@stevegreco/design-system/css";

document.documentElement.dataset.theme = "light";
