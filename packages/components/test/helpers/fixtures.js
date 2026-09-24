/**
 * Content a component needs before its host behavior applies, keyed by
 * component id. Link needs an `href` before its anchor is focusable or shows
 * `:hover`. Tests that render every catalog component start from these.
 */
export const FIXTURES = Object.freeze({
  "component.link": { href: "#fixture" },
});
