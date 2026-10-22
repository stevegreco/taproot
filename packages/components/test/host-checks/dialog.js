/** The host checks for <ds-dialog>. test/host-checks.test.js reads every file here. */
export default {
  // Modal focus containment and restoration need their own open/close fixtures.
  id: "dialog",
  tagName: "ds-dialog",
  className: "DsDialog",
  defineExport: "defineDialog",
  events: [],
  focusPart: null,
  parts: ["dialog", "title", "description", "content", "actions"],
  requiresDefaultSlot: true,
  disabledAttribute: null,
  fieldsetDisables: false,
  hasFormProperty: false,
  activationKeys: [],
  fixture: {},
  textAttributes: { label: "Sample label", description: "Sample description" },
  enums: [],
  properties: { label: "sample label", description: "sample description", dismissible: false },
};
