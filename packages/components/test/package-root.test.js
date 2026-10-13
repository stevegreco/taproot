/**
 * Importing the package root registers every component under its default tag
 * name and exports its define helper. Components are found from the files in
 * src/: each `src/<name>.js` other than `index.js` is one component, with the
 * tag name `ds-<name>`.
 */
import { expect, test } from "vitest";

import * as root from "../src/index.js";

const modules = import.meta.glob(["../src/*.js", "!../src/index.js"], { eager: true });

const components = Object.entries(modules).map(([file, module]) => {
  const name = file.slice("../src/".length, -".js".length);
  return [`ds-${name}`, module];
});

test("finds the components in src/", () => {
  expect(components.length).toBeGreaterThan(0);
});

test.each(components)("importing the package root registers <%s>", (tagName, module) => {
  const defineExports = Object.keys(module).filter((key) => /^define[A-Z]/.test(key));
  expect(defineExports, "one define* export").toHaveLength(1);
  const [defineExport] = defineExports;
  expect(root[defineExport]).toBe(module[defineExport]);
  expect(customElements.get(tagName)).toBeDefined();
});
