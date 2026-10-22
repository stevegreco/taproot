/** The host checks for <ds-divider>. test/host-checks.test.js reads every file here. */
export default {
  id: "divider",
  tagName: "ds-divider",
  className: "DsDivider",
  defineExport: "defineDivider",
  events: [],
  focusPart: null,
  parts: ["line"],
  requiresDefaultSlot: false,
  disabledAttribute: null,
  fieldsetDisables: false,
  hasFormProperty: false,
  activationKeys: [],
  fixture: {},
  textAttributes: {},
  enums: [
    {
      attribute: "orientation",
      property: "orientation",
      values: ["horizontal", "vertical"],
      default: "horizontal",
    },
  ],
  properties: { orientation: "vertical" },
};
