/** The host checks for <ds-tooltip>. test/host-checks.test.js reads every file here. */
export default {
  id: "tooltip",
  tagName: "ds-tooltip",
  className: "DsTooltip",
  defineExport: "defineTooltip",
  events: [],
  // The trigger is the slotted control; the tooltip itself takes no focus.
  focusPart: null,
  parts: ["trigger", "bubble"],
  requiresDefaultSlot: true,
  disabledAttribute: null,
  fieldsetDisables: false,
  hasFormProperty: false,
  activationKeys: [],
  fixture: { label: "Sample label" },
  textAttributes: { label: "Sample label" },
  enums: [
    {
      attribute: "placement",
      property: "placement",
      values: ["above", "below"],
      default: "above",
    },
  ],
  properties: { label: "sample label", placement: "below" },
};
