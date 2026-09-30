import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { fixture } from "./helpers.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const bin = path.resolve(here, "../bin/knowledge.js");
const repoRoot = path.resolve(here, "../../..");
const tools = fixture("tools");

function knowledge(args, cwd = repoRoot) {
  const result = spawnSync(process.execPath, [bin, ...args], { cwd, encoding: "utf8" });
  return { code: result.status, out: result.stdout, err: result.stderr };
}

describe("knowledge CLI, real content", () => {
  it("validates", () => {
    const r = knowledge(["validate"]);
    expect(r.code).toBe(0);
    expect(r.out).toMatch(/^OK: \d+ records, no issues\./);
  });

  it("lists with filters", () => {
    const r = knowledge(["list", "--type", "component"]);
    expect(r.code).toBe(0);
    expect(r.out).toContain("- component.button — Button: ");
    expect(r.out).not.toContain("pattern.action-hierarchy");
  });

  it("searches", () => {
    const r = knowledge(["search", "destructive", "action"]);
    expect(r.code).toBe(0);
    expect(r.out).toContain("- pattern.action-hierarchy — Action hierarchy: ");
  });

  it("gets a record and a section", () => {
    expect(knowledge(["get", "component.button"]).out).toMatch(/^# Button/);
    const section = knowledge(["get", "pattern.action-hierarchy#assign-emphasis"]);
    expect(section.code).toBe(0);
    expect(section.out).toContain("## Assign emphasis");
  });

  it("gets an example with every annotation and its references", () => {
    const { out } = knowledge(["get", "example.action-hierarchy.settings"]);
    for (const id of ["profile-actions", "danger-zone", "outcome-labels"]) {
      expect(out).toContain(`\`example.action-hierarchy.settings#${id}\``);
    }
    expect(out).toContain("(pattern.action-hierarchy#separate-unrelated-decisions)");
    expect(out).toContain("(component.button#label-describes-result)");
  });

  it("shows links grouped by kind", () => {
    const r = knowledge(["links", "component.link", "--kind", "alternative"]);
    expect(r.code).toBe(0);
    expect(r.out).toContain("## alternative");
    expect(r.out).toContain("- component.button: ");
  });

  it("shows incoming links with both ends, apart from outgoing ones", () => {
    const r = knowledge(["links", "component.badge", "--direction", "in", "--kind", "alternative"]);
    expect(r.code).toBe(0);
    expect(r.out).toContain("## alternative (incoming)");
    expect(r.out).toContain("- component.button → component.badge: ");
  });

  it("lists rules as addresses", () => {
    const r = knowledge(["rules", "--level", "must", "--topic", "accessibility"]);
    expect(r.code).toBe(0);
    expect(r.out).toMatch(/^- \*\*MUST\*\* component\.\w[\w-]*#[\w-]+: /m);
    expect(r.out).not.toContain("**SHOULD**");
  });

  it("resolves tokens for light and dark", () => {
    const r = knowledge([
      "tokens",
      "component.button",
      "--condition",
      "variant.primary + hover",
      "--resolve",
    ]);
    expect(r.code).toBe(0);
    expect(r.out).toContain("| light | dark |");
    expect(r.out).toContain("`#823f1e`");
    expect(r.out).toContain("`#e8c468`");
  });

  it("omits values without --resolve", () => {
    const r = knowledge(["tokens", "component.button", "--part", "control"]);
    expect(r.out).toContain("| Part | Condition | Property | Token |");
    expect(r.out).not.toContain("light");
  });

  it("prints help", () => {
    const r = knowledge(["help", "tokens"]);
    expect(r.code).toBe(0);
    expect(r.out).toContain("knowledge tokens <id>");
  });
});

describe("knowledge CLI, --json", () => {
  it.each([
    [["list"], (d) => expect(Array.isArray(d)).toBe(true)],
    [["search", "button"], (d) => expect(d[0]).toHaveProperty("score")],
    [["get", "component.button"], (d) => expect(d.id).toBe("component.button")],
    [
      ["get", "component.button#label-describes-result"],
      (d) => expect(d.recordId).toBe("component.button"),
    ],
    [["links", "component.button"], (d) => expect(d[0]).toHaveProperty("kind")],
    [["rules", "--level", "must"], (d) => expect(d[0]).toHaveProperty("address")],
    [
      ["tokens", "component.button", "--resolve"],
      (d) => expect(d[0].values).toHaveProperty("light"),
    ],
    [["validate"], (d) => expect(d.issues).toEqual([])],
  ])("%j parses", (args, check) => {
    const r = knowledge([...args, "--json"]);
    expect(r.code).toBe(0);
    check(JSON.parse(r.out));
  });
});

describe("knowledge CLI, failures", () => {
  it("exits 2 on usage errors", () => {
    expect(knowledge([]).code).toBe(0);
    expect(knowledge(["bogus"]).code).toBe(2);
    expect(knowledge(["get"]).code).toBe(2);
    expect(knowledge(["search"]).code).toBe(2);
    expect(knowledge(["list", "--nope"]).code).toBe(2);
    expect(knowledge(["search", "x", "--limit", "abc"]).code).toBe(2);
    expect(knowledge(["links", "component.button", "--direction", "up"]).code).toBe(2);
    expect(knowledge(["help", "bogus"]).code).toBe(2);
    expect(knowledge(["get", "a", "b"]).err).toContain("needs exactly one id");
  });

  it("exits 1 for unknown ids and sections, with the error on stderr", () => {
    const record = knowledge(["get", "component.nope"]);
    expect(record.code).toBe(1);
    expect(record.out).toContain('Unknown record "component.nope"');
    expect(knowledge(["get", "component.button#nope"]).code).toBe(1);
    expect(knowledge(["links", "component.nope"]).code).toBe(1);
    expect(knowledge(["tokens", "component.nope"]).code).toBe(1);
  });

  it("exits 1 and lists issues for invalid content", () => {
    const content = fixture("unknown-field");
    const v = knowledge(["validate", "--content", content]);
    expect(v.code).toBe(1);
    expect(v.out).toMatch(/\.yaml:\d+ \S+ .+\n\d+ issues? in/);
    const g = knowledge(["get", "component.thing", "--content", content]);
    expect(g.code).toBe(1);
    expect(g.err).toContain("Invalid knowledge content");
  });

  it("exits 2 for a bad config", () => {
    const r = knowledge(["list", "--config", path.join(tools, "bad.config.json")]);
    expect(r.code).toBe(2);
    expect(r.err).toContain("Invalid config");
  });
});

describe("knowledge CLI, fixture config", () => {
  it("finds the config from the working directory", () => {
    const r = knowledge(["list"], tools);
    expect(r.out).toContain("component.thing");
    expect(r.out).not.toContain("component.button");
  });

  it("--content overrides the config", () => {
    const r = knowledge(["list", "--content", path.join(tools, "content")], repoRoot);
    expect(r.out).toContain("component.thing");
  });

  it("resolves fixture tokens", () => {
    const r = knowledge(
      ["tokens", "component.thing", "--condition", "tone.loud + hover", "--resolve"],
      tools,
    );
    expect(r.out).toContain("`#0000ff`");
    expect(r.out).toContain("`#ffff00`");
  });
});
