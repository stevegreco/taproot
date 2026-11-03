import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { buildSnapshot } from "../src/build-snapshot.js";
import { loadFromConfig, resolveConfig } from "../src/config.js";
import * as ops from "../src/operations.js";
import { openSnapshot } from "../src/snapshot.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const build = async (options) =>
  JSON.parse(JSON.stringify(await buildSnapshot({ cwd: repoRoot, ...options })));

/** The same calls against any source of answers, each named so a failure says which one differed. */
function answers({ spec, implementations, constants, resolveToken }) {
  const options = {
    implementations,
    constants,
    resolveToken,
    next: (id, names) => `next ${id} ${names.join(" ")}`,
    browse: "browse",
    tokensHint: (id, count) => `tokens ${id} ${count}`,
    implementationHint: (id, names) => `impl ${id} ${names.join(" ")}`,
    detailHint: (address) => `detail ${address}`,
    resolveHint: "resolve",
  };
  const out = {
    list: ops.list(spec, {}, options),
    rules: ops.rules(spec, {}, options),
    "rules must": ops.rules(spec, { level: "must", topic: "accessibility" }, options),
    format: ops.format({}, options),
    "format resolve": ops.format({ resolve: true }, options),
    "unknown record": ops.get(spec, { target: "buton" }, options),
    "unknown implementation": ops.get(spec, { target: "button", implementation: "vue" }, options),
  };
  for (const query of [
    "destructive action",
    "buton",
    "dialog",
    "form field",
    "nothing like this",
  ]) {
    out[`search ${query}`] = ops.search(spec, { query }, options);
  }
  for (const name of Object.keys(implementations)) {
    out[`list ${name}`] = ops.list(spec, { implementation: name }, options);
  }
  for (const { id } of spec.list()) {
    out[`get ${id}`] = ops.get(spec, { target: id }, options);
    out[`links ${id}`] = ops.links(spec, { id, direction: "both" });
    out[`rules ${id}`] = ops.rules(spec, { id }, options);
    out[`tokens ${id}`] = ops.tokens(spec, { id, resolve: true }, options);
    for (const section of spec.get(id).sections) {
      const target = `${id}#${section}`;
      out[`get ${target}`] = ops.get(spec, { target }, options);
    }
    for (const name of Object.keys(implementations)) {
      out[`get ${id} ${name}`] = ops.get(spec, { target: id, implementation: name }, options);
    }
  }
  return out;
}

describe("spec snapshot", () => {
  it("answers every read-only call exactly as the source files do", async () => {
    const config = resolveConfig({ cwd: repoRoot });
    const fromFiles = answers({
      ...config,
      spec: await loadFromConfig({ cwd: repoRoot, resolveTokens: false }),
    });
    const fromSnapshot = answers(openSnapshot(await build()));

    expect(Object.keys(fromSnapshot)).toEqual(Object.keys(fromFiles));
    expect(fromFiles["get component.button web"].ok).toBe(true);
    expect(fromFiles["get component.button react"].ok).toBe(true);
    expect(fromFiles["tokens component.button"].data[0].values).toBeDefined();
    for (const name of Object.keys(fromFiles)) {
      expect(fromSnapshot[name], name).toEqual(fromFiles[name]);
    }
  }, 60_000);

  it("adds token values to spec.tokens only when asked", async () => {
    const snapshot = await build();
    const [plain] = openSnapshot(snapshot).spec.tokens("component.button");
    const [resolved] = openSnapshot(snapshot, { resolveTokens: true }).spec.tokens(
      "component.button",
    );
    expect(plain.values).toBeUndefined();
    expect(resolved.values).toEqual(
      (await loadFromConfig({ cwd: repoRoot })).tokens("component.button")[0].values,
    );
  });

  it("includes only the named implementations", async () => {
    const { spec, implementations } = openSnapshot(await build({ implementations: ["web"] }));
    expect(Object.keys(implementations)).toEqual(["web"]);
    const result = ops.get(
      spec,
      { target: "button", implementation: "react" },
      { implementations },
    );
    expect(result.error.code).toBe("ERR_UNKNOWN_IMPLEMENTATION");
    await expect(build({ implementations: ["vue"] })).rejects.toThrow(/vue/);
  });

  it("holds no absolute paths from the machine that built it", async () => {
    expect(JSON.stringify(await build())).not.toContain(repoRoot);
  });
});
