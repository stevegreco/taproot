import fs from "node:fs";
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

  // Like the CLI, the server leaves out record files with issues and names them, so one broken file
  // or an unfinished draft does not stop it. Answers that depend on a left-out record say so.
  const load = async () => {
    const loaded = await loadFromConfig({
      ...loadOptions,
      resolveTokens: false,
      skipInvalid: true,
    });
    return { spec: loaded, warning: leftOutWarning(loaded.issues) };
  };
  let { spec, warning } = await load();

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
      ({ spec, warning } = await load());
    } catch (error) {
      // A config or file system error keeps the last index.
      warning = `Reload failed, so answers come from the last load: ${error.message}`;
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

/**
 * Names the record files left out of the index and their issues, or undefined when none were.
 *
 * @param {import("./validate.js").Issue[]} issues
 */
function leftOutWarning(issues) {
  if (issues.length === 0) return undefined;
  const files = [...new Set(issues.map((issue) => issue.file))];
  const { text } = ops.formatIssues(issues, 0);
  return [
    `Left out ${files.length} record file${files.length === 1 ? "" : "s"} with issues: ${files.join(", ")}. Answers do not include ${files.length === 1 ? "it" : "them"}.`,
    text.replace(/\n[^\n]*$/, ""),
  ].join("\n");
}
