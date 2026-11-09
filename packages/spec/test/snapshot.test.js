import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { describe, expect, it } from "vitest";
import { buildSnapshot } from "../src/build-snapshot.js";
import { loadFromConfig, resolveConfig } from "../src/config.js";
import { createSpecServer } from "../src/mcp.js";
import * as ops from "../src/operations.js";
import { createSnapshotServer } from "../src/server.js";
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
    setupHint: (name) => `setup ${name}`,
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
    out[`setup ${name}`] = ops.setup({ implementation: name }, options);
  }
  out["setup unknown"] = ops.setup({ implementation: "vue" }, options);
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

  it("runs on a host with no Node APIs", () => {
    const seen = new Set();
    const visit = (file) => {
      if (seen.has(file)) return;
      seen.add(file);
      const source = fs.readFileSync(file, "utf8");
      for (const [, name] of source.matchAll(/(?:from|import) "([^"]+)"/g)) {
        expect(name, `${file} imports ${name}`).not.toMatch(/^node:/);
        if (name.startsWith(".") && name.endsWith(".js")) {
          visit(path.resolve(path.dirname(file), name));
        }
      }
    };
    visit(fileURLToPath(new URL("../src/server.js", import.meta.url)));
    expect(seen.size).toBeGreaterThan(5);
  });
});

describe("snapshot MCP server", () => {
  const connect = async (server) => {
    const client = new Client({ name: "test", version: "0.0.0" });
    const [a, b] = InMemoryTransport.createLinkedPair();
    await Promise.all([server.connect(a), client.connect(b)]);
    return client;
  };

  it("answers tools and resources as the local server does, without validate", async () => {
    const local = await createSpecServer({ cwd: repoRoot, watch: false });
    const fromFiles = await connect(local.server);
    const fromSnapshot = await connect(createSnapshotServer(await build()));

    const names = (await fromSnapshot.listTools()).tools.map((tool) => tool.name);
    expect(names).toEqual(
      (await fromFiles.listTools()).tools
        .map((tool) => tool.name)
        .filter((name) => name !== "validate"),
    );
    expect(names).not.toContain("validate");
    expect(await fromSnapshot.listResources()).toEqual(await fromFiles.listResources());
    expect(fromSnapshot.getInstructions()).toEqual(fromFiles.getInstructions());

    const calls = [
      ["search", { query: "destructive action" }],
      ["get", { target: "button", implementation: "web" }],
      ["get", { target: "component.button#rules" }],
      ["get", { target: "buton" }],
      ["list", { type: "pattern" }],
      ["links", { id: "component.button", direction: "both" }],
      ["rules", { level: "must" }],
      ["tokens", { id: "component.button", resolve: true }],
      ["format", { resolve: true }],
    ];
    for (const [name, args] of calls) {
      const call = { name, arguments: args };
      expect(await fromSnapshot.callTool(call), name).toEqual(await fromFiles.callTool(call));
    }
    const uri = "spec://component.button";
    expect(await fromSnapshot.readResource({ uri })).toEqual(await fromFiles.readResource({ uri }));

    await fromSnapshot.close();
    await fromFiles.close();
    local.close();
  });
});
