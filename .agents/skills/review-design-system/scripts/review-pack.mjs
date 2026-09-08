#!/usr/bin/env node
/**
 * Build a frozen review pack from a compiled knowledge bundle.
 *
 * The pack is a projection of catalog records for the review job. It is not a
 * second copy of design system facts (KNOW-026).
 */

import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { openCatalog } from "../../../../packages/knowledge/src/retrieve/index.js";

const SUBJECTS = new Set(["design-artifact", "source", "rendered"]);

const USAGE = `Usage: node review-pack.mjs [options]

Build a frozen review pack from the compiled Ember & Sage knowledge bundle.

Options:
  --subject <class>   design-artifact | source | rendered (default: design-artifact)
  --id <record-id>    seed record (repeatable)
  --query <text>      catalog search seed
  --hops <n>          related-record hops from seeds (default: 1)
  --bundle <dir>      compiled bundle directory (default: package dist/public)
  --help              print this message
`;

/**
 * @typedef {object} PackOptions
 * @property {string[]} ids
 * @property {string} query
 * @property {number} hops
 * @property {"design-artifact"|"source"|"rendered"} subject
 * @property {string|undefined} bundle
 * @property {boolean} help
 */

/**
 * @param {string[]} argv
 * @returns {PackOptions}
 */
export function parseArgs(argv) {
  /** @type {PackOptions} */
  const options = {
    ids: [],
    query: "",
    hops: 1,
    subject: "design-artifact",
    bundle: undefined,
    help: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    switch (arg) {
      case "--help":
      case "-h":
        options.help = true;
        break;
      case "--id":
        options.ids.push(requireValue(argv, index + 1, arg));
        index += 1;
        break;
      case "--query":
        options.query = requireValue(argv, index + 1, arg);
        index += 1;
        break;
      case "--hops": {
        const raw = requireValue(argv, index + 1, arg);
        const hops = Number(raw);
        if (!Number.isInteger(hops) || hops < 0) {
          throw new Error(`--hops must be a non-negative integer (got ${raw})`);
        }
        options.hops = hops;
        index += 1;
        break;
      }
      case "--subject": {
        const subject = requireValue(argv, index + 1, arg);
        if (!SUBJECTS.has(subject)) {
          throw new Error(`--subject must be one of ${[...SUBJECTS].join(", ")}`);
        }
        options.subject = /** @type {PackOptions["subject"]} */ (subject);
        index += 1;
        break;
      }
      case "--bundle":
        options.bundle = requireValue(argv, index + 1, arg);
        index += 1;
        break;
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return options;
}

/**
 * @param {string[]} argv
 * @param {number} index
 * @param {string} flag
 */
function requireValue(argv, index, flag) {
  const value = argv[index];
  if (value === undefined || value.startsWith("--")) {
    throw new Error(`${flag} requires a value`);
  }
  return value;
}

/**
 * @param {Awaited<ReturnType<typeof openCatalog>>} catalog
 * @param {Omit<PackOptions, "help"|"bundle">} options
 */
export function buildReviewPack(catalog, options) {
  const seeds = collectSeeds(catalog, options);
  const included = expandRelated(catalog, seeds, options.hops);
  attachReviewGuidelines(catalog, included);

  if (options.subject === "design-artifact") {
    for (const [id, record] of [...included]) {
      const jobs = record.jobs ?? [];
      if (!jobs.includes("design") && !jobs.includes("review")) {
        included.delete(id);
      }
    }
  }

  const records = [...included.values()]
    .sort((left, right) => (left.id < right.id ? -1 : left.id > right.id ? 1 : 0))
    .map((record) => projectRecord(record, options.subject));

  const checks = records.flatMap((record) =>
    (record.checks ?? []).map((check) => ({
      id: check.id,
      level: check.level,
      requirement: check.requirement,
      recordId: record.id,
      recordStatus: record.status,
    })),
  );

  return {
    kind: "design-system-review-pack",
    schemaVersion: 1,
    subject: options.subject,
    catalog: {
      visibility: catalog.info.visibility,
      digest: catalog.info.digest,
      knowledgeVersion: catalog.info.knowledgeVersion,
      designSystemVersion: catalog.info.designSystemVersion,
      schemaVersion: catalog.info.schemaVersion,
      compiledSchemaVersion: catalog.info.compiledSchemaVersion,
      recordCount: catalog.info.recordCount,
      revision: catalog.info.revision,
      builtAt: catalog.info.builtAt,
    },
    seeds: [...seeds].sort(),
    records,
    checks,
    coverage: coverageNotes(catalog, included),
  };
}

/**
 * @param {Awaited<ReturnType<typeof openCatalog>>} catalog
 * @param {Pick<PackOptions, "ids"|"query">} options
 * @returns {Set<string>}
 */
function collectSeeds(catalog, options) {
  const seeds = new Set();

  for (const id of options.ids) {
    const record = catalog.get(id);
    if (!record) {
      throw new Error(`${id} is not in this catalog`);
    }
    seeds.add(id);
  }

  if (options.query) {
    for (const hit of catalog.search(options.query)) {
      seeds.add(hit.record.id);
    }
    if (seeds.size === 0) {
      throw new Error(`No catalog records matched query ${JSON.stringify(options.query)}`);
    }
  }

  if (seeds.size === 0) {
    for (const record of catalog.list({ jobs: "review" })) {
      seeds.add(record.id);
    }
  }

  return seeds;
}

/**
 * @param {Awaited<ReturnType<typeof openCatalog>>} catalog
 * @param {Set<string>} seeds
 * @param {number} hops
 * @returns {Map<string, object>}
 */
function expandRelated(catalog, seeds, hops) {
  const included = new Map();
  let frontier = [...seeds];

  for (let hop = 0; hop <= hops; hop += 1) {
    const next = [];
    for (const id of frontier) {
      if (included.has(id)) continue;
      const record = catalog.get(id);
      if (!record) continue;
      included.set(id, record);
      if (hop === hops) continue;
      for (const neighbor of catalog.related(id)) {
        next.push(neighbor.record.id);
      }
    }
    frontier = next;
  }

  return included;
}

/**
 * @param {Awaited<ReturnType<typeof openCatalog>>} catalog
 * @param {Map<string, object>} included
 */
function attachReviewGuidelines(catalog, included) {
  for (const guideline of catalog.list({ type: "guideline", jobs: "review" })) {
    const targets = guideline.relations?.reviews ?? [];
    if (targets.some((id) => included.has(id))) {
      included.set(guideline.id, guideline);
    }
  }
}

/**
 * @param {object} record
 * @param {PackOptions["subject"]} subject
 */
export function projectRecord(record, subject) {
  const projected = {
    id: record.id,
    type: record.type,
    title: record.title,
    summary: record.summary,
    status: record.status,
    visibility: record.visibility,
    jobs: record.jobs,
    tags: record.tags,
    relations: record.relations ?? {},
    backlinks: record.backlinks ?? {},
    body: record.body,
  };

  if (Array.isArray(record.checks)) projected.checks = record.checks;
  if (record.tokenRef) projected.tokenRef = record.tokenRef;
  if (Array.isArray(record.annotations)) projected.annotations = record.annotations;
  if (Array.isArray(record.assets)) {
    projected.assets = record.assets.map((asset) => ({
      id: asset.id,
      alt: asset.alt,
      mediaType: asset.mediaType,
      bundlePath: asset.bundlePath,
      width: asset.width,
      height: asset.height,
    }));
  }

  if (record.contract) {
    projected.contract = {
      description: record.contract.description,
      usage: record.contract.usage,
      parameters: record.contract.parameters,
      states: record.contract.states,
      behavior: record.contract.behavior,
      accessibility: record.contract.accessibility,
    };
  }

  if (subject !== "design-artifact" && record.host) {
    projected.host = {
      platform: record.host.platform,
      package: record.host.package,
      defaultTagName: record.host.defaultTagName,
    };
  }

  return projected;
}

/**
 * @param {Awaited<ReturnType<typeof openCatalog>>} catalog
 * @param {Map<string, object>} included
 */
function coverageNotes(catalog, included) {
  const byStatus = { draft: 0, accepted: 0, deprecated: 0, superseded: 0 };
  for (const record of catalog.list()) {
    byStatus[record.status] += 1;
  }

  const componentsWithoutReviewGuideline = catalog
    .list({ type: "component" })
    .filter((record) => !record.backlinks?.reviewedBy?.length)
    .map((record) => record.id);

  const patternsWithoutReviewGuideline = catalog
    .list({ type: "pattern" })
    .filter((record) => !record.backlinks?.reviewedBy?.length)
    .map((record) => record.id);

  return {
    packRecordCount: included.size,
    catalogStatusCounts: byStatus,
    componentsWithoutReviewGuideline,
    patternsWithoutReviewGuideline,
  };
}

/**
 * @param {string[]} argv
 */
export async function main(argv = process.argv.slice(2)) {
  const options = parseArgs(argv);
  if (options.help) {
    process.stdout.write(USAGE);
    return 0;
  }

  const catalog = options.bundle
    ? await openCatalog(options.bundle)
    : await openCatalog();
  const pack = buildReviewPack(catalog, options);
  process.stdout.write(`${JSON.stringify(pack, null, 2)}\n`);
  return 0;
}

const executedDirectly =
  Boolean(process.argv[1]) && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (executedDirectly) {
  main().then(
    (code) => {
      process.exitCode = code;
    },
    (error) => {
      process.stderr.write(`${error instanceof Error ? error.message : error}\n`);
      process.exitCode = 1;
    },
  );
}
