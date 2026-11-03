import fs from "node:fs";
import { SpecError } from "./index.js";
import { loadFromConfig, resolveConfig, validateFromConfig } from "./config.js";
import * as ops from "./operations.js";
import { createServer } from "./server.js";

/**
 * Create the local spec MCP server, which reads the source files, and its reload watcher.
 *
 * @param {{ cwd?: string, contentDir?: string, configPath?: string, watch?: boolean, debounceMs?: number }} [options]
 * @returns {Promise<{ server: import("@modelcontextprotocol/sdk/server/mcp.js").McpServer, reload: () => Promise<void>, close: () => void }>}
 */
export async function createSpecServer(options = {}) {
  const { cwd = process.cwd(), contentDir, configPath, watch = true, debounceMs = 200 } = options;
  const loadOptions = { cwd, contentDir, configPath };

  let spec = await loadFromConfig({ ...loadOptions, resolveTokens: false });
  /** @type {string | undefined} */
  let warning;

  const server = createServer({
    spec: () => spec,
    config: () => resolveConfig(loadOptions),
    warning: () => warning,
    validate: async () => {
      const { issues, recordCount } = await validateFromConfig(loadOptions);
      return ops.formatIssues(issues, recordCount);
    },
  });

  async function reload() {
    try {
      spec = await loadFromConfig({ ...loadOptions, resolveTokens: false });
      warning = undefined;
    } catch (error) {
      if (error instanceof SpecError) {
        const { text } = ops.formatIssues(error.issues, 0);
        warning = text.replace(/\n[^\n]*$/, "");
      } else {
        warning = `Reload failed: ${error.message}`;
      }
    }
    if (server.isConnected()) {
      server.sendResourceListChanged();
    }
  }

  let watcher;
  let timer;
  if (watch) {
    try {
      watcher = fs.watch(spec.contentDir, { recursive: true }, () => {
        clearTimeout(timer);
        timer = setTimeout(reload, debounceMs);
      });
      watcher.on("error", () => {});
    } catch {
      // Watching is a convenience; the server still works without it.
    }
  }
  return {
    server,
    reload,
    close() {
      clearTimeout(timer);
      watcher?.close();
    },
  };
}
