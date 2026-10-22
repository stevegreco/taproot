/** The host checks for <ds-tabs>. test/host-checks.test.js reads every file here. */
export default {
  // change needs a second tab to choose, so selection events have their own tests.
  id: "tabs",
  tagName: "ds-tabs",
  className: "DsTabs",
  defineExport: "defineTabs",
  events: [],
  focusPart: "tab",
  parts: ["tab-list", "tab", "selected-indicator", "panel"],
  requiresDefaultSlot: true,
  disabledAttribute: null,
  fieldsetDisables: false,
  hasFormProperty: false,
  activationKeys: [],
  fixture: {},
  fixtureContent:
    '<ds-tab-panel label="One" value="one">One</ds-tab-panel><ds-tab-panel label="Two" value="two">Two</ds-tab-panel>',
  textAttributes: { label: "Sample label" },
  enums: [],
  properties: { label: "sample label", value: "two" },
};
