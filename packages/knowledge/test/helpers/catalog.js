import { buildCorpus } from "../../src/compile/corpus.js";
import { projectBundle } from "../../src/compile/bundle.js";
import { NARRATIVE_FRONTMATTER_KEYS } from "../../src/compile/tables.js";
import { compiledSchema } from "../../src/schema/compiled-record.js";
import { createMemoryReader, recordMarkdown } from "./workspace.js";

/** Compiled-record fields that the narrative exporter must not emit as frontmatter. */
export function recordOnlyCompiledFields() {
  const names = new Set(Object.keys(compiledSchema.properties));
  for (const clause of compiledSchema.allOf ?? []) {
    for (const key of Object.keys(clause.then?.properties ?? {})) {
      names.add(key);
    }
  }
  names.delete("body");
  for (const key of NARRATIVE_FRONTMATTER_KEYS) names.delete(key);
  return [...names].sort();
}

export const META = {
  knowledgeVersion: "0.0.1",
  designSystemVersion: "0.0.5",
  buildTime: new Date(0),
  revision: "test",
};

export function authored(path, fields, body) {
  return recordMarkdown({ sources: [{ kind: "authored", path }], ...fields }, body);
}

export function stubRecord(id, fields = {}) {
  return {
    id,
    schemaVersion: 1,
    compiledSchemaVersion: 7,
    sources: [{ kind: "authored", path: `content/${id}.md`, revision: "fixture" }],
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
    bodyOrigin: "authored",
    ...fields,
  };
}

export function stubManifest(recordCount, files = []) {
  return {
    content: {
      schemaVersion: 1,
      compiledSchemaVersion: 7,
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
