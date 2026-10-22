/** The host checks for <ds-icon>. test/host-checks.test.js reads every file here. */
export default {
  id: "icon",
  tagName: "ds-icon",
  className: "DsIcon",
  defineExport: "defineIcon",
  events: [],
  focusPart: null,
  parts: ["icon"],
  requiresDefaultSlot: true,
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
  properties: { label: "sample label", size: "large" },
};
