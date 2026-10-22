/** The host checks for <ds-alert>. test/host-checks.test.js reads every file here. */
export default {
  // The dismiss control is optional, so dismissal and its focus have their own tests.
  id: "alert",
  tagName: "ds-alert",
  className: "DsAlert",
  defineExport: "defineAlert",
  events: [],
  focusPart: null,
  parts: ["surface", "icon", "title", "message", "actions", "dismiss"],
  requiresDefaultSlot: true,
  disabledAttribute: null,
  fieldsetDisables: false,
  hasFormProperty: false,
  activationKeys: [],
  fixture: {},
  textAttributes: { label: "Sample label", dismissible: "" },
  enums: [
    {
      attribute: "variant",
      property: "variant",
      values: ["info", "success", "warning", "danger"],
      default: "info",
    },
    {
      attribute: "announce",
      property: "announce",
      values: ["off", "polite", "urgent"],
      default: "off",
    },
  ],
  properties: {
    variant: "danger",
    label: "sample label",
    announce: "polite",
    dismissible: true,
    dismissLabel: "Close",
  },
};
