/** The host checks for <ds-avatar>. test/host-checks.test.js reads every file here. */
export default {
  id: "avatar",
  tagName: "ds-avatar",
  className: "DsAvatar",
  defineExport: "defineAvatar",
  events: [],
  focusPart: null,
  parts: ["surface", "image", "initials", "placeholder"],
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
      values: ["small", "medium", "large"],
      default: "medium",
    },
  ],
  properties: { name: "sample name", image: "sample image", size: "small", decorative: true },
};
