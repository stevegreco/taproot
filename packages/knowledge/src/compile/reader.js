import { readFile, readdir } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import { safeJoinWorkspace } from "./paths.js";

/**
 * @param {string} workspaceRoot
 * @returns {import("./index.js").WorkspaceReader}
 */
export function createWorkspaceReader(workspaceRoot) {
  return {
    async listRecords(root) {
      const paths = [];

      async function walk(dir) {
        const entries = await readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
          const absolute = join(dir, entry.name);
          if (entry.isDirectory()) {
            await walk(absolute);
            continue;
          }
          if (entry.name.endsWith(".md")) {
            paths.push(relative(workspaceRoot, absolute).split(sep).join("/"));
          }
        }
      }

      await walk(root.root);
      return paths.sort((left, right) => left.localeCompare(right));
    },
    async readText(repoPath) {
      const absolute = safeJoinWorkspace(workspaceRoot, repoPath);
      if (!absolute) return null;
      try {
        return await readFile(absolute, "utf8");
      } catch (error) {
        if (error && error.code === "ENOENT") return null;
        throw error;
      }
    },
    async readBytes(repoPath) {
      const absolute = safeJoinWorkspace(workspaceRoot, repoPath);
      if (!absolute) return null;
      try {
        return new Uint8Array(await readFile(absolute));
      } catch {
        return null;
      }
    },
  };
}
