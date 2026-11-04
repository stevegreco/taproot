import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { afterEach, describe, expect, it } from "vitest";
import { AGENT_INSTRUCTIONS } from "../src/agents.js";
import { createSpecServer } from "../src/mcp.js";
import { fixture } from "./helpers.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "../../..");
// Implementations come from a fixture config, so adding one to the repository changes no output.
const impls = fixture("implementations");
const cleanups = [];
afterEach(async () => {
  while (cleanups.length) await cleanups.pop()();
});

async function connect(options) {
  const handle = await createSpecServer({ watch: false, ...options });
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

describe("spec MCP server", () => {
  it("lists the tools and gives instructions", async () => {
    const { client } = await connect({ cwd: repoRoot });
    const { tools } = await client.listTools();
    expect(tools.map((t) => t.name).sort()).toEqual([
      "format",
      "get",
      "links",
      "list",
      "rules",
      "search",
      "tokens",
      "validate",
    ]);
    for (const tool of tools) expect(tool.description.length).toBeGreaterThan(30);
    expect(client.getInstructions()).toBe(AGENT_INSTRUCTIONS);
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

  it("lists the components an implementation has", async () => {
    const { client } = await connect({ cwd: impls });
    const listed = await client.callTool({ name: "list", arguments: { implementation: "react" } });
    const ids = listed.structuredContent.results.map((record) => record.id);
    expect(ids).toContain("component.button");
    expect(ids).not.toContain("component.card");
  });

  it("gets a component with its implementation", async () => {
    const { client } = await connect({ cwd: impls });
    const plain = await client.callTool({ name: "get", arguments: { target: "component.button" } });
    expect(text(plain)).toContain(
      'Implementations: web, react. Call get component.button with implementation one of "web", "react" for',
    );

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
    const { client } = await connect({ cwd: impls });
    const named = await client.callTool({ name: "get", arguments: { target: "text field" } });
    expect(text(named)).toMatch(/^# Text field/);

    const typo = await client.callTool({ name: "get", arguments: { target: "buton" } });
    expect(typo.isError).toBe(true);
    expect(typo.structuredContent.error).toEqual({
      code: "ERR_UNKNOWN_RECORD",
      suggestions: ["component.button"],
    });

    const found = await client.callTool({ name: "search", arguments: { query: "buton" } });
    expect(text(found)).toContain(
      '  → get component.button with implementation one of "web", "react"\n',
    );
  });

  it("serves the format reference with the constant tokens", async () => {
    const { client } = await connect({ cwd: repoRoot });
    const plain = await client.callTool({ name: "format", arguments: {} });
    expect(text(plain)).toContain("| focus-ring-offset | `semantic.focus.offset` |");
    expect(text(plain)).toContain("Call `format` with resolve for values.");
    const resolved = await client.callTool({ name: "format", arguments: { resolve: true } });
    expect(resolved.structuredContent.results.constants[1]).toEqual({
      name: "focus-ring-width",
      token: "semantic.focus.width",
      values: { light: "2px", dark: "2px" },
    });
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
    const conditional = await client.callTool({
      name: "rules",
      arguments: { id: "component.checkbox#form-value" },
    });
    expect(text(conditional)).toContain("  - Applies when: The checkbox belongs to a form.");
    const value = await client.callTool({
      name: "get",
      arguments: { target: "component.button#parameters.variant.destructive" },
    });
    expect(text(value)).toContain("Example: Delete project");
    expect(text(value)).toContain(
      "Guidance: [Action hierarchy](pattern.action-hierarchy#destructive)",
    );
    const links = await client.callTool({ name: "links", arguments: { id: "component.link" } });
    expect(text(links)).toContain("## alternative");
    const validated = await client.callTool({ name: "validate", arguments: {} });
    expect(text(validated)).toMatch(/^OK: /);
  });

  it("serves items: sections, the item element, links, and search", async () => {
    const { client } = await connect({ cwd: repoRoot });
    const item = await client.callTool({
      name: "get",
      arguments: { target: "component.accordion#items.section" },
    });
    expect(item.isError).toBeFalsy();
    expect(text(item)).toContain("| expanded | boolean |  | `false` |");

    const web = await client.callTool({
      name: "get",
      arguments: { target: "component.accordion", implementation: "web" },
    });
    expect(text(web)).toContain("### Section element: `<ds-accordion-section>`");
    const { record, implementation } = web.structuredContent.results;
    expect(Object.keys(record.items.section.parameters)).toEqual(["label", "expanded"]);
    expect(implementation.items.section.tagName).toBe("ds-accordion-section");

    const fixtureClient = (await connect({ cwd: fixture("tools") })).client;
    const value = await fixtureClient.callTool({
      name: "get",
      arguments: { target: "component.thing#items.entry.parameters.size.large" },
    });
    expect(text(value)).toContain("Guidance: [Guide](pattern.guide#second-step)");
    const links = await fixtureClient.callTool({
      name: "links",
      arguments: { id: "component.thing" },
    });
    expect(text(links)).toContain(
      "- items.entry.parameters.size.large → pattern.guide#second-step",
    );
    const found = await fixtureClient.callTool({ name: "search", arguments: { query: "zephyr" } });
    expect(text(found)).toContain("- component.thing — Thing: ");
  });

  it("reads token files only for tokens with resolve, so a broken token file cannot fail get", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "taproot-mcp-"));
    cleanups.push(async () => fs.rmSync(dir, { recursive: true }));
    fs.writeFileSync(
      path.join(dir, "spec.config.json"),
      JSON.stringify({
        content: path.join(repoRoot, "packages/spec/content"),
        tokens: { format: "dtcg", sets: { light: ["missing.tokens.json"] } },
      }),
    );
    const { client } = await connect({ cwd: dir });

    const got = await client.callTool({
      name: "get",
      arguments: { target: "component.button#tokens" },
    });
    expect(got.isError).toBeFalsy();
    expect(text(got)).toContain("semantic.color.background.action.primary.hover");

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
    const button = resources.find((r) => r.uri === "spec://component.button");
    expect(button.mimeType).toBe("text/markdown");
    const read = await client.readResource({ uri: "spec://component.button" });
    expect(read.contents[0].mimeType).toBe("text/markdown");
    expect(read.contents[0].text).toMatch(/^# Button/);
    const example = await client.readResource({
      uri: "spec://example.action-hierarchy.settings",
    });
    for (const id of ["profile-actions", "danger-zone", "outcome-labels"]) {
      expect(example.contents[0].text).toContain(`example.action-hierarchy.settings#${id}`);
    }
  });

  it("keeps the last good index and warns when a reload has issues", async () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "taproot-mcp-"));
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
      (await client.readResource({ uri: "spec://component.thing" })).contents[0].text;
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
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "taproot-mcp-"));
    cleanups.push(() => fs.rmSync(tmp, { recursive: true }));
    fs.cpSync(fixture("valid"), tmp, { recursive: true });
    const { client } = await connect({ cwd: tmp, contentDir: tmp, watch: true, debounceMs: 20 });
    const file = path.join(tmp, "thing.spec.yaml");
    const changed = fs
      .readFileSync(file, "utf8")
      .replace("Use Thing for testing.", "Use Thing for changing.");
    // The watcher may not be listening yet when the server starts (recursive watching on Linux is
    // set up in the background), so write again on each poll until the server sees a change.
    await expect
      .poll(
        async () => {
          fs.writeFileSync(file, changed);
          return text(await client.callTool({ name: "search", arguments: { query: "changing" } }));
        },
        { timeout: 10000, interval: 200 },
      )
      .toContain("component.thing");
  });

  it("serves over stdio", async () => {
    const client = new Client({ name: "test", version: "0.0.0" });
    const transport = new StdioClientTransport({
      command: process.execPath,
      args: [path.join(here, "../bin/taproot-mcp.js")],
      cwd: repoRoot,
    });
    cleanups.push(() => client.close());
    await client.connect(transport);
    const { tools } = await client.listTools();
    expect(tools).toHaveLength(8);
  });
});
