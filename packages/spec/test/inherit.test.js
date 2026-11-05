import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { loadSpec, validateSpec } from "../src/index.js";

/** A pattern with three rules, for components to inherit from. */
const guide = (rules = "") => `---
id: pattern.guide
type: pattern
title: Guide
summary: Guidance for tests.
rules:
  - id: shared
    level: should
    topic: behavior
    statement: Shared rule.
    applicability: The thing is in a form.
    examples:
      do:
        - A base example.
  - id: optional
    level: should
    topic: content
    statement: Optional rule.
  - id: skipped
    level: must
    topic: accessibility
    statement: Skipped rule.
${rules}---

## Overview

Text.
`;

/** A component that follows the guide, with these rules of its own. Its rules start on line 17. */
const component = (name, rules = "") => `id: component.${name}
type: component
title: ${name[0].toUpperCase()}${name.slice(1)}
summary: Use it for testing.
links:
  follows:
    - pattern.guide
description: A test component.
usage:
  do:
    - Test things.
anatomy:
  control:
    role: interactive-surface
    description: The control.
${rules ? `rules:\n${rules}` : ""}`;

const folders = [];
/** Write the files to a new folder and return its path. */
async function corpus(files) {
  const folder = await mkdtemp(path.join(tmpdir(), "taproot-inherit-"));
  folders.push(folder);
  for (const [name, text] of Object.entries(files)) await writeFile(path.join(folder, name), text);
  return folder;
}
afterAll(() => Promise.all(folders.map((folder) => rm(folder, { recursive: true }))));

/** @type {import("../src/index.js").Spec} */
let spec;

beforeAll(async () => {
  const contentDir = await corpus({
    "guide.md": guide(),
    "plain.spec.yaml": component("plain"),
    "narrow.spec.yaml": component(
      "narrow",
      `  - id: own
    level: must
    topic: content
    statement: Own rule.
  - id: shared
    extends: pattern.guide#shared
    level: must
    statement: Narrowed rule.
  - id: skipped
    waived: Narrow has nothing to skip.
`,
    ),
  });
  spec = await loadSpec({ contentDir });
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

/** Each corpus holds exactly one mistake, and must produce exactly one issue. */
const mistakes = [
  {
    name: "a rule that repeats an inherited id without saying how",
    rules: "  - id: shared\n    level: should\n    topic: behavior\n    statement: Restated.\n",
    line: 17,
    path: "/rules/0/id",
    message: "rule id `shared` is already inherited from pattern.guide#shared",
  },
  {
    name: "extends naming a rule the component does not inherit",
    rules: "  - id: shared\n    extends: pattern.guide#missing\n    statement: Narrowed.\n",
    line: 18,
    path: "/rules/0/extends",
    message:
      "`pattern.guide#missing` is not a rule of a pattern or guideline that component.thing follows",
  },
  {
    name: "extends under another id",
    rules: "  - id: other\n    extends: pattern.guide#shared\n    statement: Narrowed.\n",
    line: 17,
    path: "/rules/0/id",
    message: "a rule that extends pattern.guide#shared keeps its id: use `shared`",
  },
  {
    name: "extends with a weaker level",
    rules:
      "  - id: skipped\n    extends: pattern.guide#skipped\n    level: should\n    statement: Narrowed.\n",
    line: 19,
    path: "/rules/0/level",
    message: "`should` is weaker than the `must` of pattern.guide#skipped",
  },
  {
    name: "extends with a topic of its own",
    rules:
      "  - id: shared\n    extends: pattern.guide#shared\n    topic: content\n    statement: Narrowed.\n",
    line: 19,
    path: "/rules/0/topic",
    message: "`topic` is not allowed here",
  },
  {
    name: "a waiver with nothing to waive",
    rules: "  - id: ghost\n    waived: It does not apply.\n",
    line: 17,
    path: "/rules/0/id",
    message: "`ghost` is waived, but no pattern or guideline that component.thing follows",
  },
  {
    name: "a waiver with rule fields",
    rules: "  - id: shared\n    waived: It does not apply.\n    statement: Narrowed.\n",
    line: 19,
    path: "/rules/0/statement",
    message: "`statement` is not allowed here",
  },
  {
    name: "a pattern rule id that repeats a heading's slug",
    guide: "  - id: overview\n    level: may\n    topic: content\n    statement: Collides.\n",
    file: "guide.md",
    line: 23,
    path: "/rules/3/id",
    message: 'rule id `overview` is also the address of the heading "Overview"',
  },
];

describe("inherited rule checks", () => {
  it.each(mistakes)("reports $name", async (mistake) => {
    const contentDir = await corpus({
      "guide.md": guide(mistake.guide),
      "thing.spec.yaml": component("thing", mistake.rules),
    });
    const { issues } = await validateSpec({ contentDir });
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({
      file: mistake.file ?? "thing.spec.yaml",
      line: mistake.line,
      path: mistake.path,
    });
    expect(issues[0].message).toContain(mistake.message);
  });
});
