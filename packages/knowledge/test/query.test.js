import { beforeAll, describe, expect, it } from "vitest";
import { loadKnowledge } from "../src/index.js";
import { buildLinks } from "../src/links.js";
import { fixture } from "./helpers.js";

/** @type {import("../src/index.js").Knowledge} */
let valid;
/** @type {import("../src/index.js").Knowledge} */
let shipped;

beforeAll(async () => {
  valid = await loadKnowledge({
    contentDir: fixture("valid"),
    resolveToken: (ref) =>
      ref === "component.thing.radius" ? { light: "4px", dark: "4px" } : undefined,
  });
  shipped = await loadKnowledge();
});

describe("list and get", () => {
  it("lists summaries sorted by id, with defaults applied", () => {
    expect(valid.list().map((item) => item.id)).toEqual([
      "component.other",
      "component.thing",
      "example.guide.demo",
      "pattern.guide",
    ]);
    expect(valid.list({ type: "component" })[0]).toEqual({
      id: "component.other",
      type: "component",
      title: "Other",
      summary: "Use Other for testing.",
      tags: [],
      status: "stable",
    });
  });

  it("filters by type, tag, and status", () => {
    expect(valid.list({ tag: "test" }).map((item) => item.id)).toEqual([
      "component.thing",
      "pattern.guide",
    ]);
    expect(valid.list({ status: "draft" })).toEqual([]);
  });

  it("returns the whole record with file, body, and sections", () => {
    const guide = valid.get("pattern.guide");
    expect(guide.file).toBe("docs/guide.md");
    expect(guide.body).toContain("## First step");
    expect(guide.sections).toEqual(["first-step", "detail", "second-step"]);
    expect(valid.get("component.thing").body).toBeUndefined();
    expect(valid.get("component.nope")).toBeUndefined();
  });

  it("returns frozen records", () => {
    expect(() => {
      valid.get("component.thing").title = "Changed";
    }).toThrow(TypeError);
  });
});

describe("section", () => {
  it("returns a heading's Markdown up to the next heading of the same or higher level", () => {
    const first = valid.section("pattern.guide#first-step");
    expect(first).toMatchObject({
      recordId: "pattern.guide",
      section: "first-step",
      title: "First step",
    });
    expect(first.content).toContain("Do it.");
    expect(first.content).toContain("### Detail");
    expect(first.content).not.toContain("Then this.");
    expect(valid.section("pattern.guide#detail").content).toBe("More.");
  });

  it("slugs headings by removing punctuation", () => {
    expect(valid.section("pattern.guide#second-step").title).toBe("Second step!");
  });

  it("returns rules, fields, and dotted paths from a component", () => {
    expect(valid.section("component.thing#stay-visible").content).toMatchObject({ level: "must" });
    expect(valid.section("component.thing#usage").content.do).toEqual(["Test things."]);
    expect(valid.section("component.thing#parameters.tone.loud").content).toBe("Noisy.");
    expect(valid.section("component.thing#anatomy.control").title).toBe("control");
  });

  it("returns annotations from an example", () => {
    const box = valid.section("example.guide.demo#box");
    expect(box.title).toBe("The box");
    expect(box.content.description).toBe("It is a box.");
  });

  it("is undefined when either part is missing", () => {
    expect(valid.section("pattern.guide#nope")).toBeUndefined();
    expect(valid.section("pattern.nope#first-step")).toBeUndefined();
    expect(valid.section("pattern.guide")).toBeUndefined();
  });
});

describe("search", () => {
  it("ranks the records a query describes first", () => {
    const destructive = shipped.search("destructive action").map((hit) => hit.id);
    expect(destructive.slice(0, 3)).toContain("component.button");
    expect(destructive.slice(0, 3)).toContain("pattern.action-hierarchy");
    expect(shipped.search("navigate")[0].id).toBe("component.link");
  });

  it("drops weak matches that score far below the top hit", () => {
    const hits = shipped.search("destructive action");
    expect(hits.map((hit) => hit.id)).toEqual([
      "example.action-hierarchy.settings",
      "pattern.action-hierarchy",
      "component.button",
    ]);
    expect(hits.every((hit) => hit.score >= hits[0].score * 0.25)).toBe(true);
  });

  it("returns summaries with a score and the fields that matched", () => {
    const [hit] = shipped.search("checkbox");
    expect(hit).toMatchObject({ id: "component.checkbox", type: "component", status: "stable" });
    expect(hit.score).toBeGreaterThan(0);
    expect(hit.matches).toContain("title");
  });

  it("matches rule statements and names the rule", () => {
    const hit = shipped.search("click here").find((item) => item.id === "component.button");
    expect(hit.matches).toContain("rule:label-describes-result");
  });

  it("filters by type and tags, and honors limit", () => {
    expect(shipped.search("action", { type: "pattern" }).map((hit) => hit.id)).toEqual([
      "pattern.action-hierarchy",
    ]);
    expect(shipped.search("action", { tags: ["navigation"] }).map((hit) => hit.id)).toEqual([
      "component.link",
    ]);
    expect(shipped.search("action", { limit: 2 })).toHaveLength(2);
  });

  it("is case-insensitive, deterministic, and empty for no match", () => {
    expect(shipped.search("NAVIGATE")).toEqual(shipped.search("navigate"));
    expect(shipped.search("zzzz")).toEqual([]);
    expect(shipped.search("   ")).toEqual([]);
  });
});

describe("links", () => {
  const brief = (links) =>
    links.map(({ from, to, kind, source }) => `${from} ${kind} ${to} (${source})`);

  it("materializes inverses of authored links", () => {
    expect(brief(valid.links("component.other", { kind: "used-in", direction: "out" }))).toEqual([
      "component.other used-in component.thing (links)",
    ]);
    expect(brief(valid.links("component.thing", { kind: "composes", direction: "out" }))).toEqual([
      "component.thing composes component.other (links)",
    ]);
  });

  it("derives an alternative from usage.avoid, with situation and why, and its inverse", () => {
    const [alternative] = valid.links("component.other", { kind: "alternative", direction: "out" });
    expect(alternative).toEqual({
      from: "component.other",
      to: "component.thing",
      kind: "alternative",
      source: "usage",
      situation: "Do a thing Other cannot.",
      why: "Thing can.",
    });
    const [inverse] = valid.links("component.thing", { kind: "alternative-to", direction: "out" });
    expect(inverse).toMatchObject({ to: "component.other", source: "usage", why: "Thing can." });
  });

  it("does not link prose in `instead`", () => {
    const targets = valid.links("component.other", { kind: "alternative" }).map((link) => link.to);
    expect(targets).not.toContain("a future component");
  });

  it("makes rule references follow patterns and relate to anything else", () => {
    expect(brief(valid.links("component.thing", { kind: "follows", direction: "out" }))).toEqual([
      "component.thing follows pattern.guide#first-step (rule)",
    ]);
    expect(brief(valid.links("pattern.guide", { kind: "followed-by", direction: "out" }))).toEqual([
      "pattern.guide followed-by component.thing (rule)",
    ]);
    expect(
      valid.links("component.thing", { kind: "related", direction: "out" }).map((l) => l.to),
    ).toEqual(["component.other", "pattern.guide"]);
  });

  it("gives an example its example-of link and its target the inverse", () => {
    expect(
      brief(valid.links("example.guide.demo", { kind: "example-of", direction: "out" })),
    ).toEqual(["example.guide.demo example-of pattern.guide (links)"]);
    expect(brief(valid.links("pattern.guide", { kind: "examples", direction: "out" }))).toEqual([
      "pattern.guide examples example.guide.demo (links)",
    ]);
  });

  it("creates no links from annotation references", () => {
    const kinds = valid.links("example.guide.demo", { direction: "out" }).map((link) => link.kind);
    expect(kinds).toEqual(["example-of"]);
  });

  it("treats related as its own inverse", () => {
    expect(
      valid.links("component.thing", { kind: "related", direction: "out" }).map((l) => l.to),
    ).toContain("pattern.guide");
    expect(
      valid.links("pattern.guide", { kind: "related", direction: "out" }).map((l) => l.to),
    ).toContain("component.thing");
  });

  it("defaults to outgoing links, and supports incoming and combined directions", () => {
    const out = valid.links("pattern.guide");
    expect(out).toEqual(valid.links("pattern.guide", { direction: "out" }));
    expect(out.every((link) => link.from === "pattern.guide")).toBe(true);
    const incoming = valid.links("pattern.guide", { direction: "in" });
    expect(incoming.every((link) => link.to.split("#")[0] === "pattern.guide")).toBe(true);
    const both = valid.links("pattern.guide", { direction: "both" });
    expect(both.length).toBeGreaterThan(0);
    const keys = both.map((link) => `${link.kind}\0${link.to}`);
    expect(keys).toEqual([...keys].sort());
  });

  it("lists each relationship once in both directions, since inverses are stored", () => {
    for (const id of valid.list().map((record) => record.id)) {
      expect(valid.links(id, { direction: "both" })).toEqual(valid.links(id));
    }
  });
});

describe("buildLinks", () => {
  it("keeps every usage.avoid entry that names the same alternative", () => {
    const links = buildLinks([
      {
        id: "component.a",
        usage: {
          avoid: [
            { situation: "Navigate.", instead: "component.b" },
            { situation: "Open a new tab.", instead: "component.b" },
          ],
        },
      },
      { id: "component.b" },
    ]);
    const situations = (from, kind) =>
      links.filter((l) => l.from === from && l.kind === kind).map((l) => l.situation);
    expect(situations("component.a", "alternative")).toEqual(["Navigate.", "Open a new tab."]);
    expect(situations("component.b", "alternative-to")).toEqual(["Navigate.", "Open a new tab."]);
  });
});

describe("rules", () => {
  it("sorts by level, then record, then authored order", () => {
    expect(valid.rules().map((rule) => rule.address)).toEqual([
      "component.thing#stay-visible",
      "component.thing#name-it",
      "component.thing#keep-it-short",
    ]);
  });

  it("returns the full rule with its address and record title", () => {
    const [rule] = valid.rules({ id: "component.thing", level: "should" });
    expect(rule).toMatchObject({
      address: "component.thing#keep-it-short",
      recordId: "component.thing",
      recordTitle: "Thing",
      topic: "content",
      statement: "Keep the text short.",
      references: ["pattern.guide#first-step", "component.other"],
    });
  });

  it("filters by record, topic, level, and query", () => {
    expect(valid.rules({ id: "component.other" })).toEqual([]);
    expect(valid.rules({ topic: "accessibility" }).map((rule) => rule.id)).toEqual(["name-it"]);
    expect(shipped.rules({ level: "may" }).every((rule) => rule.level === "may")).toBe(true);
    expect(valid.rules({ query: "accessible name" }).map((rule) => rule.id)).toEqual(["name-it"]);
  });

  it("matches query words against rule text, not field names", () => {
    for (const field of ["statement", "topic", "level", "references"]) {
      expect(valid.rules({ query: field })).toEqual([]);
    }
  });
});

describe("tokens", () => {
  it("returns rows in authored order", () => {
    expect(
      valid.tokens("component.thing").map((row) => `${row.condition}/${row.property}`),
    ).toEqual([
      "base/radius",
      "tone.loud + hover/background",
      "busy.true/motion",
      "reducedMotion.reduce/motion",
      "disabled/foreground",
    ]);
  });

  it("filters by part, condition (exact), and property", () => {
    expect(valid.tokens("component.thing", { condition: "tone.loud + hover" })).toEqual([
      {
        part: "control",
        condition: "tone.loud + hover",
        property: "background",
        token: "component.thing.loud.hover",
      },
    ]);
    expect(valid.tokens("component.thing", { condition: "tone.loud" })).toEqual([]);
    expect(valid.tokens("component.thing", { property: "motion" })).toHaveLength(2);
    expect(valid.tokens("component.thing", { part: "none" })).toEqual([]);
    expect(valid.tokens("pattern.guide")).toEqual([]);
  });

  it("adds values only when resolveToken returns them", () => {
    const [radius, hover] = valid.tokens("component.thing");
    expect(radius.values).toEqual({ light: "4px", dark: "4px" });
    expect(hover).not.toHaveProperty("values");
  });
});
