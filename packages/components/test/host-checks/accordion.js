/** The host checks for <ds-accordion>. test/host-checks.test.js reads every file here. */
export default {
  // toggle needs a section to expand, so toggle events have their own tests.
  id: "accordion",
  tagName: "ds-accordion",
  className: "DsAccordion",
  defineExport: "defineAccordion",
  events: [],
  focusPart: "trigger",
  parts: ["section", "trigger", "indicator", "panel"],
  requiresDefaultSlot: false,
  disabledAttribute: null,
  fieldsetDisables: false,
  hasFormProperty: false,
  activationKeys: [],
  fixture: {},
  fixtureContent:
    '<ds-accordion-section label="One">One</ds-accordion-section><ds-accordion-section label="Two">Two</ds-accordion-section>',
  textAttributes: {},
  enums: [],
  properties: { exclusive: true, headingLevel: 4 },
};
