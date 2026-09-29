/**
 * Importing the package root registers every component under its default tag
 * name and exports its define helper.
 */
import { expect, test } from "vitest";

import * as root from "../src/index.js";

const components = [
  ["ds-badge", "defineBadge"],
  ["ds-button", "defineButton"],
  ["ds-checkbox", "defineCheckbox"],
  ["ds-link", "defineLink"],
  ["ds-text-field", "defineTextField"],
];

test.each(components)("importing the package root registers <%s>", (tagName, defineExport) => {
  expect(customElements.get(tagName)).toBeDefined();
  expect(root[defineExport]).toBeTypeOf("function");
});
