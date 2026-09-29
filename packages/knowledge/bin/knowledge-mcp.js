#!/usr/bin/env node
import { parseArgs } from "node:util";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createKnowledgeServer } from "../src/mcp.js";

try {
  const { values } = parseArgs({
    options: { content: { type: "string" }, config: { type: "string" } },
  });
  const { server, close } = await createKnowledgeServer({
    contentDir: values.content,
    configPath: values.config,
  });
  await server.connect(new StdioServerTransport());
  process.stdin.on("close", () => {
    close();
    process.exit(0);
  });
} catch (error) {
  process.stderr.write(`knowledge-mcp: ${error.message}\n`);
  process.exit(1);
}
