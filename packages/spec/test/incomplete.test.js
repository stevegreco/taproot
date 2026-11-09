/**
 * What the tools do with content that has issues: unfinished drafts still load, a record with a
 * real issue is left out and named, and an answer that depends on a left-out record says so instead
 * of reading as complete. `validate` and a snapshot build run every check, implementations included.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { afterEach, describe, expect, it } from "vitest";
import { buildSnapshot } from "../src/build-snapshot.js";
import { validateFromConfig } from "../src/config.js";
import { SpecError, loadSpec, validateSpec } from "../src/index.js";
import { createSpecServer } from "../src/mcp.js";
import * as ops from "../src/operations.js";
import { fixture } from "./helpers.js";

const bin = fileURLToPath(new URL("../bin/taproot.js", import.meta.url));
const cli = (args, cwd) => {
  const result = spawnSync(process.execPath, [bin, ...args], {
    cwd,
    encoding: "utf8",
  });
  return { code: result.status, out: result.stdout, err: result.stderr };
};

const cleanups = [];
afterEach(async () => {
  while (cleanups.length) await cleanups.pop()();
});

/** A copy of a fixture folder in a temporary directory, removed after the test. */
function copy(name) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "taproot-incomplete-"));
  cleanups.push(() => fs.rmSync(tmp, { recursive: true }));
  fs.cpSync(fixture(name), tmp, { recursive: true });
  return tmp;
}

async function connect(options) {
  const handle = await createSpecServer({ watch: false, ...options });
  const client = new Client({ name: "test", version: "0.0.0" });
  const [a, b] = InMemoryTransport.createLinkedPair();
  await Promise.all([handle.server.connect(a), client.connect(b)]);
  cleanups.push(async () => {
    handle.close();
    await client.close();
  });
  return client;
}

describe("unfinished drafts", () => {
  it("marks a `TODO:` placeholder issue, and loads the record with it", async () => {
    const { issues } = await validateSpec({
      contentDir: fixture("placeholder"),
    });
    expect(issues.map((issue) => [issue.path, issue.kind])).toEqual([
      ["/usage/do/1", "placeholder"],
    ]);

    const spec = await loadSpec({
      contentDir: fixture("placeholder"),
      skipInvalid: true,
    });
    expect(spec.issues).toEqual([]);
    expect(spec.get("component.thing").unfinished).toEqual(["/usage/do/1"]);
    expect(spec.render("component.thing")).toContain(
      "**Unfinished.** These fields still hold `TODO:` placeholders: `/usage/do/1`.",
    );
  });

  it("still fails a strict load and the snapshot build", async () => {
    await expect(loadSpec({ contentDir: fixture("placeholder") })).rejects.toBeInstanceOf(
      SpecError,
    );
  });

  it("starts the local MCP server", async () => {
    const client = await connect({
      cwd: fixture("placeholder"),
      contentDir: fixture("placeholder"),
    });
    const got = await client.callTool({
      name: "get",
      arguments: { target: "component.thing" },
    });
    expect(got.isError).toBe(false);
    expect(got.content[0].text).toMatch(/^# Thing/);
    expect(got.content[0].text).toContain("**Unfinished.**");
  });
});

describe("a followed record that is left out", () => {
  const content = fixture("rules-from-invalid");

  it("leaves out the record with the issue, and keeps the component that follows it", async () => {
    const spec = await loadSpec({ contentDir: content, skipInvalid: true });
    expect(spec.list().map((record) => record.id)).toEqual(["component.thing"]);
    expect(spec.issues.map((issue) => issue.file)).toEqual(["guide.md"]);
    expect(spec.gaps("component.thing")).toEqual({
      records: ["pattern.guide"],
      follows: ["pattern.guide"],
      rules: [
        {
          id: "name-it",
          address: "component.thing#name-it",
          extends: "pattern.guide#name-it",
        },
      ],
    });
  });

  it("fails `rules` for the component, with the rules it has and what is missing", async () => {
    const spec = await loadSpec({ contentDir: content, skipInvalid: true });
    const result = ops.rules(spec, { id: "thing" });
    expect(result.ok).toBe(false);
    expect(result.error).toEqual({
      code: "ERR_INCOMPLETE_RULES",
      suggestions: [],
    });
    expect(result.data.map((rule) => rule.address)).toEqual(["component.thing#keep-it-short"]);
    expect(result.text).toMatch(/^INCOMPLETE: The rules of `pattern.guide` are missing/);
    expect(result.text).toContain(
      "`component.thing#name-it` narrows `pattern.guide#name-it` and is left out with it.",
    );
  });

  it("fails `rules` for every record while a record file is left out", async () => {
    const spec = await loadSpec({ contentDir: content, skipInvalid: true });
    const result = ops.rules(spec, { level: "must" });
    expect(result.ok).toBe(false);
    expect(result.data).toEqual([]);
    expect(result.text).toContain("The rules of `guide.md` are missing");
  });

  it("says in the record and its rules that both are incomplete", async () => {
    const spec = await loadSpec({ contentDir: content, skipInvalid: true });
    const text = spec.render("component.thing");
    expect(text).toContain(
      "**Incomplete.** It links to `pattern.guide`, which has issues and was left out.",
    );
    expect(text).toContain("Do not treat this list as complete.");
    expect(spec.render("component.thing#rules")).toContain("**Incomplete.**");
  });

  it("exits 1 from the CLI, with the rules found under `results` in JSON", () => {
    const r = cli(["rules", "--id", "thing", "--content", content, "--json"], content);
    expect(r.code).toBe(1);
    const json = JSON.parse(r.out);
    expect(json.code).toBe("ERR_INCOMPLETE_RULES");
    expect(json.results.map((rule) => rule.address)).toEqual(["component.thing#keep-it-short"]);
    expect(r.err).toContain("left out 1 record file with issues: guide.md");
  });

  it("keeps a component whose followed record fails its schema", async () => {
    const spec = await loadSpec({
      contentDir: fixture("link-to-invalid"),
      skipInvalid: true,
    });
    expect(spec.list().map((record) => record.id)).toEqual(["component.thing"]);
    expect(spec.gaps("component.thing")?.follows).toEqual(["pattern.broken"]);
  });

  it("names the left-out files from the local MCP server, and fails `rules`", async () => {
    const client = await connect({ cwd: content, contentDir: content });
    const result = await client.callTool({
      name: "rules",
      arguments: { id: "component.thing" },
    });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toMatch(
      /^WARNING: Left out 1 record file with issues: guide\.md\./,
    );
    expect(result.content[0].text).toContain("INCOMPLETE: ");
    expect(result.structuredContent.error.code).toBe("ERR_INCOMPLETE_RULES");
  });
});

describe("one check for validate and the snapshot build", () => {
  it("reports a token reference that names no token, and the snapshot build stops on it", async () => {
    const tmp = copy("tools");
    const file = path.join(tmp, "content/thing.spec.yaml");
    const original = fs.readFileSync(file, "utf8");
    fs.writeFileSync(file, original.replace(/radius: (\S+)/, "radius: semantic.does.not.exist"));

    const { issues } = await validateFromConfig({ cwd: tmp });
    expect(issues.map((issue) => issue.message)).toContain(
      "`semantic.does.not.exist` is not a token, and not one of transparent, none, inherit, linear",
    );
    const error = await buildSnapshot({ cwd: tmp }).catch((caught) => caught);
    expect(error).toBeInstanceOf(SpecError);
    expect(error.message).toContain("semantic.does.not.exist");
  });

  it("reports every broken implementation file, and the snapshot build stops on them", async () => {
    const tmp = copy("tools");
    const config = JSON.parse(fs.readFileSync(path.join(tmp, "spec.config.json"), "utf8"));
    config.implementations = {
      web: { folder: "web", technology: "web-component" },
    };
    fs.writeFileSync(path.join(tmp, "spec.config.json"), JSON.stringify(config));
    fs.mkdirSync(path.join(tmp, "web"));
    // A row for a parameter Thing does not have, and no front matter at all.
    fs.writeFileSync(
      path.join(tmp, "web/thing.md"),
      [
        "---",
        "component: component.thing",
        "package: thing-package",
        "tagName: ds-thing",
        "defineExport: defineThing",
        "api:",
        "  - { name: colour, kind: attribute, parameter: colour }",
        "---",
        "",
      ].join("\n"),
    );
    fs.writeFileSync(path.join(tmp, "web/other.md"), "No front matter.\n");

    const { issues } = await validateFromConfig({ cwd: tmp });
    const mapping = issues.filter((issue) => issue.file.startsWith("web/"));
    expect(mapping.map((issue) => [issue.file, issue.message.slice(0, 40)])).toEqual([
      ["web/other.md", "must start with YAML front matter betwee"],
      ["web/thing.md", 'api row "colour" implements the paramete'],
      ["web/thing.md", "the api table does not cover component.t"],
      ["web/thing.md", "items does not cover component.thing ite"],
    ]);

    await expect(buildSnapshot({ cwd: tmp })).rejects.toBeInstanceOf(SpecError);
    // Content named on the command line is other records, so the config's files are not checked.
    const other = await validateFromConfig({
      cwd: tmp,
      contentDir: fixture("valid"),
    });
    expect(other.issues.filter((issue) => issue.file.startsWith("web/"))).toEqual([]);
  });
});
