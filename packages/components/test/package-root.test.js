/**
 * The package root is a generated barrel (build-sources.js). Importing it
 * registers every component under its binding's default tag name.
 */
import { expect, test } from "vitest";
import { commands } from "vitest/browser";

import * as root from "../src/index.js";

const components = await commands.contractCases();

test.each(components.map((component) => [component.tagName, component]))(
  "importing the package root registers <%s>",
  (tagName, component) => {
    expect(customElements.get(tagName)).toBeDefined();
    expect(root[component.defineExport]).toBeTypeOf("function");
  },
);
