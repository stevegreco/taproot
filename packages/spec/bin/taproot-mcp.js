#!/usr/bin/env node
import { parseArgs } from "node:util";
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import { createSpecServer } from "../src/mcp.js";

try {
  const { values } = parseArgs({
    options: { content: { type: "string" }, config: { type: "string" } },
  });
  const { newServer, close } = await createSpecServer({
    contentDir: values.content,
    configPath: values.config,
  });
  // Serves clients on protocol `2026-07-28` and on the 2025 revisions. A client that falls back from
  // the first to the second gets a new server, so the factory never hands back a used one.
  serveStdio(newServer);
  process.stdin.on("close", () => {
    close();
    process.exit(0);
  });
} catch (error) {
  process.stderr.write(`taproot-mcp: ${error.message}\n`);
  process.exit(1);
}
