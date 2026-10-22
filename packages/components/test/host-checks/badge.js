/** The host checks for <ds-badge>. test/host-checks.test.js reads every file here. */
export default {
  id: "badge",
  tagName: "ds-badge",
  className: "DsBadge",
  defineExport: "defineBadge",
  events: [],
  focusPart: null,
  parts: ["badge"],
  requiresDefaultSlot: true,
  disabledAttribute: null,
  fieldsetDisables: false,
  hasFormProperty: false,
  activationKeys: [],
  fixture: {},
  textAttributes: {},
  enums: [
    {
      attribute: "variant",
      property: "variant",
      values: ["default", "accent", "success", "danger", "warning", "info"],
      default: "default",
    },
  ],
  properties: { variant: "accent" },
};
