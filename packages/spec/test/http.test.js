import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { describe, expect, it } from "vitest";
import { buildSnapshot } from "../src/build-snapshot.js";
import { handleMcpRequest } from "../src/http.js";

const cwd = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

describe("MCP over HTTP", () => {
  it("serves a client across separate requests, with no session", async () => {
    const snapshot = await buildSnapshot({ cwd, implementations: ["web"] });
    const transport = new StreamableHTTPClientTransport(new URL("http://test.invalid/mcp"), {
      fetch: (url, init) => handleMcpRequest(snapshot, new Request(url, init)),
    });
    const client = new Client({ name: "test", version: "0.0.0" });
    await client.connect(transport);

    expect(transport.sessionId).toBeUndefined();
    const { tools } = await client.listTools();
    expect(tools.map((tool) => tool.name)).toContain("search");
    expect(tools.map((tool) => tool.name)).not.toContain("validate");

    const button = await client.callTool({
      name: "get",
      arguments: { target: "button", implementation: "web" },
    });
    expect(button.isError).toBe(false);
    expect(button.content[0].text).toContain("@taproot-ds/web-components");

    const react = await client.callTool({
      name: "get",
      arguments: { target: "button", implementation: "react" },
    });
    expect(react.isError).toBe(true);
    await client.close();

    const stream = await handleMcpRequest(snapshot, new Request("http://test.invalid/mcp"));
    expect(stream.status).toBe(405);
    expect(stream.headers.get("allow")).toBe("POST");
  });
});
