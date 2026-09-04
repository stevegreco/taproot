import { buildCorpus } from "../../src/compile/corpus.js";
import { projectBundle } from "../../src/compile/bundle.js";
import { createMemoryReader, recordMarkdown } from "./workspace.js";

export const META = {
  knowledgeVersion: "0.0.1",
  designSystemVersion: "0.0.5",
  buildTime: new Date(0),
  revision: "test",
};

export function authored(path, fields, body) {
  return recordMarkdown(
    { sources: [{ kind: "authored", path }], ...fields },
    body,
  );
}

export function stubRecord(id, fields = {}) {
  return {
    id,
    type: "component",
    title: "Title",
    summary: "Summary text.",
    status: "draft",
    visibility: "public",
    jobs: ["design"],
    tags: ["fixture"],
    relations: {},
    backlinks: {},
    body: "Body text.",
    ...fields,
  };
}

export function stubManifest(recordCount, files = []) {
  return {
    content: {
      schemaVersion: 1,
      compiledSchemaVersion: 3,
      visibility: "public",
      knowledgeVersion: META.knowledgeVersion,
      designSystemVersion: META.designSystemVersion,
      recordCount,
      files,
    },
    build: {
      time: META.buildTime.toISOString(),
      revision: META.revision,
    },
    digest: "sha256:test",
  };
}

export function stubIndex(records, terms = {}) {
  return {
    version: 1,
    records: records.map((record) => record.id),
    terms,
  };
}

/**
 * @param {Record<string, string>} files
 * @param {"public"|"internal"} [visibility]
 */
export async function projectFiles(files, visibility = "public") {
  const reader = createMemoryReader(files);
  const roots = [{ root: "content", visibility: "public" }];
  if (Object.keys(files).some((path) => path.startsWith("internal/"))) {
    roots.push({ root: "internal", visibility: "internal" });
  }
  const corpus = await buildCorpus(reader, roots);
  return projectBundle(corpus, visibility, META);
}
