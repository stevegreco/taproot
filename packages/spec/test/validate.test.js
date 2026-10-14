import { describe, expect, it } from "vitest";
import { SpecError, loadSpec, validateSpec } from "../src/index.js";
import { fixture } from "./helpers.js";

/** Each fixture folder holds exactly one mistake, and must produce exactly one issue. */
const cases = [
  {
    name: "duplicate-id",
    file: "b.spec.yaml",
    line: 1,
    path: "/id",
    message: "component.thing is already used by a.spec.yaml",
  },
  {
    name: "id-prefix",
    file: "thing.md",
    line: 2,
    path: "/id",
    message: "prefix `guideline` must equal the record type `pattern`",
  },
  {
    name: "unknown-link",
    file: "thing.spec.yaml",
    line: 7,
    path: "/links/related/0",
    message: "`component.ghost` does not match any record",
  },
  {
    name: "unknown-section",
    file: "thing.spec.yaml",
    line: 19,
    path: "/rules/0/references/0",
    message: "pattern.guide has no section `nope`",
  },
  {
    name: "unknown-instead",
    file: "thing.spec.yaml",
    line: 11,
    path: "/usage/avoid/0/instead",
    message: "`component.ghost` does not match any record",
  },
  {
    name: "unknown-annotation-reference",
    file: "demo.md",
    line: 18,
    path: "/annotations/0/references/0",
    message: "`component.ghost` does not match any record",
  },
  {
    name: "rule-duplicate",
    file: "thing.spec.yaml",
    line: 18,
    path: "/rules/1/id",
    message: "rule id `once` is already used by /rules/0",
  },
  {
    name: "rule-field-collision",
    file: "thing.spec.yaml",
    line: 14,
    path: "/rules/0/id",
    message: "rule id `anatomy` is also a top-level field name",
  },
  {
    name: "enum-default",
    file: "thing.spec.yaml",
    line: 18,
    path: "/parameters/tone/default",
    message: "`default` loud is not one of the values of `tone`",
  },
  {
    name: "enum-example",
    file: "thing.spec.yaml",
    line: 19,
    path: "/parameters/tone/examples/loud",
    message: "example `loud` is not one of the values of `tone`",
  },
  {
    name: "guidance-value",
    file: "thing.spec.yaml",
    line: 26,
    path: "/parameters/tone/guidance/quiet",
    message: "guidance `quiet` is not one of the values of `tone`",
  },
  {
    name: "token-part",
    file: "thing.spec.yaml",
    line: 14,
    path: "/tokens/surface",
    message: "token part `surface` is not an anatomy part",
  },
  {
    name: "token-condition",
    file: "thing.spec.yaml",
    line: 20,
    path: "/tokens/control/tone.calm + hover",
    message: "`hover` is not `base` or a declared state",
  },
  {
    name: "asset-missing",
    file: "demo.md",
    line: 8,
    path: "/assets/0/path",
    message: "asset file `missing.svg` does not exist",
  },
  {
    name: "section-no-headings",
    file: "thing.spec.yaml",
    line: 7,
    path: "/links/follows/0",
    message: "guideline.guide has no section `anything`",
  },
  {
    name: "asset-outside",
    file: "demo.md",
    line: 8,
    path: "/assets/0/path",
    message: "asset path `../asset-missing/demo.md` must be relative and stay inside",
  },
  {
    name: "missing-required",
    file: "thing.spec.yaml",
    line: 1,
    path: "/anatomy",
    message: "`anatomy` is required",
  },
  {
    name: "unknown-field",
    file: "thing.spec.yaml",
    line: 13,
    path: "/colour",
    message: "`colour` is not an allowed field",
  },
  {
    name: "bad-value",
    file: "thing.spec.yaml",
    line: 11,
    path: "/anatomy/control/role",
    message: "`role` must be one of",
  },
  {
    name: "yaml-duplicate-key",
    file: "thing.spec.yaml",
    line: 13,
    path: "",
    message: "Map keys must be unique",
  },
  {
    name: "link-composes-pattern",
    file: "thing.spec.yaml",
    line: 7,
    path: "/links/composes/0",
    message: "a `composes` link must point at a component, and pattern.guide is a pattern",
  },
  {
    name: "link-follows-component",
    file: "thing.spec.yaml",
    line: 7,
    path: "/links/follows/0",
    message: "must point at a pattern or a guideline, and component.other is a component",
  },
  {
    name: "link-source-type",
    file: "thing.spec.yaml",
    line: 6,
    path: "/links/example-of",
    message: "a component cannot declare `example-of` links; only an example can",
  },
  {
    name: "guidance-target-type",
    file: "thing.spec.yaml",
    line: 19,
    path: "/parameters/tone/guidance/calm",
    message: "parameter guidance must point at a pattern or a guideline",
  },
  {
    name: "annotation-duplicate",
    file: "demo.md",
    line: 17,
    path: "/annotations/1/id",
    message: "annotation id `box` is already used by /annotations/0",
  },
  {
    name: "annotation-heading",
    file: "demo.md",
    line: 17,
    path: "/annotations/1/id",
    message: 'annotation id `why-it-works` is also the address of the heading "Why it works"',
  },
  {
    name: "known-issue-url",
    file: "thing.spec.yaml",
    line: 15,
    path: "/known-issues/0/issue",
    message: "`issue` must match",
  },
  {
    name: "placeholder",
    file: "thing.spec.yaml",
    line: 10,
    path: "/usage/do/1",
    message: "is a `TODO:` placeholder; replace it",
  },
  { name: "yaml-syntax", file: "thing.md", line: 3, path: "", message: "Flow sequence" },
];

describe("validation", () => {
  it("accepts the valid fixture, including prose `instead` text and non-record Markdown", async () => {
    const { issues, recordCount } = await validateSpec({ contentDir: fixture("valid") });
    expect(issues).toEqual([]);
    expect(recordCount).toBe(4);
  });

  it("reports a link to a record that failed its schema, once, beside that record's own issue", async () => {
    const { issues } = await validateSpec({ contentDir: fixture("link-to-invalid") });
    expect(issues.map((issue) => [issue.file, issue.path, issue.message])).toEqual([
      ["broken.md", "/colour", "`colour` is not an allowed field"],
      [
        "thing.spec.yaml",
        "/links/follows/0",
        "`pattern.broken#first-step` points at pattern.broken, which is not a valid record",
      ],
    ]);
  });

  it.each(cases)("reports one mistake once: $name", async ({ name, ...expected }) => {
    const { issues } = await validateSpec({ contentDir: fixture(name) });
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({
      file: expected.file,
      line: expected.line,
      path: expected.path,
    });
    expect(issues[0].message).toContain(expected.message);
  });

  it("throws a SpecError that lists every issue", async () => {
    const error = await loadSpec({ contentDir: fixture("duplicate-id") }).catch((e) => e);
    expect(error).toBeInstanceOf(SpecError);
    expect(error.issues).toHaveLength(1);
    expect(error.message).toContain("b.spec.yaml:1 /id");
  });

  it("resolves a relative content folder against the working directory", async () => {
    const relative = fixture("valid").replace(`${process.cwd()}/`, "");
    const { issues } = await validateSpec({ contentDir: relative });
    expect(issues).toEqual([]);
  });
});
