/** The host checks for <ds-link>. test/host-checks.test.js reads every file here. */
export default {
  id: "link",
  tagName: "ds-link",
  className: "DsLink",
  defineExport: "defineLink",
  events: ["click"],
  focusPart: "link",
  parts: ["link"],
  requiresDefaultSlot: true,
  disabledAttribute: null,
  fieldsetDisables: false,
  hasFormProperty: false,
  activationKeys: ["Enter"],
  fixture: { href: "#fixture" },
  textAttributes: { href: "#fixture" },
  enums: [
    {
      attribute: "variant",
      property: "variant",
      values: ["inline", "standalone"],
      default: "inline",
    },
  ],
  properties: { href: "#sample", variant: "standalone" },
};
