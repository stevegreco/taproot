import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { AGENT_INSTRUCTIONS } from "../src/agents.js";
import { run } from "../src/cli.js";
import { splitWords } from "../src/util.js";
import { fixture } from "./helpers.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const binPath = path.resolve(here, "../bin/taproot.js");
const repoRoot = path.resolve(here, "../../..");
const tools = fixture("tools");
// Implementations come from a fixture config, so adding one to the repository changes no output.
const impls = fixture("implementations");

/** Run the CLI in this process, which saves starting Node for each call. */
async function cli(args, cwd = repoRoot) {
  let out = "";
  let err = "";
  const code = await run(args, {
    cwd,
    stdout: (text) => (out += text),
    stderr: (text) => (err += text),
  });
  return { code, out, err };
}

/** Run the installed binary in a new process, as a shell does. */
function bin(args, cwd = repoRoot) {
  const result = spawnSync(process.execPath, [binPath, ...args], { cwd, encoding: "utf8" });
  return { code: result.status, out: result.stdout, err: result.stderr };
}

describe("taproot CLI, real content", () => {
  it("validates", async () => {
    const r = await cli(["validate"]);
    expect(r.code).toBe(0);
    expect(r.out).toMatch(/^OK: \d+ records, no issues\./);
  });

  it("lists with filters", async () => {
    const r = await cli(["list", "--type", "component"]);
    expect(r.code).toBe(0);
    expect(r.out).toContain("- component.button — Button: ");
    expect(r.out).not.toContain("pattern.action-hierarchy");
  });

  it("searches", async () => {
    const r = await cli(["search", "destructive", "action"]);
    expect(r.code).toBe(0);
    expect(r.out).toContain("- pattern.action-hierarchy — Action hierarchy: ");
  });

  it("gets a record and a section", async () => {
    expect((await cli(["get", "component.button"])).out).toMatch(/^# Button/);
    const section = await cli(["get", "pattern.action-hierarchy#assign-emphasis"]);
    expect(section.code).toBe(0);
    expect(section.out).toContain("## Assign emphasis");
  });

  it("gets an example with every annotation and its references", async () => {
    const { out } = await cli(["get", "example.action-hierarchy.settings"]);
    for (const id of ["profile-actions", "danger-zone", "outcome-labels"]) {
      expect(out).toContain(`\`example.action-hierarchy.settings#${id}\``);
    }
    expect(out).toContain("(pattern.action-hierarchy#separate-unrelated-decisions)");
    expect(out).toContain("(component.button#label-describes-result)");
  });

  it("shows links grouped by kind", async () => {
    const r = await cli(["links", "component.link", "--kind", "alternative"]);
    expect(r.code).toBe(0);
    expect(r.out).toContain("## alternative");
    expect(r.out).toContain("- component.button: ");
  });

  it("shows incoming links with both ends, apart from outgoing ones", async () => {
    const r = await cli(["links", "component.badge", "--direction", "in", "--kind", "alternative"]);
    expect(r.code).toBe(0);
    expect(r.out).toContain("## alternative (incoming)");
    expect(r.out).toContain("- component.button → component.badge: ");
  });

  it("lists rules as addresses", async () => {
    const r = await cli(["rules", "--level", "must", "--topic", "accessibility"]);
    expect(r.code).toBe(0);
    expect(r.out).toMatch(/^- \*\*MUST\*\* component\.\w[\w-]*#[\w-]+: /m);
    expect(r.out).not.toContain("**SHOULD**");
  });

  it("keeps a conditional rule's condition, and says how to read a rule in full", async () => {
    const r = await cli(["rules", "--id", "component.checkbox#form-value"]);
    expect(r.code).toBe(0);
    expect(r.out).toContain(
      "- **SHOULD** component.checkbox#form-value (extends pattern.form-field#form-value): ",
    );
    // A rule that extends another keeps the condition it inherits.
    expect(r.out).toContain("\n  - Applies when: The control belongs to a form.");
    const all = await cli(["rules", "--id", "checkbox"]);
    expect(all.out).toMatch(
      /Run `taproot get <address>`, such as `taproot get (?:component\.checkbox|pattern\.form-field)#[\w-]+`/,
    );
  });

  it("gets a parameter value with its example and guidance", async () => {
    const r = await cli(["get", "component.button#parameters.variant.destructive"]);
    expect(r.code).toBe(0);
    expect(r.out).toContain("Destructive or difficult-to-reverse action.");
    expect(r.out).toContain("Example: Delete project");
    expect(r.out).toContain("Guidance: [Action hierarchy](pattern.action-hierarchy#destructive)");
  });

  it("resolves tokens for light and dark", async () => {
    const r = await cli([
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

  it("omits values without --resolve", async () => {
    const r = await cli(["tokens", "component.button", "--part", "control"]);
    expect(r.out).toContain("| Part | Condition | Property | Token |");
    expect(r.out).not.toContain("light");
  });

  it("prints the agent instructions, and AGENTS.md carries the same text", async () => {
    const r = await cli(["help", "agents"]);
    expect(r.code).toBe(0);
    expect(r.out).toBe(`${AGENT_INSTRUCTIONS}\n`);
    const agents = fs.readFileSync(path.join(repoRoot, "AGENTS.md"), "utf8");
    const copy = agents.match(
      /<!-- agent-instructions:start -->\n([\s\S]*?)\n<!-- agent-instructions:end -->/,
    );
    expect(copy?.[1], "AGENTS.md copy of `taproot help agents`").toBe(AGENT_INSTRUCTIONS);
  });

  it("prints help", async () => {
    const r = await cli(["help", "tokens"]);
    expect(r.code).toBe(0);
    expect(r.out).toContain("taproot tokens <id>");
  });
});

describe("taproot CLI, --json", () => {
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
  ])("%j parses", async (args, check) => {
    const r = await cli([...args, "--json"]);
    expect(r.code).toBe(0);
    check(JSON.parse(r.out));
  });
});

describe("taproot CLI, failures", () => {
  it("exits 2 on usage errors", async () => {
    expect((await cli([])).code).toBe(0);
    expect((await cli(["bogus"])).code).toBe(2);
    expect((await cli(["get"])).code).toBe(2);
    expect((await cli(["search"])).code).toBe(2);
    expect((await cli(["list", "--nope"])).code).toBe(2);
    expect((await cli(["search", "x", "--limit", "abc"])).code).toBe(2);
    expect((await cli(["links", "component.button", "--direction", "up"])).code).toBe(2);
    expect((await cli(["help", "bogus"])).code).toBe(2);
    expect((await cli(["get"])).err).toContain("get needs an id");
    expect((await cli(["list", "extra"])).err).toContain("takes no positional arguments");
  });

  it("exits 1 for unknown ids and sections", async () => {
    const record = await cli(["get", "component.nope"]);
    expect(record.code).toBe(1);
    expect(record.out).toContain('Unknown record "component.nope"');
    expect((await cli(["get", "component.button#nope"])).code).toBe(1);
    expect((await cli(["links", "component.nope"])).code).toBe(1);
    expect((await cli(["tokens", "component.nope"])).code).toBe(1);
  });

  it("exits 1 and lists issues for invalid content", async () => {
    const content = fixture("unknown-field");
    const v = await cli(["validate", "--content", content]);
    expect(v.code).toBe(1);
    expect(v.out).toMatch(/\.yaml:\d+ \S+ .+\n\d+ issues? in/);
    const g = await cli(["get", "component.thing", "--content", content]);
    expect(g.code).toBe(1);
    expect(g.err).toContain("Warning: left out 1 record file with issues: thing.spec.yaml.");
  });

  it("serves the valid records when one is invalid", async () => {
    const content = fixture("link-to-invalid");
    const r = await cli(["get", "pattern.guide", "--content", fixture("unknown-section")]);
    expect(r.code).toBe(0);
    expect(r.err).toContain("left out 1 record file with issues: thing.spec.yaml");
    // Thing links to Broken but has no issue of its own, so only Broken is left out.
    expect((await cli(["list", "--content", content])).err).toContain(
      "left out 1 record file with issues: broken.md.",
    );
  });

  it("exits 1 on empty results", async () => {
    expect((await cli(["list", "--tag", "nope"])).code).toBe(1);
    expect((await cli(["rules", "--id", "component.button", "--query", "zzzz"])).code).toBe(1);
    expect((await cli(["links", "component.thing", "--kind", "examples"], tools)).code).toBe(1);
    expect((await cli(["tokens", "button", "--part", "nope"])).code).toBe(1);
    expect((await cli(["search", "zzzz"])).code).toBe(1);
  });

  it("rejects unknown filter values with the valid ones", async () => {
    for (const [args, valid] of [
      [["list", "--type", "bogus"], "component, pattern, guideline, example"],
      [["list", "--status", "old"], "draft, stable, deprecated"],
      [["rules", "--topic", "a11y"], "content, behavior, accessibility"],
      [["rules", "--level", "must-not"], "must, should, may"],
      [["links", "button", "--kind", "bogus"], "alternative, alternative-to, composes"],
    ]) {
      const r = await cli(args);
      expect(r.code).toBe(2);
      expect(r.err).toContain(valid);
    }
  });

  it("exits 2 for a bad config", async () => {
    const r = await cli(["list", "--config", path.join(tools, "bad.config.json")]);
    expect(r.code).toBe(2);
    expect(r.err).toContain("Invalid config");
  });
});

// The other tests call the CLI in this process. These start the binary, as a shell does.
describe("taproot CLI, binary", () => {
  // A loose limit that catches a large regression, such as loading a dependency per call, without
  // failing on a slow machine. The best of three runs ignores a call slowed by parallel tests.
  // `pnpm bench` measures against the real target.
  it("gets a record in under a second", () => {
    const times = Array.from({ length: 3 }, () => {
      const started = performance.now();
      const r = bin(["get", "button"]);
      expect(r.code).toBe(0);
      expect(r.out).toContain("component.button");
      return performance.now() - started;
    });
    expect(Math.min(...times)).toBeLessThan(1000);
  });

  it("exits 2 with a usage error on stderr", () => {
    const r = bin(["nope"]);
    expect(r.code).toBe(2);
    expect(r.out).toBe("");
    expect(r.err).toContain('Unknown command "nope"');
  });
});

describe("taproot CLI, fixture config", () => {
  it("finds the config from the working directory", async () => {
    const r = await cli(["list"], tools);
    expect(r.out).toContain("component.thing");
    expect(r.out).not.toContain("component.button");
  });

  it("--content overrides the config", async () => {
    const r = await cli(["list", "--content", path.join(tools, "content")], repoRoot);
    expect(r.out).toContain("component.thing");
  });

  it("resolves fixture tokens", async () => {
    const r = await cli(
      ["tokens", "component.thing", "--condition", "tone.loud + hover", "--resolve"],
      tools,
    );
    expect(r.out).toContain("`#0000ff`");
    expect(r.out).toContain("`#ffff00`");
  });
});

describe("taproot CLI, implementations", () => {
  it("gets a component with its web implementation", async () => {
    const r = await cli(["get", "component.button", "--impl", "web"], impls);
    expect(r.code).toBe(0);
    expect(r.out).toMatch(/^# Button/);
    expect(r.out).toContain("## Web implementation");
    expect(r.out).toContain("- Element: `<ds-button>`");
    expect(r.out).toContain('import { defineButton } from "@taproot-ds/web-components/button";');
    expect(r.out).toContain(
      "| `type` | attribute | parameter `action` | `activate` → `button`, `submit`, `reset` |",
    );
    expect(r.out).toContain("| `aria-label` | attribute | parameter `accessibleName` |");
    // The implementation's own guidance follows, one heading level down.
    expect(r.out).toContain("### Forms");
  });

  it("points a plain get at the implementation", async () => {
    const { out } = await cli(["get", "component.button"], impls);
    expect(out).not.toContain("## Web implementation");
    expect(out.trimEnd().split("\n").slice(-2)).toEqual([
      "Implementations: web, react. Run `taproot get component.button --impl <web | react>` for the package, import, and API names.",
      "Tokens: 50 bindings, left out here. Run `taproot tokens component.button` to filter them by part, condition, or property.",
    ]);
    expect((await cli(["get", "pattern.action-hierarchy"], impls)).out).not.toContain(
      "Implementations:",
    );
  });

  it("returns the record and implementation as JSON", async () => {
    const data = JSON.parse(
      (await cli(["get", "component.link", "--impl", "web", "--json"], impls)).out,
    );
    expect(data.record.id).toBe("component.link");
    expect(data.implementation.tagName).toBe("ds-link");
  });

  it("explains a missing or unknown implementation", async () => {
    const pattern = await cli(["get", "pattern.action-hierarchy", "--impl", "web"], impls);
    expect(pattern.code).toBe(1);
    expect(pattern.out).toContain("No web implementation for pattern.action-hierarchy.");
    const unknown = await cli(["get", "component.button", "--impl", "ios"], impls);
    expect(unknown.code).toBe(1);
    expect(unknown.out).toContain('No implementation named "ios". Configured: web, react.');
    const section = await cli(["get", "component.button#rules", "--impl", "web"], impls);
    expect(section.code).toBe(2);
    expect(section.err).toContain("not a section");
  });

  it("rejects an implementation that does not match its record", async () => {
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
    const r = await cli(["get", "button", "--impl", "web", "--json"], tmp);
    expect(r.code).toBe(1);
    const error = JSON.parse(r.out);
    expect(error.code).toBe("ERR_INVALID_IMPLEMENTATION");
    expect(error.error).toContain('implements the parameter "actoin"');
    fs.rmSync(tmp, { recursive: true });
  });

  it("explains that no implementations are configured", async () => {
    const r = await cli(["get", "component.thing", "--impl", "web"], tools);
    expect(r.code).toBe(1);
    expect(r.out).toContain("No implementations are configured.");
  });

  it("prints the setup every component of an implementation shares", async () => {
    const r = await cli(["setup", "--impl", "web"], impls);
    expect(r.code).toBe(0);
    expect(r.out).toMatch(/^# Web components setup/);
    expect(r.out).toContain('import "@taproot-ds/tokens/css";');
    const data = JSON.parse((await cli(["setup", "--impl", "react", "--json"], impls)).out);
    expect(data).toMatchObject({ implementation: "react", technology: "react" });
    expect(data.setup).toMatch(/^# React components setup/);
  });

  it("points get --impl at the setup once, instead of repeating it", async () => {
    const { out } = await cli(["get", "component.divider", "--impl", "web"], impls);
    expect(out.trimEnd().split("\n").at(-1)).toBe(
      "Setup: install, styles, and fonts are the same for every component. Run `taproot setup --impl web` once per project.",
    );
    expect(out).not.toContain('import "@taproot-ds/tokens/css";');
  });

  it("explains a setup call it cannot answer", async () => {
    const none = await cli(["setup"], impls);
    expect(none.code).toBe(2);
    expect(none.err).toContain("setup needs an implementation. Configured: web, react.");
    expect((await cli(["setup", "--impl", "ios"], impls)).out).toContain(
      'No implementation named "ios".',
    );
    const config = ["--config", path.join(impls, "missing-folder.config.json")];
    const missing = await cli(["setup", "--impl", "react", "--json", ...config]);
    expect(missing.code).toBe(1);
    expect(JSON.parse(missing.out).code).toBe("ERR_NO_SETUP");
    // Without a setup file, get --impl has no setup line.
    expect(
      (await cli(["get", "component.button", "--impl", "react", ...config])).out,
    ).not.toContain("Setup:");
  });

  it("reads a missing implementation folder as nothing implemented", async () => {
    const config = ["--config", path.join(impls, "missing-folder.config.json")];
    const r = await cli(["get", "component.button", "--impl", "react", ...config]);
    expect(r.code).toBe(1);
    expect(r.err).toBe("");
    expect(r.out).toContain("No react implementation for component.button.");
    // The folder that exists still counts, and the missing one is not offered.
    expect((await cli(["get", "component.button", ...config])).out).toContain(
      "Implementations: web. Run `taproot get component.button --impl web` for",
    );
    expect((await cli(["search", "chekbox", ...config])).out).toContain(
      "  → taproot get component.checkbox --impl web\n",
    );
  });
});

describe("taproot CLI, format reference", () => {
  it("prints the token properties, keywords, roles, and constants", async () => {
    const r = await cli(["format"]);
    expect(r.code).toBe(0);
    expect(r.out).toMatch(/^# Spec format\n\nFormat version 1\./);
    expect(r.out).toContain("`border-width`, `radius`");
    expect(r.out).toContain("`inherit` (the value comes from the surrounding content)");
    expect(r.out).toContain("`interactive-surface`, `label`");
    expect(r.out).toContain("| focus-ring-width | `semantic.focus.width` |");
    expect(r.out).toContain("Run `taproot format --resolve` for values.");
  });

  it("resolves each constant in each token set", async () => {
    const r = await cli(["format", "--resolve"]);
    expect(r.out).toContain("| Constant | Token | light | dark |");
    expect(r.out).toContain("| border-width | `semantic.border.width` | `1px` | `1px` |");
    const data = JSON.parse((await cli(["format", "--resolve", "--json"])).out);
    expect(data.constants.map((row) => row.name)).toEqual([
      "border-width",
      "focus-ring-width",
      "focus-ring-offset",
    ]);
    expect(data.constants[0].values).toEqual({ light: "1px", dark: "1px" });
    expect(data.properties).toContain("track");
  });

  it("says when no constants are configured", async () => {
    const r = await cli(["format"], tools);
    expect(r.code).toBe(0);
    expect(r.out).toContain("None are configured. Add `constants` to spec.config.json.");
    expect((await cli(["format", "extra"])).code).toBe(2);
  });

  it("fails validation for a constant that names no token", async () => {
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
    const r = await cli(["validate"], tmp);
    expect(r.code).toBe(1);
    expect(r.out).toContain(
      "spec.config.json /constants/border-width `semantic.nope` is not a token",
    );
    fs.rmSync(tmp, { recursive: true });
  });
});

describe("taproot CLI, items", () => {
  it("prints each item's parameters as a table, in the record and as a section", async () => {
    const { out } = await cli(["get", "component.accordion"]);
    expect(out).toContain("## Items\n\n### section\n\nOptions of each `section`.");
    expect(out).toContain("| expanded | boolean |  | `false` |");
    const item = await cli(["get", "component.accordion#items.section"]);
    expect(item.code).toBe(0);
    expect(item.out).toMatch(/^## section\n\nOptions of each `section`\./);
    expect(item.out).toContain("| label | string |");
    const parameters = await cli(["get", "component.accordion#items.section.parameters"]);
    expect(parameters.out).toMatch(/^## Parameters\n\n\| Name \| Kind/);
    const one = await cli(["get", "component.accordion#items.section.parameters.expanded"]);
    expect(one.out).toMatch(/^## items.section.parameters.expanded\n/);
    expect(one.out).toContain("default: false");
  });

  it("prints an item's events as a list, not YAML", async () => {
    const { code, out } = await cli(["get", "component.thing#items.entry.events"], tools);
    expect(code).toBe(0);
    expect(out).toMatch(/^## Events\n\n- `pick`: The entry was picked\./);
  });

  it("names the item sections when one does not exist", async () => {
    const r = await cli(["get", "component.accordion#items.section.parameters.open"]);
    expect(r.code).toBe(1);
    expect(r.out).toContain("component.accordion#items.section.parameters.expanded");
  });

  it("reads an item's parameter by its short path", async () => {
    const r = await cli(["get", "component.accordion#items.section.expanded"]);
    expect(r.code).toBe(0);
    expect(r.out).toMatch(/^## items\.section\.parameters\.expanded\n/);
  });

  it("maps each item's element and attributes in the web implementation", async () => {
    const { out } = await cli(["get", "component.accordion", "--impl", "web"], impls);
    expect(out).toContain("### Section element: `<ds-accordion-section>`");
    expect(out).toContain(
      "| `expanded` | attribute | section parameter `expanded` | boolean | Whether the section's content is shown.",
    );
    const data = JSON.parse(
      (await cli(["get", "component.accordion", "--impl", "web", "--json"], impls)).out,
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

  it("gets an item value with its guidance, and links it both ways", async () => {
    const value = await cli(["get", "component.thing#items.entry.parameters.size.large"], tools);
    expect(value.code).toBe(0);
    expect(value.out).toContain("Example: Featured");
    expect(value.out).toContain("Guidance: [Guide](pattern.guide#second-step)");
    expect((await cli(["links", "component.thing"], tools)).out).toContain(
      "- items.entry.parameters.size.large → pattern.guide#second-step",
    );
    expect((await cli(["links", "pattern.guide", "--direction", "in"], tools)).out).toContain(
      "- component.thing#items.entry.parameters.size.large → pattern.guide#second-step",
    );
  });

  it("finds a record by its item parameters", async () => {
    expect((await cli(["search", "zephyr"], tools)).out).toContain("- component.thing — Thing: ");
  });
});

describe("taproot CLI, parts", () => {
  it("prints a part's parameters as a table, in the record and as a section", async () => {
    const { out } = await cli(["get", "component.card"]);
    expect(out).toContain("## Parts\n\n### title\n\nOptions of the `title` part.");
    const part = await cli(["get", "component.card#parts.title.parameters.headingLevel"]);
    expect(part.code).toBe(0);
    expect(part.out).toMatch(/^## parts\.title\.parameters\.headingLevel\n/);
  });

  it("suggests the sections a bare part name probably means", async () => {
    const r = await cli(["get", "component.dialog#title"]);
    expect(r.code).toBe(1);
    expect(r.out).toContain(
      'Unknown section "component.dialog#title". Did you mean component.dialog#anatomy.title, component.dialog#parts.title?',
    );
  });

  it("maps a part's attributes on the element in the web implementation", async () => {
    const { out } = await cli(["get", "component.card", "--impl", "web"], impls);
    expect(out).toContain("### Title part, on `<ds-card>`");
    expect(out).toContain(
      "| `heading-level` | attribute | title parameter `headingLevel` | number |",
    );
  });
});

describe("taproot CLI, short records", () => {
  it("leaves the token table out of a whole component record", async () => {
    for (const args of [
      ["get", "button"],
      ["get", "button", "--impl", "web"],
    ]) {
      const { out } = await cli(args);
      expect(out).not.toContain("## Tokens");
      expect(out).not.toContain("semantic.color.background.action.primary.hover");
      expect(out).toContain("Tokens: 50 bindings, left out here.");
    }
  });

  it("still prints the tokens section and the tokens command", async () => {
    expect((await cli(["get", "button#tokens"])).out).toContain(
      "semantic.color.background.action.primary.hover",
    );
    expect((await cli(["tokens", "button"])).out).toContain(
      "semantic.color.background.action.primary.hover",
    );
  });

  it("keeps the full record in JSON", async () => {
    const data = JSON.parse((await cli(["get", "button", "--json"])).out);
    expect(Object.keys(data.tokens)).toContain("control");
  });

  it("adds no tokens line to a record without tokens", async () => {
    expect((await cli(["get", "pattern.action-hierarchy"])).out).not.toContain("Tokens:");
  });
});

describe("taproot CLI, forgiving lookups", () => {
  it("matches the start of a name or title", async () => {
    expect((await cli(["search", "chec"])).out).toMatch(/^- component\.checkbox — /);
    expect((await cli(["search", "textfi"])).out).toMatch(/^- component\.text-field — /);
    // Too short, or too little of the word, to count.
    expect((await cli(["search", "che"])).out).toMatch(/^No results for "che"\. /);
    expect((await cli(["search", "comp"])).out).not.toContain("component.button");
  });

  it("finds a record by name", async () => {
    expect((await cli(["get", "button"])).out).toMatch(/^# Button/);
    expect((await cli(["get", "Text", "field"])).out).toMatch(/^# Text field/);
    expect((await cli(["get", "textfield", "--impl", "web"], impls)).out).toContain(
      "`<ds-text-field>`",
    );
    expect((await cli(["get", "button#rules"])).out).toContain("## Rules");
    expect((await cli(["tokens", "button", "--part", "control"])).code).toBe(0);
    expect((await cli(["links", "link"])).out).toContain("component.button");
    expect((await cli(["rules", "--id", "button#label-describes-result"])).out).toContain(
      "component.button#label-describes-result",
    );
  });

  it("suggests the record a typo meant", async () => {
    const typo = await cli(["get", "buton"]);
    expect(typo.code).toBe(1);
    expect(typo.out).toContain('Unknown record "buton". Did you mean: component.button?');
    expect((await cli(["get", "hierarchy"])).out).toContain("pattern.action-hierarchy");
  });

  it("returns an error envelope in JSON", async () => {
    const record = JSON.parse((await cli(["get", "buton", "--json"])).out);
    expect(record).toEqual({
      error: 'Unknown record "buton". Did you mean: component.button?',
      code: "ERR_UNKNOWN_RECORD",
      suggestions: ["component.button"],
    });
    const section = JSON.parse((await cli(["get", "component.button#rule", "--json"])).out);
    expect(section.code).toBe("ERR_UNKNOWN_SECTION");
    expect(section.suggestions).toContain("component.button#rules");
    const impl = JSON.parse((await cli(["get", "button", "--impl", "ios", "--json"], impls)).out);
    expect(impl).toMatchObject({
      code: "ERR_UNKNOWN_IMPLEMENTATION",
      suggestions: ["web", "react"],
    });
    const none = JSON.parse(
      (await cli(["get", "pattern.action-hierarchy", "--impl", "web", "--json"], impls)).out,
    );
    expect(none.code).toBe("ERR_NO_IMPLEMENTATION");
  });

  it("searches through typos and names the next command", async () => {
    const r = await cli(["search", "chekbox"], impls);
    expect(r.out).toContain("- component.checkbox — Checkbox: ");
    expect(r.out).toContain("  → taproot get component.checkbox --impl <web | react>\n");
    // One edit is the allowance for a word this short, so two edits match nothing.
    expect((await cli(["search", "buxxon"])).out).toMatch(/^No results for "buxxon"\. /);
    // Four letters get no typo allowance, and words in a longer query are not corrected.
    expect((await cli(["search", "lnik"])).out).toMatch(/^No results for "lnik"\. /);
    expect((await cli(["search", "buton", "zzzz"])).out).toMatch(/^No results for "buton zzzz"\. /);
    expect((await cli(["search", "destructive", "action"], impls)).out).toContain(
      "  → taproot get pattern.action-hierarchy\n",
    );
  });

  it("says when nothing fits, and marks weak hits", async () => {
    const weak = await cli(["search", "toast", "notification"]);
    expect(weak.code).toBe(0);
    expect(weak.out).toMatch(/^No strong match for "toast notification"\./);
    expect(weak.out).toContain("`taproot list`, or read guideline.compose-or-propose");
    expect(weak.out).toContain("(weak match)");
    const strong = await cli(["search", "loading"]);
    expect(strong.out).toMatch(/^- component\.spinner — /);
    expect(strong.out.split("\n")[0]).not.toContain("(weak match)");
    const json = JSON.parse((await cli(["search", "toast", "notification", "--json"])).out);
    expect(json.every((hit) => hit.weak)).toBe(true);
  });
});

describe("taproot CLI, batch", () => {
  const commands = [
    "get button --impl web",
    "tokens button --part control --condition 'variant.primary + hover' --resolve",
    "rules --id button --level must",
    "get buton",
  ];
  const batchArgs = commands.flatMap((command) => ["--command", command]);

  it("prints what each command prints alone, in order", async () => {
    const batch = await cli(["batch", ...batchArgs], impls);
    const alone = [];
    for (const command of commands) alone.push(await cli(splitWords(command), impls));
    expect(batch.out).toBe(
      commands.map((command, i) => `$ taproot ${command}\n${alone[i].out}`).join("\n"),
    );
    // The worst exit code wins: `get buton` finds nothing.
    expect(batch.code).toBe(1);
  });

  it("returns an array of each command's JSON", async () => {
    const batch = JSON.parse((await cli(["batch", "--json", ...batchArgs], impls)).out);
    expect(batch.map((entry) => entry.command)).toEqual(commands);
    expect(batch.map((entry) => entry.exitCode)).toEqual([0, 0, 0, 1]);
    for (const [i, command] of commands.entries()) {
      expect(batch[i].result).toEqual(
        JSON.parse((await cli([...splitWords(command), "--json"], impls)).out),
      );
    }
  });

  it("keeps going after a failed command and exits with the worst code", async () => {
    const r = await cli([
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
    expect(r.out).toContain("$ taproot list --type component\n- component.accordion — ");
    expect(r.err).toContain("$ taproot list --type nope\n--type must be one of:");
    expect(r.err).toContain("Put --json on batch, not on its commands.");
    expect(r.err).toContain("A batch cannot run batch.");
    expect(r.err).toContain(`Cannot read "get 'button": unclosed single quote.`);
  });

  it("passes the batch's global flags to every command", async () => {
    const r = await cli(["batch", "--content", path.join(tools, "content"), "--command", "list"]);
    expect(r.out).toContain("component.thing");
    expect(r.out).not.toContain("component.button");
  });

  it("needs a command", async () => {
    expect((await cli(["batch"])).code).toBe(2);
    expect((await cli(["batch", "get", "button"])).err).toContain(
      "batch takes its commands with --command.",
    );
  });
});

describe("splitWords", () => {
  it("splits like a shell, without expansion", async () => {
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

  it("rejects an unclosed quote or a trailing backslash", async () => {
    expect(() => splitWords(`get "button`)).toThrow("unclosed double quote");
    expect(() => splitWords("get 'button")).toThrow("unclosed single quote");
    expect(() => splitWords("get button\\")).toThrow("trailing backslash");
  });
});

describe("taproot CLI, agent friction", () => {
  it("heads a section read with its path", async () => {
    const r = await cli(["get", "component.card#parts.title.parameters.headingLevel"]);
    expect(r.code).toBe(0);
    expect(r.out.startsWith("## parts.title.parameters.headingLevel\n")).toBe(true);
  });

  it("fails a missing implementation without printing the contract", async () => {
    const r = await cli(["get", "card", "--impl", "react"], impls);
    expect(r.code).toBe(1);
    expect(r.out).toBe("No react implementation for component.card.\n");
  });

  it("lists the components an implementation has", async () => {
    const r = await cli(["list", "--impl", "web"], impls);
    expect(r.code).toBe(0);
    expect(r.out).toContain("- component.button — Button: ");
    expect(r.out).not.toContain("pattern.");
    const react = (await cli(["list", "--impl", "react"], impls)).out;
    expect(react).toContain("- component.button — Button: ");
    expect(react).not.toContain("component.card ");
    const unknown = await cli(["list", "--impl", "ios"], impls);
    expect(unknown.code).toBe(1);
    expect(unknown.out).toContain('No implementation named "ios". Configured: web, react.');
  });

  it("says the base tokens still apply under a condition", async () => {
    const note =
      "Only the bindings for this condition are shown. The `base` bindings still apply where these do not override them.";
    expect((await cli(["tokens", "card", "--condition", "hover"])).out).toContain(note);
    expect((await cli(["tokens", "card", "--condition", "base"])).out).not.toContain(note);
    expect((await cli(["tokens", "card"])).out).not.toContain(note);
  });

  it("takes the rules id as an argument or with --id, the same either way", async () => {
    for (const [plain, flag] of [
      [
        ["rules", "checkbox"],
        ["rules", "--id", "checkbox"],
      ],
      [
        ["rules", "text", "field"],
        ["rules", "--id", "text field"],
      ],
      [
        ["rules", "button#label-describes-result"],
        ["rules", "--id", "button#label-describes-result"],
      ],
    ]) {
      const a = await cli(plain);
      expect(a.code).toBe(0);
      expect(a.out).toBe((await cli(flag)).out);
    }
    expect((await cli(["rules", "nope"])).code).toBe(1);
    const both = await cli(["rules", "button", "--id", "button"]);
    expect(both.code).toBe(2);
    expect(both.err).toContain("rules takes its id once");
  });

  it("tells a batch command to quote a value of several words", async () => {
    const r = await cli(["batch", "--command", "rules --query dismiss label"]);
    expect(r.code).toBe(2);
    expect(r.err).toContain(
      "\"label\" is not a record. Quote a value of several words, such as --query 'dismiss label'.",
    );
    expect((await cli(["batch", "--command", "rules --query 'dismiss label'"])).code).toBe(0);
  });
});
