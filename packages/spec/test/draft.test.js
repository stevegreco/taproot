import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { validateSpec } from "../src/index.js";
import { draftComponent, titleOf } from "../src/draft.js";

async function validateDraft(name, source) {
  const dir = mkdtempSync(path.join(tmpdir(), "spec-new-"));
  mkdirSync(path.join(dir, name));
  writeFileSync(path.join(dir, name, `${name}.spec.yaml`), source);
  return validateSpec({ contentDir: dir });
}

describe("draft component", () => {
  it("titles a name the way component titles are written", () => {
    expect(titleOf("tooltip")).toBe("Tooltip");
    expect(titleOf("radio-group")).toBe("Radio group");
  });

  it("passes the schema, and validation reports only its placeholders", async () => {
    const { issues } = await validateDraft("radio-group", draftComponent("radio-group"));
    expect(issues.map((issue) => issue.path)).toEqual([
      "/summary",
      "/description",
      "/usage/do/0",
      "/usage/avoid/0/situation",
      "/usage/avoid/0/instead",
      "/usage/avoid/0/why",
      "/anatomy/container/description",
    ]);
    expect(new Set(issues.map((issue) => issue.message))).toEqual(
      new Set(["is a `TODO:` placeholder; replace it"]),
    );
  });

  it("is valid once every placeholder is replaced", async () => {
    const filled = draftComponent("tooltip").replaceAll(/"TODO:[^"]*"/g, '"Filled in."');
    expect(filled).toContain("id: component.tooltip");
    expect(filled).toContain("status: draft");
    const { issues } = await validateDraft("tooltip", filled);
    expect(issues).toEqual([]);
  });

  it("starts with the header when one is given", () => {
    expect(draftComponent("tooltip", { header: "# header" }).split("\n")[0]).toBe("# header");
  });

  it("refuses a name that is not lowercase words joined by hyphens", () => {
    expect(() => draftComponent("Radio_Group")).toThrow(/is not a component name/);
  });
});
