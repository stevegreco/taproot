import { loadCorpusInputs } from "./inputs.js";
import {
  assembleRecord,
  checkBindingAgreement,
  checkRuleReferences,
  checkSourceAgreement,
  checkVariantGuidance,
  completenessProblems,
  resolveBindingDefaults,
} from "./records.js";
import { generateComponentBody } from "./generate-body.js";
import { rewriteBodyLinks } from "./narrative.js";
import { PROBLEM, problem } from "./tables.js";
import { compileContractVisuals, stripMappingSources } from "./visuals.js";
import { byCodeUnit } from "../sort.js";
import { recordLocator } from "../index.js";

export { CONTRIBUTORS } from "./inputs.js";
export { sha256Hex, shortRevision } from "./digest.js";
export { PROBLEM, REVERSE_RELATION } from "./tables.js";

/** Load sources, then transform and validate plain record data (KNOW-023, KNOW-025). */
export async function buildCorpus(reader, roots, options = {}) {
  return assembleCorpus(await loadCorpusInputs(reader, roots, options));
}

/** Pure corpus assembly. Does not modify the loaded inputs. */
export function assembleCorpus(loaded) {
  const visualProblems = [];
  const records = new Map(
    [...loaded.inputs].map(([id, input]) => {
      const record = assembleRecord(input.authored, input.contribution, input.assets);
      if (record.contract) {
        const expanded = compileContractVisuals(record.contract, id);
        record.contract = expanded.contract;
        visualProblems.push(...expanded.problems);
      }
      if (typeof record.body === "string" && record.body.length > 0) {
        record.bodyOrigin = "authored";
      } else {
        record.body = generateComponentBody(record);
        record.bodyOrigin = "generated";
      }
      return [id, record];
    }),
  );
  const bindingProblems = resolveBindingDefaults(records);
  const invalidIds = loaded.invalidIds ?? new Set();
  const validation = validateRelations(records, invalidIds);
  const problems = [
    ...loaded.problems,
    ...visualProblems,
    ...bindingProblems,
    ...[...records.values()].flatMap((record) => [
      ...checkSourceAgreement(record, loaded.tokenNames),
      ...checkRuleReferences(record, records, invalidIds),
      ...completenessProblems(record),
    ]),
    ...checkBindingAgreement(records, invalidIds),
    ...checkVariantGuidance(records, invalidIds),
    ...validation.problems,
  ];
  // visualMapping.additionalProperties is false, so compiler-only `source`
  // paths must come off after checkMappingAgreement and before compiled output.
  for (const record of records.values()) {
    stripMappingSources(record.contract);
  }
  const rewrittenRecords = new Map();
  const narrativeReferences = new Map();
  for (const [id, record] of records) {
    const rewritten = rewriteBodyLinks(record.body, {
      recordIdByPath: loaded.recordIdByPath,
      assetPathToBundlePath: loaded.assetPathToBundlePath,
      authoredPath: loaded.listedPathById.get(id),
      recordId: id,
    });
    rewrittenRecords.set(id, { ...record, body: rewritten.body });
    narrativeReferences.set(id, rewritten.references);
    // Generated bodies link only to rule references, which checkRuleReferences already reports.
    if (record.bodyOrigin === "authored") problems.push(...rewritten.problems);
  }
  return {
    records: new Map([...rewrittenRecords].sort(([left], [right]) => byCodeUnit(left, right))),
    edges: Object.freeze(validation.edges),
    narrativeReferences,
    assetBytes: loaded.assetBytes,
    assetOwner: loaded.assetOwner,
    problems: Object.freeze(locateProblems(problems, loaded)),
  };
}

/**
 * Give each record problem its file, and its line when the path is a JSON Pointer, in the
 * same `file:line /pointer` form that parse errors use.
 */
function locateProblems(problems, loaded) {
  const locators = new Map();
  return problems.map((item) => {
    const file = item.recordId ? loaded.listedPathById.get(item.recordId) : undefined;
    if (!file) return item;
    if (item.path == null || item.path === "") return { ...item, path: file };
    if (!item.path.startsWith("/")) return item;
    if (!locators.has(file)) {
      const text = loaded.textByPath?.get(file);
      locators.set(file, text == null ? () => null : recordLocator(text, file));
    }
    const line = locators.get(file)(item.path);
    return { ...item, path: `${line ? `${file}:${line}` : file} ${item.path}` };
  });
}

/** References to a record that already failed validation are not reported again. */
function validateRelations(records, invalidIds) {
  const problems = [];
  const edges = [];
  for (const record of records.values()) {
    for (const [relation, targets] of Object.entries(record.relations ?? {})) {
      for (const to of targets ?? []) {
        if (to === record.id) {
          problems.push(
            problem({
              code: PROBLEM.CORPUS_SELF_RELATION,
              message: `${record.id} ${relation} itself`,
              recordId: record.id,
              path: `/relations/${relation}`,
            }),
          );
          continue;
        }
        if (!records.has(to)) {
          if (invalidIds.has(to)) continue;
          problems.push(
            problem({
              code: PROBLEM.CORPUS_UNRESOLVED_RELATION,
              message: `${record.id} ${relation} unresolved target ${to}`,
              recordId: record.id,
              path: `/relations/${relation}`,
            }),
          );
          continue;
        }
        edges.push({ from: record.id, relation, to });
      }
    }

    for (const annotation of record.annotations ?? []) {
      for (const to of annotation.relatesTo ?? []) {
        if (!records.has(to)) {
          if (invalidIds.has(to)) continue;
          problems.push(
            problem({
              code: PROBLEM.CORPUS_UNRESOLVED_ANNOTATION,
              message: `${record.id} annotation ${annotation.id} relatesTo unresolved target ${to}`,
              recordId: record.id,
              path: `/annotations/${annotation.id}/relatesTo`,
            }),
          );
        }
      }
    }
  }

  return { edges: edges.sort(compareEdges), problems };
}

function compareEdges(left, right) {
  return (
    byCodeUnit(left.from, right.from) ||
    byCodeUnit(left.relation, right.relation) ||
    byCodeUnit(left.to, right.to)
  );
}
