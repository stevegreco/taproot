/** The host checks for <ds-card>. test/host-checks.test.js reads every file here. */
export default {
  id: "card",
  tagName: "ds-card",
  className: "DsCard",
  defineExport: "defineCard",
  events: ["click"],
  focusPart: "title-link",
  // The ring surrounds the whole card, not the title link.
  focusRingPart: "surface",
  parts: ["surface", "media", "title", "body", "actions"],
  requiresDefaultSlot: true,
  disabledAttribute: null,
  fieldsetDisables: false,
  hasFormProperty: false,
  activationKeys: ["Enter"],
  fixture: { href: "#fixture", label: "Sample label" },
  textAttributes: { href: "#fixture", label: "Sample label" },
  enums: [],
  properties: { label: "sample label", href: "sample href", headingLevel: 4 },
};
