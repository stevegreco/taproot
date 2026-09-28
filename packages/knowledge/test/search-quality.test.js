import assert from "node:assert/strict";
import { test } from "vitest";
import { tokenize } from "../src/compile/search-index.js";
import { openCatalog } from "../src/retrieve/index.js";

/** Questions an agent asks, and the record that should answer first. */
const QUERIES = [
  ["destructive action confirmation", "pattern.action-hierarchy"],
  ["primary button", "component.button"],
  ["buttons", "component.button"],
  ["links", "component.link"],
  ["link vs button", "component.link"],
  ["checkboxes", "component.checkbox"],
  ["form checkbox label", "component.checkbox"],
  ["text input error message", "component.text-field"],
  ["TextField", "component.text-field"],
  ["ds-button", "component.button"],
  ["status indicator", "component.badge"],
];

test.each(QUERIES)("search %j ranks %s first", async (query, expected) => {
  const catalog = await openCatalog();
  assert.equal(catalog.search(query)[0]?.record.id, expected);
});

test("tokenize stems plurals and -ing forms and keeps hyphenated words whole", () => {
  assert.deepEqual([...tokenize("Buttons loading checkboxes ds-button string")].sort(), [
    "button",
    "checkbox",
    "ds",
    "ds-button",
    "dsbutton",
    "load",
    "string",
  ]);
  assert.deepEqual([...tokenize("how do I use it")], []);
});
