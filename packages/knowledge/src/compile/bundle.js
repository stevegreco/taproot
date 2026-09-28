import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import yaml from "js-yaml";
import authoredSchema from "../schema/index.js";
import { compiledSchema, findCompiledIssues } from "../schema/compiled-record.js";
import { COMPILED_SCHEMA_VERSION } from "../schema/compiled-extensions.js";
import { sha256Hex } from "./digest.js";
import { buildSearchIndex } from "./search-index.js";
import { generateReferenceSections } from "./generate-body.js";
import { rewriteEmittedMarkdownUrls } from "./narrative.js";
import { NARRATIVE_FRONTMATTER_KEYS, PROBLEM, REVERSE_RELATION, problem } from "./tables.js";
import { byCodeUnit } from "../sort.js";

export function projectBundle(corpus, visibility, meta) {
  const includedIds = [...corpus.records.keys()].filter((id) => {
    const record = corpus.records.get(id);
    return visibility === "internal" || record.visibility === "public";
  });
  const included = new Set(includedIds);

  const problems = [];
  if (visibility === "public") {
    for (const id of includedIds) {
      problems.push(...visibilityLeaks(corpus.records.get(id), included, corpus));
    }
  }

  const backlinksById = new Map(includedIds.map((id) => [id, {}]));
  for (const edge of corpus.edges) {
    if (!included.has(edge.from) || !included.has(edge.to)) continue;
    const key = REVERSE_RELATION[edge.relation];
    if (!key) continue;
    const bucket = backlinksById.get(edge.to);
    if (!bucket[key]) bucket[key] = new Set();
    bucket[key].add(edge.from);
  }

  const records = includedIds.sort(byCodeUnit).map((id) => {
    const record = corpus.records.get(id);
    const backlinks = {};
    for (const [key, values] of Object.entries(backlinksById.get(id))) {
      backlinks[key] = [...values].sort(byCodeUnit);
    }
    return { ...record, backlinks };
  });

  problems.push(...findCompiledIssues(records));

  const searchIndex = buildSearchIndex(records);
  const markdown = new Map();
  const assets = new Map();

  for (const record of records) {
    markdown.set(`markdown/${record.id}.md`, emitMarkdown(record));
    for (const asset of record.assets ?? []) {
      const bytes = corpus.assetBytes.get(asset.bundlePath);
      if (bytes) assets.set(asset.bundlePath, bytes);
    }
  }

  const files = new Map();
  putText(files, "records.json", `${JSON.stringify(records, null, 2)}\n`);
  putText(files, "search-index.json", `${JSON.stringify(searchIndex, null, 2)}\n`);
  putText(files, "schema/knowledge-record.json", `${JSON.stringify(authoredSchema, null, 2)}\n`);
  putText(
    files,
    "schema/compiled-knowledge-record.json",
    `${JSON.stringify(compiledSchema, null, 2)}\n`,
  );

  for (const [path, text] of markdown) {
    putText(files, path, text);
  }
  for (const [path, bytes] of assets) {
    files.set(path, bytes);
  }

  const listed = [...files.keys()].sort(byCodeUnit).map((path) => {
    const bytes = files.get(path);
    return { path, sha256: sha256Hex(bytes), bytes: bytes.byteLength };
  });

  const content = {
    schemaVersion: 1,
    compiledSchemaVersion: COMPILED_SCHEMA_VERSION,
    visibility,
    knowledgeVersion: meta.knowledgeVersion,
    designSystemVersion: meta.designSystemVersion,
    recordCount: records.length,
    files: listed,
  };
  const digest = `sha256:${sha256Hex(canonicalJson(content))}`;
  const manifest = {
    content,
    build: {
      time: meta.buildTime.toISOString(),
      revision: meta.revision,
      tool: {
        name: "@stevegreco/design-system-knowledge",
        version: meta.knowledgeVersion,
      },
    },
    digest,
  };
  putText(files, "manifest.json", `${JSON.stringify(manifest, null, 2)}\n`);

  return {
    visibility,
    records,
    searchIndex,
    compiledSchema,
    markdown,
    assets,
    manifest,
    files,
    problems: Object.freeze(problems),
  };
}

export async function writeBundle(dir, bundle) {
  const paths = [...bundle.files.keys()].sort(byCodeUnit);
  for (const relative of paths) {
    const absolute = join(dir, relative);
    await mkdir(dirname(absolute), { recursive: true });
    await writeFile(absolute, bundle.files.get(relative));
  }

  return {
    visibility: bundle.visibility,
    dir,
    recordCount: bundle.records.length,
    digest: bundle.manifest.digest,
  };
}

function visibilityLeaks(record, included, corpus) {
  const problems = [];

  function leak(target, path) {
    if (!corpus.records.has(target) || included.has(target)) return;
    problems.push(
      problem({
        code: PROBLEM.VISIBILITY_LEAK,
        message: `${record.id} references internal ${target}`,
        recordId: record.id,
        path,
      }),
    );
  }

  for (const [relation, targets] of Object.entries(record.relations ?? {})) {
    for (const to of targets ?? []) leak(to, `/relations/${relation}`);
  }
  for (const annotation of record.annotations ?? []) {
    for (const to of annotation.relatesTo ?? []) {
      leak(to, `/annotations/${annotation.id}/relatesTo`);
    }
  }
  const authoredPath = record.sources.find((source) => source.kind === "authored")?.path ?? null;
  for (const reference of corpus.narrativeReferences.get(record.id) ?? []) {
    if (reference.kind === "record") {
      leak(reference.target, authoredPath);
      continue;
    }
    const owner = corpus.assetOwner.get(reference.target);
    if (!owner || included.has(owner)) continue;
    problems.push(
      problem({
        code: PROBLEM.VISIBILITY_LEAK,
        message: `${record.id} references internal ${reference.target}`,
        recordId: record.id,
        path: authoredPath,
      }),
    );
  }

  return problems;
}

function projectNarrativeFrontmatter(record) {
  const frontmatter = {};
  for (const key of NARRATIVE_FRONTMATTER_KEYS) {
    frontmatter[key] = record[key];
  }
  return frontmatter;
}

function emitMarkdown(record) {
  const frontmatter = projectNarrativeFrontmatter(record);
  const body = rewriteEmittedMarkdownUrls(
    [record.body, ...generateReferenceSections(record)].join("\n\n"),
  );
  return `---\n${yaml.dump(frontmatter, { lineWidth: 120, noRefs: true, sortKeys: true })}---\n\n${body}\n`;
}

function putText(files, path, text) {
  files.set(path, new TextEncoder().encode(text));
}

function canonicalJson(value) {
  return JSON.stringify(sortKeys(value));
}

function sortKeys(value) {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, sortKeys(value[key])]),
    );
  }
  return value;
}
