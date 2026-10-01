import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
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
    expect(knowledge(["get"]).err).toContain("get needs an id");
    expect(knowledge(["list", "extra"]).err).toContain("takes no positional arguments");
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

describe("knowledge CLI, implementations", () => {
  it("gets a component with its web implementation", () => {
    const r = knowledge(["get", "component.button", "--impl", "web"]);
    expect(r.code).toBe(0);
    expect(r.out).toMatch(/^# Button/);
    expect(r.out).toContain("## Web implementation");
    expect(r.out).toContain("- Element: `<ds-button>`");
    expect(r.out).toContain(
      'import { defineButton } from "@stevegreco/design-system-components/button";',
    );
    expect(r.out).toContain(
      "| `type` | attribute | parameter `action` | `activate` → `button`, `submit`, `reset` |",
    );
    expect(r.out).toContain("| `aria-label` | attribute | parameter `accessibleName` |");
    // The implementation's own guidance follows, one heading level down.
    expect(r.out).toContain("### Forms");
  });

  it("points a plain get at the implementation", () => {
    const { out } = knowledge(["get", "component.button"]);
    expect(out).not.toContain("## Web implementation");
    expect(out.trimEnd().split("\n").slice(-2)).toEqual([
      "Implementation: run `knowledge get component.button --impl web` for the package, element, and attribute names.",
      "Tokens: 50 bindings, left out here. Run `knowledge tokens component.button` to filter them by part, condition, or property.",
    ]);
    expect(knowledge(["get", "pattern.action-hierarchy"]).out).not.toContain("Implementation:");
  });

  it("returns the record and implementation as JSON", () => {
    const data = JSON.parse(knowledge(["get", "component.link", "--impl", "web", "--json"]).out);
    expect(data.record.id).toBe("component.link");
    expect(data.implementation.tagName).toBe("ds-link");
  });

  it("explains a missing or unknown implementation", () => {
    const pattern = knowledge(["get", "pattern.action-hierarchy", "--impl", "web"]);
    expect(pattern.code).toBe(1);
    expect(pattern.out).toContain("No web implementation for pattern.action-hierarchy.");
    const unknown = knowledge(["get", "component.button", "--impl", "ios"]);
    expect(unknown.code).toBe(1);
    expect(unknown.out).toContain('No implementation named "ios". Configured: web.');
    const section = knowledge(["get", "component.button#rules", "--impl", "web"]);
    expect(section.code).toBe(2);
    expect(section.err).toContain("not a section");
  });

  it("rejects an implementation that does not match its record", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "knowledge-impl-"));
    fs.mkdirSync(path.join(tmp, "web"));
    const button = fs.readFileSync(
      path.join(repoRoot, "apps/documentation/implementation/button.md"),
      "utf8",
    );
    fs.writeFileSync(
      path.join(tmp, "web/button.md"),
      button.replace("parameter: action", "parameter: actoin"),
    );
    fs.writeFileSync(
      path.join(tmp, "knowledge.config.json"),
      JSON.stringify({
        content: path.join(repoRoot, "packages/knowledge/content"),
        implementations: { web: "web" },
      }),
    );
    const r = knowledge(["get", "button", "--impl", "web", "--json"], tmp);
    expect(r.code).toBe(1);
    const error = JSON.parse(r.out);
    expect(error.code).toBe("ERR_INVALID_IMPLEMENTATION");
    expect(error.error).toContain('implements the parameter "actoin"');
    fs.rmSync(tmp, { recursive: true });
  });

  it("explains that no implementations are configured", () => {
    const r = knowledge(["get", "component.thing", "--impl", "web"], tools);
    expect(r.code).toBe(1);
    expect(r.out).toContain("No implementations are configured.");
  });
});

describe("knowledge CLI, short records", () => {
  it("leaves the token table out of a whole component record", () => {
    for (const args of [
      ["get", "button"],
      ["get", "button", "--impl", "web"],
    ]) {
      const { out } = knowledge(args);
      expect(out).not.toContain("## Tokens");
      expect(out).not.toContain("component.button.primary.background.hover");
      expect(out).toContain("Tokens: 50 bindings, left out here.");
    }
  });

  it("still prints the tokens section and the tokens command", () => {
    expect(knowledge(["get", "button#tokens"]).out).toContain(
      "component.button.primary.background.hover",
    );
    expect(knowledge(["tokens", "button"]).out).toContain(
      "component.button.primary.background.hover",
    );
  });

  it("keeps the full record in JSON", () => {
    const data = JSON.parse(knowledge(["get", "button", "--json"]).out);
    expect(Object.keys(data.tokens)).toContain("control");
  });

  it("adds no tokens line to a record without tokens", () => {
    expect(knowledge(["get", "pattern.action-hierarchy"]).out).not.toContain("Tokens:");
  });
});

describe("knowledge CLI, forgiving lookups", () => {
  it("matches the start of a name or title", () => {
    expect(knowledge(["search", "chec"]).out).toMatch(/^- component\.checkbox — /);
    expect(knowledge(["search", "textfi"]).out).toMatch(/^- component\.text-field — /);
    // Too short, or too little of the word, to count.
    expect(knowledge(["search", "che"]).out).toBe('No results for "che".\n');
    expect(knowledge(["search", "comp"]).out).not.toContain("component.button");
  });

  it("finds a record by name", () => {
    expect(knowledge(["get", "button"]).out).toMatch(/^# Button/);
    expect(knowledge(["get", "Text", "field"]).out).toMatch(/^# Text field/);
    expect(knowledge(["get", "textfield", "--impl", "web"]).out).toContain("`<ds-text-field>`");
    expect(knowledge(["get", "button#rules"]).out).toContain("## Rules");
    expect(knowledge(["tokens", "button", "--part", "control"]).code).toBe(0);
    expect(knowledge(["links", "link"]).out).toContain("component.button");
    expect(knowledge(["rules", "--id", "button#label-describes-result"]).out).toContain(
      "component.button#label-describes-result",
    );
  });

  it("suggests the record a typo meant", () => {
    const typo = knowledge(["get", "buton"]);
    expect(typo.code).toBe(1);
    expect(typo.out).toContain('Unknown record "buton". Did you mean: component.button?');
    expect(knowledge(["get", "hierarchy"]).out).toContain("pattern.action-hierarchy");
  });

  it("returns an error envelope in JSON", () => {
    const record = JSON.parse(knowledge(["get", "buton", "--json"]).out);
    expect(record).toEqual({
      error: 'Unknown record "buton". Did you mean: component.button?',
      code: "ERR_UNKNOWN_RECORD",
      suggestions: ["component.button"],
    });
    const section = JSON.parse(knowledge(["get", "component.button#rule", "--json"]).out);
    expect(section.code).toBe("ERR_UNKNOWN_SECTION");
    expect(section.suggestions).toContain("component.button#rules");
    const impl = JSON.parse(knowledge(["get", "button", "--impl", "ios", "--json"]).out);
    expect(impl).toMatchObject({ code: "ERR_UNKNOWN_IMPLEMENTATION", suggestions: ["web"] });
    const none = JSON.parse(
      knowledge(["get", "pattern.action-hierarchy", "--impl", "web", "--json"]).out,
    );
    expect(none.code).toBe("ERR_NO_IMPLEMENTATION");
  });

  it("searches through typos and names the next command", () => {
    const r = knowledge(["search", "chekbox"]);
    expect(r.out).toContain("- component.checkbox — Checkbox: ");
    expect(r.out).toContain("  → knowledge get component.checkbox --impl web");
    // One edit is the allowance for a word this short, so two edits match nothing.
    expect(knowledge(["search", "buxxon"]).out).toBe('No results for "buxxon".\n');
    // Four letters get no typo allowance, and words in a longer query are not corrected.
    expect(knowledge(["search", "lnik"]).out).toBe('No results for "lnik".\n');
    expect(knowledge(["search", "buton", "zzzz"]).out).toBe('No results for "buton zzzz".\n');
    expect(knowledge(["search", "destructive", "action"]).out).toContain(
      "  → knowledge get pattern.action-hierarchy\n",
    );
  });
});
