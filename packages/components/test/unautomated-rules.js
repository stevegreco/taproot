/**
 * `must` rules that no automated test can prove, each with the reason. The
 * census in test/contract-rules.test.js fails for any other `must` rule without
 * a test tagged with its ID. Keep reasons specific: they are the record of why
 * CI does not check the rule.
 */
export const unautomatedRules = Object.freeze({
  "component.badge": {
    "text-communicates-state":
      "The badge renders the text it is given. Whether that text names the state is an authoring review.",
    "surrounding-ui-announces":
      "Announcing a change is the consuming UI's job, so there is nothing in Badge to test.",
  },
  "component.button": {
    "label-describes-action":
      "The label is authored content. Whether it describes the action is an authoring review.",
    "meaning-not-color-alone":
      "Button always renders its label. Whether the label alone carries the meaning is an authoring review.",
  },
  "component.link": {
    "a11y-link-purpose":
      "Whether the text and its sentence make the destination clear is an authoring review.",
  },
});
