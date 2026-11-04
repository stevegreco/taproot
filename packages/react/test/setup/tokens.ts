/**
 * Load the published token stylesheet once per browser test file, as an app would. Without it every
 * var(--ds-semantic-…) a component uses is unresolved.
 */
import "@taproot-ds/tokens/css";

document.documentElement.dataset.theme = "light";
