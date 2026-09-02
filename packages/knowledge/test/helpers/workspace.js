import { readdir, readFile } from "node:fs/promises";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";

export const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../../..");

const defaults = {
  schemaVersion: 1,
  type: "component",
  title: "Fixture",
  summary: "A fixture record.",
  status: "draft",
  visibility: "public",
  jobs: ["design"],
  tags: ["fixture"],
  relations: {},
};

export function recordMarkdown(frontmatter, body = "Body text.") {
  const data = {
    ...defaults,
    sources: [{ kind: "authored", path: frontmatter.path ?? frontmatter.id ?? "content/fixture.md" }],
    ...frontmatter,
  };
  delete data.path;
  return `---\n${yaml.dump(data, { lineWidth: 100, noRefs: true })}---\n\n${body}\n`;
}

export function createMemoryReader(files) {
  return {
    async listRecords(root) {
      const prefix = root.root.replaceAll("\\", "/").replace(/\/$/, "");
      return Object.keys(files)
        .filter((path) => path.endsWith(".md") && (path === prefix || path.startsWith(`${prefix}/`)))
        .sort((left, right) => left.localeCompare(right));
    },
    async readText(repoPath) {
      const value = files[repoPath];
      if (value == null) return null;
      return typeof value === "string" ? value : new TextDecoder().decode(value);
    },
    async readBytes(repoPath) {
      const value = files[repoPath];
      if (value == null) return null;
      return typeof value === "string" ? new TextEncoder().encode(value) : value;
    },
  };
}

export function createFsReader(workspaceRoot) {
  return {
    async listRecords(root) {
      const paths = [];

      async function walk(dir) {
        let entries;
        try {
          entries = await readdir(dir, { withFileTypes: true });
        } catch {
          return;
        }
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
      try {
        return await readFile(join(workspaceRoot, repoPath), "utf8");
      } catch {
        return null;
      }
    },
    async readBytes(repoPath) {
      try {
        return new Uint8Array(await readFile(join(workspaceRoot, repoPath)));
      } catch {
        return null;
      }
    },
  };
}

export function codes(corpus, code) {
  return corpus.problems.filter((problem) => problem.code === code);
}

export const tinySvg = `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10"></svg>\n`;
