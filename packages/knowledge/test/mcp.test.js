import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { afterEach, describe, expect, it } from "vitest";
import { createKnowledgeServer } from "../src/mcp.js";
import { fixture } from "./helpers.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "../../..");
const cleanups = [];
afterEach(async () => {
  while (cleanups.length) await cleanups.pop()();
});

async function connect(options) {
  const handle = await createKnowledgeServer({ watch: false, ...options });
  const client = new Client({ name: "test", version: "0.0.0" });
  const [a, b] = InMemoryTransport.createLinkedPair();
  await Promise.all([handle.server.connect(a), client.connect(b)]);
  cleanups.push(async () => {
    handle.close();
    await client.close();
  });
  return { client, ...handle };
}

const text = (result) => result.content[0].text;

describe("knowledge MCP server", () => {
  it("lists the tools and gives instructions", async () => {
    const { client } = await connect({ cwd: repoRoot });
    const { tools } = await client.listTools();
    expect(tools.map((t) => t.name).sort()).toEqual([
      "get",
      "links",
      "list",
      "rules",
      "search",
      "tokens",
      "validate",
    ]);
    for (const tool of tools) expect(tool.description.length).toBeGreaterThan(30);
    expect(client.getInstructions()).toContain("technology-neutral");
  });

  it("searches and gets", async () => {
    const { client } = await connect({ cwd: repoRoot });
    const found = await client.callTool({
      name: "search",
      arguments: { query: "destructive action" },
    });
    expect(text(found)).toContain("- pattern.action-hierarchy — Action hierarchy: ");
    expect(found.structuredContent.results[0]).toHaveProperty("id");

    const got = await client.callTool({ name: "get", arguments: { target: "component.button" } });
    expect(text(got)).toMatch(/^# Button/);

    const missing = await client.callTool({ name: "get", arguments: { target: "component.nope" } });
    expect(missing.isError).toBe(true);
  });

  it("gets a component with its implementation", async () => {
    const { client } = await connect({ cwd: repoRoot });
    const plain = await client.callTool({ name: "get", arguments: { target: "component.button" } });
    expect(text(plain)).toContain('call `get` with implementation "web"');

    const got = await client.callTool({
      name: "get",
      arguments: { target: "component.button", implementation: "web" },
    });
    expect(text(got)).toContain("- Element: `<ds-button>`");
    expect(got.structuredContent.results.implementation.component).toBe("component.button");

    const pattern = await client.callTool({
      name: "get",
      arguments: { target: "pattern.action-hierarchy", implementation: "web" },
    });
    expect(pattern.isError).toBe(true);
  });

  it("resolves names, suggests typos, and names the next call", async () => {
    const { client } = await connect({ cwd: repoRoot });
    const named = await client.callTool({ name: "get", arguments: { target: "text field" } });
    expect(text(named)).toMatch(/^# Text field/);

    const typo = await client.callTool({ name: "get", arguments: { target: "buton" } });
    expect(typo.isError).toBe(true);
    expect(typo.structuredContent.error).toEqual({
      code: "ERR_UNKNOWN_RECORD",
      suggestions: ["component.button"],
    });

    const found = await client.callTool({ name: "search", arguments: { query: "buton" } });
    expect(text(found)).toContain('  → get component.button with implementation "web"');
  });

  it("resolves tokens, and lists rules and links", async () => {
    const { client } = await connect({ cwd: repoRoot });
    const tokens = await client.callTool({
      name: "tokens",
      arguments: { id: "component.button", condition: "variant.primary + hover", resolve: true },
    });
    expect(text(tokens)).toContain("`#823f1e`");
    expect(text(tokens)).toContain("`#e8c468`");
    const plain = await client.callTool({ name: "tokens", arguments: { id: "component.button" } });
    expect(text(plain)).not.toContain("| light");
    const rules = await client.callTool({ name: "rules", arguments: { level: "must" } });
    expect(text(rules)).toMatch(/\*\*MUST\*\* component\./);
    const links = await client.callTool({ name: "links", arguments: { id: "component.link" } });
    expect(text(links)).toContain("## alternative");
    const validated = await client.callTool({ name: "validate", arguments: {} });
    expect(text(validated)).toMatch(/^OK: /);
  });

  it("reads token files only for tokens with resolve, so a broken token file cannot fail get", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "knowledge-mcp-"));
    cleanups.push(async () => fs.rmSync(dir, { recursive: true }));
    fs.writeFileSync(
      path.join(dir, "knowledge.config.json"),
      JSON.stringify({
        content: path.join(repoRoot, "packages/knowledge/content"),
        tokens: { format: "dtcg", sets: { light: ["missing.tokens.json"] } },
      }),
    );
    const { client } = await connect({ cwd: dir });

    const got = await client.callTool({ name: "get", arguments: { target: "component.button" } });
    expect(got.isError).toBeFalsy();
    expect(text(got)).toContain("component.button.primary.background.hover");

    const plain = await client.callTool({ name: "tokens", arguments: { id: "component.button" } });
    expect(plain.isError).toBeFalsy();

    const resolved = await client.callTool({
      name: "tokens",
      arguments: { id: "component.button", resolve: true },
    });
    expect(resolved.isError).toBe(true);
    expect(text(resolved)).toMatch(/Cannot read token file/);
  });

  it("lists and reads resources", async () => {
    const { client } = await connect({ cwd: repoRoot });
    const { resources } = await client.listResources();
    const button = resources.find((r) => r.uri === "knowledge://component.button");
    expect(button.mimeType).toBe("text/markdown");
    const read = await client.readResource({ uri: "knowledge://component.button" });
    expect(read.contents[0].mimeType).toBe("text/markdown");
    expect(read.contents[0].text).toMatch(/^# Button/);
    const example = await client.readResource({
      uri: "knowledge://example.action-hierarchy.settings",
    });
    for (const id of ["profile-actions", "danger-zone", "outcome-labels"]) {
      expect(example.contents[0].text).toContain(`example.action-hierarchy.settings#${id}`);
    }
  });

  it("keeps the last good index and warns when a reload has issues", async () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "knowledge-mcp-"));
    cleanups.push(() => fs.rmSync(tmp, { recursive: true }));
    fs.cpSync(fixture("valid"), tmp, { recursive: true });
    const { client, reload } = await connect({ cwd: tmp, contentDir: tmp });

    const file = path.join(tmp, "thing.spec.yaml");
    const original = fs.readFileSync(file, "utf8");
    fs.writeFileSync(file, `${original}\nbogus: true\n`);
    await reload();
    const warned = await client.callTool({ name: "get", arguments: { target: "component.thing" } });
    expect(text(warned)).toMatch(/^WARNING: /);
    expect(text(warned)).toContain("thing.spec.yaml");
    expect(text(warned)).toContain("# Thing");
    const read = async () =>
      (await client.readResource({ uri: "knowledge://component.thing" })).contents[0].text;
    const staleResource = await read();
    expect(staleResource).toMatch(/^WARNING: /);
    expect(staleResource).toContain("# Thing");

    fs.writeFileSync(file, original);
    await reload();
    const clean = await client.callTool({ name: "get", arguments: { target: "component.thing" } });
    expect(text(clean)).toMatch(/^# Thing/);
    expect(await read()).toMatch(/^# Thing/);
  });

  it("reloads when files change", async () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "knowledge-mcp-"));
    cleanups.push(() => fs.rmSync(tmp, { recursive: true }));
    fs.cpSync(fixture("valid"), tmp, { recursive: true });
    const { client } = await connect({ cwd: tmp, contentDir: tmp, watch: true, debounceMs: 20 });
    const file = path.join(tmp, "thing.spec.yaml");
    fs.writeFileSync(
      file,
      fs.readFileSync(file, "utf8").replace("Use Thing for testing.", "Use Thing for changing."),
    );
    await expect
      .poll(
        async () =>
          text(await client.callTool({ name: "search", arguments: { query: "changing" } })),
        {
          timeout: 3000,
        },
      )
      .toContain("component.thing");
  });

  it("serves over stdio", async () => {
    const client = new Client({ name: "test", version: "0.0.0" });
    const transport = new StdioClientTransport({
      command: process.execPath,
      args: [path.join(here, "../bin/knowledge-mcp.js")],
      cwd: repoRoot,
    });
    cleanups.push(() => client.close());
    await client.connect(transport);
    const { tools } = await client.listTools();
    expect(tools).toHaveLength(7);
  });
});
