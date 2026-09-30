import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { DEFAULT_CONTENT_DIR } from "../src/index.js";
import { findConfig, loadFromConfig, resolveConfig } from "../src/config.js";
import { fixture } from "./helpers.js";

const tools = fixture("tools");

describe("findConfig", () => {
  it("walks up to the nearest knowledge.config.json", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "knowledge-config-"));
    fs.mkdirSync(path.join(tmp, "a/b/c"), { recursive: true });
    fs.writeFileSync(path.join(tmp, "knowledge.config.json"), '{ "content": "docs" }');
    const found = findConfig(path.join(tmp, "a/b/c"));
    expect(fs.realpathSync(found.path)).toBe(
      fs.realpathSync(path.join(tmp, "knowledge.config.json")),
    );
    expect(found.config.content).toBe("docs");
    fs.rmSync(tmp, { recursive: true });
  });

  it("returns undefined when there is none", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "knowledge-config-"));
    // Only meaningful when no ancestor of the temp dir has a config.
    expect(findConfig(tmp)).toBeUndefined();
    fs.rmSync(tmp, { recursive: true });
  });
});

describe("loadFromConfig", () => {
  it("uses the config content folder, relative to the config file", async () => {
    const knowledge = await loadFromConfig({ cwd: tools });
    expect(fs.realpathSync(knowledge.contentDir)).toBe(
      fs.realpathSync(path.join(tools, "content")),
    );
  });

  it("prefers an explicit content folder over the config", async () => {
    const knowledge = await loadFromConfig({ cwd: tools, contentDir: fixture("valid") });
    expect(knowledge.contentDir).toBe(fixture("valid"));
  });

  it("falls back to the library default with no config or flag", async () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "knowledge-config-"));
    expect(resolveConfig({ cwd: tmp }).contentDir).toBeUndefined();
    const knowledge = await loadFromConfig({ cwd: tmp });
    expect(knowledge.contentDir).toBe(DEFAULT_CONTENT_DIR);
    fs.rmSync(tmp, { recursive: true });
  });

  it("resolves token values only when asked", async () => {
    const withTokens = await loadFromConfig({ cwd: tools });
    const rows = withTokens.tokens("component.thing", { condition: "tone.loud + hover" });
    expect(rows[0].values).toEqual({ light: "#0000ff", dark: "#ffff00" });
    const without = await loadFromConfig({ cwd: tools, resolveTokens: false });
    expect(without.tokens("component.thing")[0].values).toBeUndefined();
  });

  it("reads a config named by path", async () => {
    const knowledge = await loadFromConfig({
      cwd: os.tmpdir(),
      configPath: path.join(tools, "knowledge.config.json"),
    });
    expect(knowledge.get("component.thing")).toBeDefined();
  });

  it("throws a clear error for a bad config", () => {
    expect(() => resolveConfig({ cwd: tools, configPath: "bad.config.json" })).toThrow(
      /"content" must be a non-empty string/,
    );
    expect(() => resolveConfig({ cwd: tools, configPath: "missing.json" })).toThrow(
      /Cannot read config/,
    );
  });

  it("rejects unknown fields and bad token shapes", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "knowledge-config-"));
    const write = (value) => {
      fs.writeFileSync(path.join(tmp, "c.json"), JSON.stringify(value));
      return () => resolveConfig({ cwd: tmp, configPath: "c.json" });
    };
    expect(write({ nope: 1 })).toThrow(/unknown field "nope"/);
    expect(write({ tokens: { format: "css", sets: {} } })).toThrow(/must be "dtcg"/);
    expect(write({ tokens: { format: "dtcg", sets: { a: "x" } } })).toThrow(/tokens.sets.a/);
    fs.rmSync(tmp, { recursive: true });
  });
});
