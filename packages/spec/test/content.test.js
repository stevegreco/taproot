import { describe, expect, it } from "vitest";
import { DEFAULT_CONTENT_DIR, loadSpec, schema, validateSpec } from "../src/index.js";

describe("shipped content", () => {
  it("loads with zero issues", async () => {
    const result = await validateSpec();
    expect(result.issues).toEqual([]);
    expect(result.recordCount).toBe(14);
  });

  it("finds every record by its id", async () => {
    const spec = await loadSpec({ contentDir: DEFAULT_CONTENT_DIR });
    expect(spec.list().map((record) => record.id)).toEqual([
      "component.badge",
      "component.button",
      "component.checkbox",
      "component.dialog",
      "component.icon",
      "component.link",
      "component.radio-group",
      "component.select",
      "component.switch",
      "component.text-area",
      "component.text-field",
      "example.action-hierarchy.settings",
      "guideline.compose-or-propose",
      "pattern.action-hierarchy",
    ]);
  });

  it("exposes the parsed schema", () => {
    expect(schema.$id).toBe("urn:design-system-spec:record:1");
  });
});
