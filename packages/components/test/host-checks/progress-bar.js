/** The host checks for <ds-progress-bar>. test/host-checks.test.js reads every file here. */
export default {
  id: "progress-bar",
  tagName: "ds-progress-bar",
  className: "DsProgressBar",
  defineExport: "defineProgressBar",
  events: [],
  focusPart: null,
  parts: ["label", "track", "fill"],
  requiresDefaultSlot: false,
  disabledAttribute: null,
  fieldsetDisables: false,
  hasFormProperty: false,
  activationKeys: [],
  fixture: {},
  textAttributes: {},
  enums: [],
  properties: { label: "sample label", value: 40, max: 80 },
};
