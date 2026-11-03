import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { AGENT_INSTRUCTIONS } from "../src/agents.js";
import { splitWords } from "../src/util.js";
import { fixture } from "./helpers.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const bin = path.resolve(here, "../bin/ds-spec.js");
const repoRoot = path.resolve(here, "../../..");
const tools = fixture("tools");
// Implementations come from a fixture config, so adding one to the repository changes no output.
const impls = fixture("implementations");

function cli(args, cwd = repoRoot) {
  const result = spawnSync(process.execPath, [bin, ...args], { cwd, encoding: "utf8" });
  return { code: result.status, out: result.stdout, err: result.stderr };
}

describe("ds-spec CLI, real content", () => {
  it("validates", () => {
    const r = cli(["validate"]);
    expect(r.code).toBe(0);
    expect(r.out).toMatch(/^OK: \d+ records, no issues\./);
  });

  it("lists with filters", () => {
    const r = cli(["list", "--type", "component"]);
    expect(r.code).toBe(0);
    expect(r.out).toContain("- component.button — Button: ");
    expect(r.out).not.toContain("pattern.action-hierarchy");
  });

  it("searches", () => {
    const r = cli(["search", "destructive", "action"]);
    expect(r.code).toBe(0);
    expect(r.out).toContain("- pattern.action-hierarchy — Action hierarchy: ");
  });

  it("gets a record and a section", () => {
    expect(cli(["get", "component.button"]).out).toMatch(/^# Button/);
    const section = cli(["get", "pattern.action-hierarchy#assign-emphasis"]);
    expect(section.code).toBe(0);
    expect(section.out).toContain("## Assign emphasis");
  });

  it("gets an example with every annotation and its references", () => {
    const { out } = cli(["get", "example.action-hierarchy.settings"]);
    for (const id of ["profile-actions", "danger-zone", "outcome-labels"]) {
      expect(out).toContain(`\`example.action-hierarchy.settings#${id}\``);
    }
    expect(out).toContain("(pattern.action-hierarchy#separate-unrelated-decisions)");
    expect(out).toContain("(component.button#label-describes-result)");
  });

  it("shows links grouped by kind", () => {
    const r = cli(["links", "component.link", "--kind", "alternative"]);
    expect(r.code).toBe(0);
    expect(r.out).toContain("## alternative");
    expect(r.out).toContain("- component.button: ");
  });

  it("shows incoming links with both ends, apart from outgoing ones", () => {
    const r = cli(["links", "component.badge", "--direction", "in", "--kind", "alternative"]);
    expect(r.code).toBe(0);
    expect(r.out).toContain("## alternative (incoming)");
    expect(r.out).toContain("- component.button → component.badge: ");
  });

  it("lists rules as addresses", () => {
    const r = cli(["rules", "--level", "must", "--topic", "accessibility"]);
    expect(r.code).toBe(0);
    expect(r.out).toMatch(/^- \*\*MUST\*\* component\.\w[\w-]*#[\w-]+: /m);
    expect(r.out).not.toContain("**SHOULD**");
  });

  it("keeps a conditional rule's condition, and says how to read a rule in full", () => {
    const r = cli(["rules", "--id", "component.checkbox#form-value"]);
    expect(r.code).toBe(0);
    expect(r.out).toContain("- **SHOULD** component.checkbox#form-value: ");
    expect(r.out).toContain("\n  - Applies when: The checkbox belongs to a form.");
    const all = cli(["rules", "--id", "checkbox"]);
    expect(all.out).toMatch(
      /Run `ds-spec get <address>`, such as `ds-spec get component\.checkbox#[\w-]+`/,
    );
  });

  it("gets a parameter value with its example and guidance", () => {
    const r = cli(["get", "component.button#parameters.variant.destructive"]);
    expect(r.code).toBe(0);
    expect(r.out).toContain("Destructive or difficult-to-reverse action.");
    expect(r.out).toContain("Example: Delete project");
    expect(r.out).toContain("Guidance: [Action hierarchy](pattern.action-hierarchy#destructive)");
  });

  it("resolves tokens for light and dark", () => {
    const r = cli([
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
    const r = cli(["tokens", "component.button", "--part", "control"]);
    expect(r.out).toContain("| Part | Condition | Property | Token |");
    expect(r.out).not.toContain("light");
  });

  it("prints the agent instructions, and AGENTS.md carries the same text", () => {
    const r = cli(["help", "agents"]);
    expect(r.code).toBe(0);
    expect(r.out).toBe(`${AGENT_INSTRUCTIONS}\n`);
    const agents = fs.readFileSync(path.join(repoRoot, "AGENTS.md"), "utf8");
    const copy = agents.match(
      /<!-- agent-instructions:start -->\n([\s\S]*?)\n<!-- agent-instructions:end -->/,
    );
    expect(copy?.[1], "AGENTS.md copy of `ds-spec help agents`").toBe(AGENT_INSTRUCTIONS);
  });

  it("prints help", () => {
    const r = cli(["help", "tokens"]);
    expect(r.code).toBe(0);
    expect(r.out).toContain("ds-spec tokens <id>");
  });
});

describe("ds-spec CLI, --json", () => {
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
    const r = cli([...args, "--json"]);
    expect(r.code).toBe(0);
    check(JSON.parse(r.out));
  });
});

describe("ds-spec CLI, failures", () => {
  it("exits 2 on usage errors", () => {
    expect(cli([]).code).toBe(0);
    expect(cli(["bogus"]).code).toBe(2);
    expect(cli(["get"]).code).toBe(2);
    expect(cli(["search"]).code).toBe(2);
    expect(cli(["list", "--nope"]).code).toBe(2);
    expect(cli(["search", "x", "--limit", "abc"]).code).toBe(2);
    expect(cli(["links", "component.button", "--direction", "up"]).code).toBe(2);
    expect(cli(["help", "bogus"]).code).toBe(2);
    expect(cli(["get"]).err).toContain("get needs an id");
    expect(cli(["list", "extra"]).err).toContain("takes no positional arguments");
  });

  it("exits 1 for unknown ids and sections, with the error on stderr", () => {
    const record = cli(["get", "component.nope"]);
    expect(record.code).toBe(1);
    expect(record.out).toContain('Unknown record "component.nope"');
    expect(cli(["get", "component.button#nope"]).code).toBe(1);
    expect(cli(["links", "component.nope"]).code).toBe(1);
    expect(cli(["tokens", "component.nope"]).code).toBe(1);
  });

  it("exits 1 and lists issues for invalid content", () => {
    const content = fixture("unknown-field");
    const v = cli(["validate", "--content", content]);
    expect(v.code).toBe(1);
    expect(v.out).toMatch(/\.yaml:\d+ \S+ .+\n\d+ issues? in/);
    const g = cli(["get", "component.thing", "--content", content]);
    expect(g.code).toBe(1);
    expect(g.err).toContain("Warning: left out 1 record file with issues: thing.spec.yaml.");
  });

  it("serves the valid records when one is invalid", () => {
    const content = fixture("link-to-invalid");
    const r = cli(["get", "pattern.guide", "--content", fixture("unknown-section")]);
    expect(r.code).toBe(0);
    expect(r.err).toContain("left out 1 record file with issues: thing.spec.yaml");
    expect(cli(["list", "--content", content]).err).toContain("broken.md, thing.spec.yaml");
  });

  it("exits 1 on empty results", () => {
    expect(cli(["list", "--tag", "nope"]).code).toBe(1);
    expect(cli(["rules", "--id", "component.button", "--query", "zzzz"]).code).toBe(1);
    expect(cli(["links", "component.thing", "--kind", "examples"], tools).code).toBe(1);
    expect(cli(["tokens", "button", "--part", "nope"]).code).toBe(1);
    expect(cli(["search", "zzzz"]).code).toBe(1);
  });

  it("rejects unknown filter values with the valid ones", () => {
    for (const [args, valid] of [
      [["list", "--type", "bogus"], "component, pattern, guideline, example"],
      [["list", "--status", "old"], "draft, stable, deprecated"],
      [["rules", "--topic", "a11y"], "content, behavior, accessibility"],
      [["rules", "--level", "must-not"], "must, should, may"],
      [["links", "button", "--kind", "bogus"], "alternative, alternative-to, composes"],
    ]) {
      const r = cli(args);
      expect(r.code).toBe(2);
      expect(r.err).toContain(valid);
    }
  });

  it("exits 2 for a bad config", () => {
    const r = cli(["list", "--config", path.join(tools, "bad.config.json")]);
    expect(r.code).toBe(2);
    expect(r.err).toContain("Invalid config");
  });
});

describe("ds-spec CLI, startup", () => {
  // A loose limit that catches a large regression, such as loading a dependency per call, without
  // failing on a slow machine. The best of three runs ignores a call slowed by parallel tests.
  // `pnpm bench` measures against the real target.
  it("gets a record in under a second", () => {
    const times = Array.from({ length: 3 }, () => {
      const started = performance.now();
      expect(cli(["get", "button"]).code).toBe(0);
      return performance.now() - started;
    });
    expect(Math.min(...times)).toBeLessThan(1000);
  });
});

describe("ds-spec CLI, fixture config", () => {
  it("finds the config from the working directory", () => {
    const r = cli(["list"], tools);
    expect(r.out).toContain("component.thing");
    expect(r.out).not.toContain("component.button");
  });

  it("--content overrides the config", () => {
    const r = cli(["list", "--content", path.join(tools, "content")], repoRoot);
    expect(r.out).toContain("component.thing");
  });

  it("resolves fixture tokens", () => {
    const r = cli(
      ["tokens", "component.thing", "--condition", "tone.loud + hover", "--resolve"],
      tools,
    );
    expect(r.out).toContain("`#0000ff`");
    expect(r.out).toContain("`#ffff00`");
  });
});

describe("ds-spec CLI, implementations", () => {
  it("gets a component with its web implementation", () => {
    const r = cli(["get", "component.button", "--impl", "web"], impls);
    expect(r.code).toBe(0);
    expect(r.out).toMatch(/^# Button/);
    expect(r.out).toContain("## Web implementation");
    expect(r.out).toContain("- Element: `<ds-button>`");
    expect(r.out).toContain('import { defineButton } from "@stevegreco/web-components/button";');
    expect(r.out).toContain(
      "| `type` | attribute | parameter `action` | `activate` → `button`, `submit`, `reset` |",
    );
    expect(r.out).toContain("| `aria-label` | attribute | parameter `accessibleName` |");
    // The implementation's own guidance follows, one heading level down.
    expect(r.out).toContain("### Forms");
  });

  it("points a plain get at the implementation", () => {
    const { out } = cli(["get", "component.button"], impls);
    expect(out).not.toContain("## Web implementation");
    expect(out.trimEnd().split("\n").slice(-2)).toEqual([
      "Implementations: web, react. Run `ds-spec get component.button --impl <web | react>` for the package, import, and API names.",
      "Tokens: 50 bindings, left out here. Run `ds-spec tokens component.button` to filter them by part, condition, or property.",
    ]);
    expect(cli(["get", "pattern.action-hierarchy"], impls).out).not.toContain("Implementations:");
  });

  it("returns the record and implementation as JSON", () => {
    const data = JSON.parse(cli(["get", "component.link", "--impl", "web", "--json"], impls).out);
    expect(data.record.id).toBe("component.link");
    expect(data.implementation.tagName).toBe("ds-link");
  });

  it("explains a missing or unknown implementation", () => {
    const pattern = cli(["get", "pattern.action-hierarchy", "--impl", "web"], impls);
    expect(pattern.code).toBe(1);
    expect(pattern.out).toContain("No web implementation for pattern.action-hierarchy.");
    const unknown = cli(["get", "component.button", "--impl", "ios"], impls);
    expect(unknown.code).toBe(1);
    expect(unknown.out).toContain('No implementation named "ios". Configured: web, react.');
    const section = cli(["get", "component.button#rules", "--impl", "web"], impls);
    expect(section.code).toBe(2);
    expect(section.err).toContain("not a section");
  });

  it("rejects an implementation that does not match its record", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "spec-impl-"));
    fs.mkdirSync(path.join(tmp, "web"));
    const button = fs.readFileSync(
      path.join(repoRoot, "packages/components/implementation/button.md"),
      "utf8",
    );
    fs.writeFileSync(
      path.join(tmp, "web/button.md"),
      button.replace("parameter: action", "parameter: actoin"),
    );
    fs.writeFileSync(
      path.join(tmp, "spec.config.json"),
      JSON.stringify({
        content: path.join(repoRoot, "packages/spec/content"),
        implementations: { web: { folder: "web", technology: "web-component" } },
      }),
    );
    const r = cli(["get", "button", "--impl", "web", "--json"], tmp);
    expect(r.code).toBe(1);
    const error = JSON.parse(r.out);
    expect(error.code).toBe("ERR_INVALID_IMPLEMENTATION");
    expect(error.error).toContain('implements the parameter "actoin"');
    fs.rmSync(tmp, { recursive: true });
  });

  it("explains that no implementations are configured", () => {
    const r = cli(["get", "component.thing", "--impl", "web"], tools);
    expect(r.code).toBe(1);
    expect(r.out).toContain("No implementations are configured.");
  });

  it("reads a missing implementation folder as nothing implemented", () => {
    const config = ["--config", path.join(impls, "missing-folder.config.json")];
    const r = cli(["get", "component.button", "--impl", "react", ...config]);
    expect(r.code).toBe(1);
    expect(r.err).toBe("");
    expect(r.out).toContain("No react implementation for component.button.");
    // The folder that exists still counts, and the missing one is not offered.
    expect(cli(["get", "component.button", ...config]).out).toContain(
      "Implementations: web. Run `ds-spec get component.button --impl web` for",
    );
    expect(cli(["search", "chekbox", ...config]).out).toContain(
      "  → ds-spec get component.checkbox --impl web\n",
    );
  });
});

describe("ds-spec CLI, format reference", () => {
  it("prints the token properties, keywords, roles, and constants", () => {
    const r = cli(["format"]);
    expect(r.code).toBe(0);
    expect(r.out).toMatch(/^# Spec format\n\nFormat version 1\./);
    expect(r.out).toContain("`border-width`, `radius`");
    expect(r.out).toContain("`inherit` (the value comes from the surrounding content)");
    expect(r.out).toContain("`interactive-surface`, `label`");
    expect(r.out).toContain("| focus-ring-width | `semantic.focus.width` |");
    expect(r.out).toContain("Run `ds-spec format --resolve` for values.");
  });

  it("resolves each constant in each token set", () => {
    const r = cli(["format", "--resolve"]);
    expect(r.out).toContain("| Constant | Token | light | dark |");
    expect(r.out).toContain("| border-width | `semantic.border.width` | `1px` | `1px` |");
    const data = JSON.parse(cli(["format", "--resolve", "--json"]).out);
    expect(data.constants.map((row) => row.name)).toEqual([
      "border-width",
      "focus-ring-width",
      "focus-ring-offset",
    ]);
    expect(data.constants[0].values).toEqual({ light: "1px", dark: "1px" });
    expect(data.properties).toContain("track");
  });

  it("says when no constants are configured", () => {
    const r = cli(["format"], tools);
    expect(r.code).toBe(0);
    expect(r.out).toContain("None are configured. Add `constants` to spec.config.json.");
    expect(cli(["format", "extra"]).code).toBe(2);
  });

  it("fails validation for a constant that names no token", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "spec-constants-"));
    const config = JSON.parse(fs.readFileSync(path.join(tools, "spec.config.json"), "utf8"));
    fs.writeFileSync(
      path.join(tmp, "spec.config.json"),
      JSON.stringify({
        ...config,
        content: path.join(tools, config.content),
        tokens: {
          ...config.tokens,
          sets: Object.fromEntries(
            Object.entries(config.tokens.sets).map(([set, files]) => [
              set,
              files.map((file) => path.join(tools, file)),
            ]),
          ),
        },
        constants: { "border-width": "semantic.nope" },
      }),
    );
    const r = cli(["validate"], tmp);
    expect(r.code).toBe(1);
    expect(r.out).toContain(
      "spec.config.json /constants/border-width `semantic.nope` is not a token",
    );
    fs.rmSync(tmp, { recursive: true });
  });
});

describe("ds-spec CLI, items", () => {
  it("prints each item's parameters as a table, in the record and as a section", () => {
    const { out } = cli(["get", "component.accordion"]);
    expect(out).toContain("## Items\n\n### section\n\nOptions of each `section`.");
    expect(out).toContain("| expanded | boolean |  | `false` |");
    const item = cli(["get", "component.accordion#items.section"]);
    expect(item.code).toBe(0);
    expect(item.out).toMatch(/^## section\n\nOptions of each `section`\./);
    expect(item.out).toContain("| label | string |");
    const parameters = cli(["get", "component.accordion#items.section.parameters"]);
    expect(parameters.out).toMatch(/^## Parameters\n\n\| Name \| Kind/);
    const one = cli(["get", "component.accordion#items.section.parameters.expanded"]);
    expect(one.out).toMatch(/^## items.section.parameters.expanded\n/);
    expect(one.out).toContain("default: false");
  });

  it("prints an item's events as a list, not YAML", () => {
    const { code, out } = cli(["get", "component.thing#items.entry.events"], tools);
    expect(code).toBe(0);
    expect(out).toMatch(/^## Events\n\n- `pick`: The entry was picked\./);
  });

  it("names the item sections when one does not exist", () => {
    const r = cli(["get", "component.accordion#items.section.parameters.open"]);
    expect(r.code).toBe(1);
    expect(r.out).toContain("component.accordion#items.section.parameters.expanded");
  });

  it("maps each item's element and attributes in the web implementation", () => {
    const { out } = cli(["get", "component.accordion", "--impl", "web"], impls);
    expect(out).toContain("### Section element: `<ds-accordion-section>`");
    expect(out).toContain(
      "| `expanded` | attribute | parameter `expanded` | boolean | Whether the section's content is shown.",
    );
    const data = JSON.parse(
      cli(["get", "component.accordion", "--impl", "web", "--json"], impls).out,
    );
    expect(Object.keys(data.record.items)).toEqual(["section"]);
    expect(data.implementation.items.section.tagName).toBe("ds-accordion-section");
    expect(data.implementation.items.section.api.map((row) => row.parameter)).toEqual([
      "label",
      "label",
      "expanded",
      "expanded",
    ]);
  });

  it("gets an item value with its guidance, and links it both ways", () => {
    const value = cli(["get", "component.thing#items.entry.parameters.size.large"], tools);
    expect(value.code).toBe(0);
    expect(value.out).toContain("Example: Featured");
    expect(value.out).toContain("Guidance: [Guide](pattern.guide#second-step)");
    expect(cli(["links", "component.thing"], tools).out).toContain(
      "- items.entry.parameters.size.large → pattern.guide#second-step",
    );
    expect(cli(["links", "pattern.guide", "--direction", "in"], tools).out).toContain(
      "- component.thing#items.entry.parameters.size.large → pattern.guide#second-step",
    );
  });

  it("finds a record by its item parameters", () => {
    expect(cli(["search", "zephyr"], tools).out).toContain("- component.thing — Thing: ");
  });
});

describe("ds-spec CLI, parts", () => {
  it("prints a part's parameters as a table, in the record and as a section", () => {
    const { out } = cli(["get", "component.card"]);
    expect(out).toContain("## Parts\n\n### title\n\nOptions of the `title` part.");
    const part = cli(["get", "component.card#parts.title.parameters.headingLevel"]);
    expect(part.code).toBe(0);
    expect(part.out).toMatch(/^## parts\.title\.parameters\.headingLevel\n/);
  });

  it("suggests the sections a bare part name probably means", () => {
    const r = cli(["get", "component.dialog#title"]);
    expect(r.code).toBe(1);
    expect(r.out).toContain(
      'Unknown section "component.dialog#title". Did you mean component.dialog#anatomy.title, component.dialog#parts.title?',
    );
  });

  it("maps a part's attributes on the element in the web implementation", () => {
    const { out } = cli(["get", "component.card", "--impl", "web"], impls);
    expect(out).toContain("### Title part, on `<ds-card>`");
    expect(out).toContain("| `heading-level` | attribute | parameter `headingLevel` | number |");
  });
});

describe("ds-spec CLI, short records", () => {
  it("leaves the token table out of a whole component record", () => {
    for (const args of [
      ["get", "button"],
      ["get", "button", "--impl", "web"],
    ]) {
      const { out } = cli(args);
      expect(out).not.toContain("## Tokens");
      expect(out).not.toContain("semantic.color.background.action.primary.hover");
      expect(out).toContain("Tokens: 50 bindings, left out here.");
    }
  });

  it("still prints the tokens section and the tokens command", () => {
    expect(cli(["get", "button#tokens"]).out).toContain(
      "semantic.color.background.action.primary.hover",
    );
    expect(cli(["tokens", "button"]).out).toContain(
      "semantic.color.background.action.primary.hover",
    );
  });

  it("keeps the full record in JSON", () => {
    const data = JSON.parse(cli(["get", "button", "--json"]).out);
    expect(Object.keys(data.tokens)).toContain("control");
  });

  it("adds no tokens line to a record without tokens", () => {
    expect(cli(["get", "pattern.action-hierarchy"]).out).not.toContain("Tokens:");
  });
});

describe("ds-spec CLI, forgiving lookups", () => {
  it("matches the start of a name or title", () => {
    expect(cli(["search", "chec"]).out).toMatch(/^- component\.checkbox — /);
    expect(cli(["search", "textfi"]).out).toMatch(/^- component\.text-field — /);
    // Too short, or too little of the word, to count.
    expect(cli(["search", "che"]).out).toMatch(/^No results for "che"\. /);
    expect(cli(["search", "comp"]).out).not.toContain("component.button");
  });

  it("finds a record by name", () => {
    expect(cli(["get", "button"]).out).toMatch(/^# Button/);
    expect(cli(["get", "Text", "field"]).out).toMatch(/^# Text field/);
    expect(cli(["get", "textfield", "--impl", "web"], impls).out).toContain("`<ds-text-field>`");
    expect(cli(["get", "button#rules"]).out).toContain("## Rules");
    expect(cli(["tokens", "button", "--part", "control"]).code).toBe(0);
    expect(cli(["links", "link"]).out).toContain("component.button");
    expect(cli(["rules", "--id", "button#label-describes-result"]).out).toContain(
      "component.button#label-describes-result",
    );
  });

  it("suggests the record a typo meant", () => {
    const typo = cli(["get", "buton"]);
    expect(typo.code).toBe(1);
    expect(typo.out).toContain('Unknown record "buton". Did you mean: component.button?');
    expect(cli(["get", "hierarchy"]).out).toContain("pattern.action-hierarchy");
  });

  it("returns an error envelope in JSON", () => {
    const record = JSON.parse(cli(["get", "buton", "--json"]).out);
    expect(record).toEqual({
      error: 'Unknown record "buton". Did you mean: component.button?',
      code: "ERR_UNKNOWN_RECORD",
      suggestions: ["component.button"],
    });
    const section = JSON.parse(cli(["get", "component.button#rule", "--json"]).out);
    expect(section.code).toBe("ERR_UNKNOWN_SECTION");
    expect(section.suggestions).toContain("component.button#rules");
    const impl = JSON.parse(cli(["get", "button", "--impl", "ios", "--json"], impls).out);
    expect(impl).toMatchObject({
      code: "ERR_UNKNOWN_IMPLEMENTATION",
      suggestions: ["web", "react"],
    });
    const none = JSON.parse(
      cli(["get", "pattern.action-hierarchy", "--impl", "web", "--json"], impls).out,
    );
    expect(none.code).toBe("ERR_NO_IMPLEMENTATION");
  });

  it("searches through typos and names the next command", () => {
    const r = cli(["search", "chekbox"], impls);
    expect(r.out).toContain("- component.checkbox — Checkbox: ");
    expect(r.out).toContain("  → ds-spec get component.checkbox --impl <web | react>\n");
    // One edit is the allowance for a word this short, so two edits match nothing.
    expect(cli(["search", "buxxon"]).out).toMatch(/^No results for "buxxon"\. /);
    // Four letters get no typo allowance, and words in a longer query are not corrected.
    expect(cli(["search", "lnik"]).out).toMatch(/^No results for "lnik"\. /);
    expect(cli(["search", "buton", "zzzz"]).out).toMatch(/^No results for "buton zzzz"\. /);
    expect(cli(["search", "destructive", "action"], impls).out).toContain(
      "  → ds-spec get pattern.action-hierarchy\n",
    );
  });

  it("says when nothing fits, and marks weak hits", () => {
    const weak = cli(["search", "toast", "notification"]);
    expect(weak.code).toBe(0);
    expect(weak.out).toMatch(/^No strong match for "toast notification"\./);
    expect(weak.out).toContain("`ds-spec list`, or read guideline.compose-or-propose");
    expect(weak.out).toContain("(weak match)");
    const strong = cli(["search", "loading"]);
    expect(strong.out).toMatch(/^- component\.spinner — /);
    expect(strong.out.split("\n")[0]).not.toContain("(weak match)");
    const json = JSON.parse(cli(["search", "toast", "notification", "--json"]).out);
    expect(json.every((hit) => hit.weak)).toBe(true);
  });
});

describe("ds-spec CLI, batch", () => {
  const commands = [
    "get button --impl web",
    "tokens button --part control --condition 'variant.primary + hover' --resolve",
    "rules --id button --level must",
    "get buton",
  ];
  const batchArgs = commands.flatMap((command) => ["--command", command]);

  it("prints what each command prints alone, in order", () => {
    const batch = cli(["batch", ...batchArgs], impls);
    const alone = commands.map((command) => cli(splitWords(command), impls));
    expect(batch.out).toBe(
      commands.map((command, i) => `$ ds-spec ${command}\n${alone[i].out}`).join("\n"),
    );
    // The worst exit code wins: `get buton` finds nothing.
    expect(batch.code).toBe(1);
  });

  it("returns an array of each command's JSON", () => {
    const batch = JSON.parse(cli(["batch", "--json", ...batchArgs], impls).out);
    expect(batch.map((entry) => entry.command)).toEqual(commands);
    expect(batch.map((entry) => entry.exitCode)).toEqual([0, 0, 0, 1]);
    commands.forEach((command, i) => {
      expect(batch[i].result).toEqual(
        JSON.parse(cli([...splitWords(command), "--json"], impls).out),
      );
    });
  });

  it("keeps going after a failed command and exits with the worst code", () => {
    const r = cli([
      "batch",
      "--command",
      "list --type nope",
      "--command",
      "get button --json",
      "--command",
      "batch --command list",
      "--command",
      "get 'button",
      "--command",
      "list --type component",
    ]);
    expect(r.code).toBe(2);
    expect(r.out).toContain("$ ds-spec list --type component\n- component.accordion — ");
    expect(r.err).toContain("$ ds-spec list --type nope\n--type must be one of:");
    expect(r.err).toContain("Put --json on batch, not on its commands.");
    expect(r.err).toContain("A batch cannot run batch.");
    expect(r.err).toContain(`Cannot read "get 'button": unclosed single quote.`);
  });

  it("passes the batch's global flags to every command", () => {
    const r = cli(["batch", "--content", path.join(tools, "content"), "--command", "list"]);
    expect(r.out).toContain("component.thing");
    expect(r.out).not.toContain("component.button");
  });

  it("needs a command", () => {
    expect(cli(["batch"]).code).toBe(2);
    expect(cli(["batch", "get", "button"]).err).toContain(
      "batch takes its commands with --command.",
    );
  });
});

describe("splitWords", () => {
  it("splits like a shell, without expansion", () => {
    expect(splitWords("  get  button --impl web ")).toEqual(["get", "button", "--impl", "web"]);
    expect(splitWords(`tokens button --condition "variant.primary + hover"`)).toEqual([
      "tokens",
      "button",
      "--condition",
      "variant.primary + hover",
    ]);
    expect(splitWords(`search 'it''s' a\\ b "say \\"hi\\"" $HOME *`)).toEqual([
      "search",
      "its",
      "a b",
      'say "hi"',
      "$HOME",
      "*",
    ]);
    expect(splitWords(`get ""`)).toEqual(["get", ""]);
    expect(splitWords("")).toEqual([]);
  });

  it("rejects an unclosed quote or a trailing backslash", () => {
    expect(() => splitWords(`get "button`)).toThrow("unclosed double quote");
    expect(() => splitWords("get 'button")).toThrow("unclosed single quote");
    expect(() => splitWords("get button\\")).toThrow("trailing backslash");
  });
});

describe("ds-spec CLI, agent friction", () => {
  it("heads a section read with its path", () => {
    const r = cli(["get", "component.card#parts.title.parameters.headingLevel"]);
    expect(r.code).toBe(0);
    expect(r.out.startsWith("## parts.title.parameters.headingLevel\n")).toBe(true);
  });

  it("fails a missing implementation without printing the contract", () => {
    const r = cli(["get", "card", "--impl", "react"], impls);
    expect(r.code).toBe(1);
    expect(r.out).toBe("No react implementation for component.card.\n");
  });

  it("lists the components an implementation has", () => {
    const r = cli(["list", "--impl", "web"], impls);
    expect(r.code).toBe(0);
    expect(r.out).toContain("- component.button — Button: ");
    expect(r.out).not.toContain("pattern.");
    const react = cli(["list", "--impl", "react"], impls).out;
    expect(react).toContain("- component.button — Button: ");
    expect(react).not.toContain("component.card ");
    const unknown = cli(["list", "--impl", "ios"], impls);
    expect(unknown.code).toBe(1);
    expect(unknown.out).toContain('No implementation named "ios". Configured: web, react.');
  });

  it("says the base tokens still apply under a condition", () => {
    const note =
      "Only the bindings for this condition are shown. The `base` bindings still apply where these do not override them.";
    expect(cli(["tokens", "card", "--condition", "hover"]).out).toContain(note);
    expect(cli(["tokens", "card", "--condition", "base"]).out).not.toContain(note);
    expect(cli(["tokens", "card"]).out).not.toContain(note);
  });

  it("tells a batch command to quote a value of several words", () => {
    const r = cli(["batch", "--command", "rules --query dismiss label"]);
    expect(r.code).toBe(2);
    expect(r.err).toContain(
      "rules takes no positional arguments. Quote a value of several words, such as --query 'dismiss label'.",
    );
    expect(cli(["batch", "--command", "rules --query 'dismiss label'"]).code).toBe(0);
  });
});
