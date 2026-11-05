import { beforeAll, describe, expect, it } from "vitest";
import { loadSpec } from "../src/index.js";
import { fixture } from "./helpers.js";

/** @type {import("../src/index.js").Spec} */
let spec;

beforeAll(async () => {
  spec = await loadSpec({ contentDir: fixture("inherit") });
});

const addresses = (hits) => hits.map((hit) => hit.address);

describe("inherited rules", () => {
  it("gives a pattern's rules addresses in the pattern", () => {
    expect(addresses(spec.rules({ id: "pattern.guide" }))).toEqual([
      "pattern.guide#skipped",
      "pattern.guide#shared",
      "pattern.guide#optional",
    ]);
    expect(spec.section("pattern.guide#shared")?.content).toMatchObject({ level: "should" });
  });

  it("lists every rule a component inherits, at the address where it is written", () => {
    const hits = spec.rules({ id: "component.plain" });
    expect(addresses(hits)).toEqual([
      "pattern.guide#skipped",
      "pattern.guide#shared",
      "pattern.guide#optional",
    ]);
    expect(hits[0]).toMatchObject({ recordId: "pattern.guide", appliesTo: "component.plain" });
  });

  it("replaces a rule the component narrows, and leaves out one it waives", () => {
    const hits = spec.rules({ id: "component.narrow" });
    expect(addresses(hits)).toEqual([
      "component.narrow#own",
      "component.narrow#shared",
      "pattern.guide#optional",
    ]);
    // The narrowing rule raises the level, keeps the topic and condition, and names its base.
    expect(hits[1]).toMatchObject({
      level: "must",
      topic: "behavior",
      statement: "Narrowed rule.",
      applicability: "The thing is in a form.",
      extends: "pattern.guide#shared",
    });
    // Examples illustrate the base statement, which the narrowing rule rewrites.
    expect(hits[1]).not.toHaveProperty("examples");
  });

  it("lists each rule once when no record is named", () => {
    const all = addresses(spec.rules());
    expect(all.filter((address) => address === "pattern.guide#optional")).toHaveLength(1);
    expect(all).toContain("component.narrow#shared");
    expect(all).not.toContain("component.narrow#skipped");
  });

  it("filters inherited rules by rule id, topic, and query", () => {
    expect(addresses(spec.rules({ id: "component.plain#optional" }))).toEqual([
      "pattern.guide#optional",
    ]);
    expect(addresses(spec.rules({ id: "component.plain", topic: "accessibility" }))).toEqual([
      "pattern.guide#skipped",
    ]);
    expect(addresses(spec.rules({ id: "component.narrow", query: "narrowed" }))).toEqual([
      "component.narrow#shared",
    ]);
  });

  it("gives a waived rule no section", () => {
    expect(spec.section("component.narrow#skipped")).toBeUndefined();
    expect(spec.section("component.narrow#shared")).toBeDefined();
  });

  it("renders inherited rules by address, narrowed rules with their base, and waivers", () => {
    const text = spec.render("component.narrow");
    expect(text).toContain("Includes the rules of pattern.guide, which this component follows.");
    expect(text).toContain("- **MUST** own: Own rule.");
    expect(text).toContain("- **MUST** shared: Narrowed rule.\n  - Extends: pattern.guide#shared");
    expect(text).toContain("- **SHOULD** pattern.guide#optional: Optional rule.");
    expect(text).toContain("### Waived\n\n- pattern.guide#skipped: Narrow has nothing to skip.");
    expect(spec.render("component.narrow#shared")).toContain("- **MUST** shared: Narrowed rule.");
  });

  it("renders a component's rules when it has only inherited ones", () => {
    expect(spec.render("component.plain")).toContain(
      "## Rules\n\nIncludes the rules of pattern.guide",
    );
  });

  it("renders a pattern's rules after its body", () => {
    const text = spec.render("pattern.guide");
    expect(text.indexOf("## Overview")).toBeLessThan(text.indexOf("## Rules"));
    expect(text).toContain("- **SHOULD** shared: Shared rule.");
  });
});
