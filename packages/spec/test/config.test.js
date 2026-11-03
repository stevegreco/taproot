import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { DEFAULT_CONTENT_DIR } from "../src/index.js";
import { findConfig, loadFromConfig, resolveConfig } from "../src/config.js";
import { fixture } from "./helpers.js";

const tools = fixture("tools");

describe("findConfig", () => {
  it("walks up to the nearest spec.config.json", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "spec-config-"));
    fs.mkdirSync(path.join(tmp, "a/b/c"), { recursive: true });
    fs.writeFileSync(path.join(tmp, "spec.config.json"), '{ "content": "docs" }');
    const found = findConfig(path.join(tmp, "a/b/c"));
    expect(fs.realpathSync(found.path)).toBe(fs.realpathSync(path.join(tmp, "spec.config.json")));
    expect(found.config.content).toBe("docs");
    fs.rmSync(tmp, { recursive: true });
  });

  it("returns undefined when there is none", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "spec-config-"));
    // Only meaningful when no ancestor of the temp dir has a config.
    expect(findConfig(tmp)).toBeUndefined();
    fs.rmSync(tmp, { recursive: true });
  });
});

describe("loadFromConfig", () => {
  it("uses the config content folder, relative to the config file", async () => {
    const spec = await loadFromConfig({ cwd: tools });
    expect(fs.realpathSync(spec.contentDir)).toBe(fs.realpathSync(path.join(tools, "content")));
  });

  it("prefers an explicit content folder over the config", async () => {
    const spec = await loadFromConfig({ cwd: tools, contentDir: fixture("valid") });
    expect(spec.contentDir).toBe(fixture("valid"));
  });

  it("falls back to the library default with no config or flag", async () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "spec-config-"));
    expect(resolveConfig({ cwd: tmp }).contentDir).toBeUndefined();
    const spec = await loadFromConfig({ cwd: tmp });
    expect(spec.contentDir).toBe(DEFAULT_CONTENT_DIR);
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
    const spec = await loadFromConfig({
      cwd: os.tmpdir(),
      configPath: path.join(tools, "spec.config.json"),
    });
    expect(spec.get("component.thing")).toBeDefined();
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
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "spec-config-"));
    const write = (value) => {
      fs.writeFileSync(path.join(tmp, "c.json"), JSON.stringify(value));
      return () => resolveConfig({ cwd: tmp, configPath: "c.json" });
    };
    expect(write({ nope: 1 })).toThrow(/unknown field "nope"/);
    expect(write({ tokens: { format: "css", sets: {} } })).toThrow(/must be "dtcg"/);
    expect(write({ tokens: { format: "dtcg", sets: { a: "x" } } })).toThrow(/tokens.sets.a/);
    expect(write({ implementations: ["web"] })).toThrow(/"implementations" must be an object/);
    expect(write({ implementations: { web: "web" } })).toThrow(
      /"implementations.web" must be an object/,
    );
    expect(write({ implementations: { web: { folder: "", technology: "react" } } })).toThrow(
      /implementations.web.folder/,
    );
    expect(write({ implementations: { web: { folder: "web", technology: "vue" } } })).toThrow(
      /"implementations.web.technology" must be one of web-component, react/,
    );
    expect(
      write({ implementations: { web: { folder: "web", technology: "react", tag: "x" } } }),
    ).toThrow(/unknown field "tag"/);
    fs.rmSync(tmp, { recursive: true });
  });

  it("resolves implementation folders relative to the config file", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "spec-config-"));
    fs.writeFileSync(
      path.join(tmp, "spec.config.json"),
      JSON.stringify({
        implementations: { web: { folder: "impl/web", technology: "web-component" } },
      }),
    );
    const { implementations } = resolveConfig({ cwd: tmp });
    expect(implementations.web).toEqual({
      folder: path.join(tmp, "impl/web"),
      technology: "web-component",
    });
    expect(resolveConfig({ cwd: tools }).implementations).toEqual({});
    fs.rmSync(tmp, { recursive: true });
  });
});

describe("constants", () => {
  const write = (config) => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "spec-config-"));
    fs.writeFileSync(path.join(tmp, "spec.config.json"), JSON.stringify(config));
    return tmp;
  };

  it("returns the configured constants, or none", () => {
    const tmp = write({ constants: { "border-width": "semantic.border.width" } });
    expect(resolveConfig({ cwd: tmp }).constants).toEqual({
      "border-width": "semantic.border.width",
    });
    expect(resolveConfig({ cwd: tools }).constants).toEqual({});
    fs.rmSync(tmp, { recursive: true });
  });

  it("rejects a constant that is not a hyphenated name and a token reference", () => {
    for (const [constants, message] of [
      [["semantic.border.width"], '"constants" must be an object'],
      [{ borderWidth: "semantic.border.width" }, '"constants.borderWidth" must be a lowercase'],
      [{ "border-width": "" }, '"constants.border-width" must be a non-empty token reference'],
    ]) {
      const tmp = write({ constants });
      expect(() => resolveConfig({ cwd: tmp })).toThrow(message);
      fs.rmSync(tmp, { recursive: true });
    }
  });
});
