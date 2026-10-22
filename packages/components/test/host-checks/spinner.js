/** The host checks for <ds-spinner>. test/host-checks.test.js reads every file here. */
export default {
  id: "spinner",
  tagName: "ds-spinner",
  className: "DsSpinner",
  defineExport: "defineSpinner",
  events: [],
  // TODO: the part that takes focus, or null when nothing does.
  focusPart: null,
  // TODO: the shadow parts it renders. These are the spec's anatomy names.
  parts: ["indicator"],
  requiresDefaultSlot: false,
  disabledAttribute: null,
  fieldsetDisables: false,
  hasFormProperty: false,
  activationKeys: [],
  fixture: {},
  textAttributes: {},
  enums: [
    {
      attribute: "size",
      property: "size",
      values: ["inherit", "small", "medium", "large"],
      default: "inherit",
    },
  ],
  properties: { label: "sample label", size: "small" },
};
