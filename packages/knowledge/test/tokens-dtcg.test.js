import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createDtcgResolver } from "../src/tokens-dtcg.js";
import { fixture } from "./helpers.js";

const file = (name) => path.join(fixture("tools"), "tokens", name);

describe("createDtcgResolver", () => {
  const resolve = createDtcgResolver({
    light: [file("base.tokens.json"), file("light.tokens.json")],
    dark: [file("base.tokens.json"), file("dark.tokens.json")],
  });

  it("resolves aliases per set", () => {
    expect(resolve("component.thing.loud.hover")).toEqual({ light: "#0000ff", dark: "#ffff00" });
  });

  it("stringifies dimension objects and follows aliases to them", () => {
    expect(resolve("space.md")).toEqual({ light: "16px", dark: "16px" });
    expect(resolve("component.thing.radius")).toEqual({ light: "16px", dark: "16px" });
  });

  it("stringifies other objects as compact JSON", () => {
    expect(resolve("component.thing.shadow").light).toBe('{"x":1,"y":2}');
  });

  it("lets later files win and reports only sets that define the token", () => {
    expect(resolve("component.thing.disabled")).toEqual({ light: "#999999", dark: "#333333" });
    expect(resolve("color.accent")).toEqual({ light: "#0000ff", dark: "#ffff00" });
    const onlyLight = createDtcgResolver({
      light: [file("base.tokens.json"), file("light.tokens.json")],
      dark: [file("base.tokens.json")],
    });
    expect(onlyLight("color.accent")).toEqual({ light: "#0000ff" });
  });

  it("returns undefined for missing tokens and keywords", () => {
    expect(resolve("component.thing.nothing")).toBeUndefined();
    expect(resolve("none")).toBeUndefined();
    expect(resolve("transparent")).toBeUndefined();
  });

  it("detects alias cycles", () => {
    const cyclic = createDtcgResolver({ light: [file("cycle.tokens.json")] });
    expect(() => cyclic("a")).toThrow(/Circular token alias: a -> b -> c -> a/);
  });

  it("retries after a failed read instead of caching a partial index", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "dtcg-"));
    const later = path.join(dir, "later.tokens.json");
    const resolve = createDtcgResolver({ light: [later] });
    expect(() => resolve("a")).toThrow(/Cannot read token file/);
    fs.writeFileSync(later, JSON.stringify({ a: { $value: "#fff" } }));
    expect(resolve("a")).toEqual({ light: "#fff" });
    fs.rmSync(dir, { recursive: true });
  });

  it("does not read files until first use", () => {
    const lazy = createDtcgResolver({ light: ["/nonexistent/x.json"] });
    expect(() => lazy("a")).toThrow(/Cannot read token file/);
  });
});
