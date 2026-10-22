/** The host checks for <ds-button>. test/host-checks.test.js reads every file here. */
export default {
  id: "button",
  tagName: "ds-button",
  className: "DsButton",
  defineExport: "defineButton",
  events: ["click"],
  focusPart: "button",
  parts: ["button"],
  requiresDefaultSlot: true,
  disabledAttribute: "disabled",
  fieldsetDisables: true,
  hasFormProperty: true,
  activationKeys: ["Enter", "Space"],
  fixture: {},
  textAttributes: {},
  enums: [
    {
      attribute: "variant",
      property: "variant",
      values: ["primary", "secondary", "tertiary", "destructive"],
      default: "primary",
    },
    { attribute: "size", property: "size", values: ["small", "medium"], default: "medium" },
    {
      attribute: "type",
      property: "type",
      values: ["button", "submit", "reset"],
      default: "button",
    },
  ],
  properties: { variant: "destructive", size: "small", type: "submit", disabled: true },
};
