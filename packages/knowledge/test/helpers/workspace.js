import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";
import { createWorkspaceReader } from "../../src/compile/reader.js";

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

export function recordYaml(fields) {
  const data = {
    ...defaults,
    sources: [{ kind: "authored", path: fields.path ?? fields.id ?? "content/fixture.spec.yaml" }],
    ...fields,
  };
  delete data.path;
  delete data.body;
  return yaml.dump(data, { lineWidth: 100, noRefs: true });
}

export function recordMarkdown(frontmatter, body = "Body text.") {
  const data = {
    ...defaults,
    sources: [
      { kind: "authored", path: frontmatter.path ?? frontmatter.id ?? "content/fixture.md" },
    ],
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
        .filter(
          (path) =>
            (path.endsWith(".md") || path.endsWith(".spec.yaml")) &&
            (path === prefix || path.startsWith(`${prefix}/`)),
        )
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
  return createWorkspaceReader(workspaceRoot);
}

export function codes(corpus, code) {
  return corpus.problems.filter((problem) => problem.code === code);
}

export function portableContract(overrides = {}) {
  return {
    description: "A fixture contract.",
    usage: { do: [], avoid: [] },
    anatomy: [],
    parameters: {},
    events: {},
    states: [],
    behavior: [],
    accessibility: { semantics: "None.", name: "None." },
    rationale: [],
    ...overrides,
  };
}

export const tinySvg = `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10"></svg>\n`;
