import { loadCorpusInputs } from "./inputs.js";
import {
  assembleRecord,
  checkBindingAgreement,
  checkSourceAgreement,
  completenessProblems,
} from "./records.js";
import { rewriteBodyLinks } from "./narrative.js";
import { PROBLEM, problem } from "./tables.js";

export { CONTRIBUTORS } from "./inputs.js";
export { sha256Hex, shortRevision } from "./digest.js";
export { PROBLEM, REVERSE_RELATION } from "./tables.js";

/** Load sources, then transform and validate plain record data (KNOW-023, KNOW-025). */
export async function buildCorpus(reader, roots, options = {}) {
  return assembleCorpus(await loadCorpusInputs(reader, roots, options));
}

/** Pure corpus assembly. Does not modify the loaded inputs. */
export function assembleCorpus(loaded) {
  const records = new Map(
    [...loaded.inputs].map(([id, input]) => [
      id,
      assembleRecord(input.authored, input.contribution, input.assets),
    ]),
  );
  const validation = validateRelations(records);
  const problems = [
    ...loaded.problems,
    ...[...records.values()].flatMap((record) => [
      ...checkSourceAgreement(record, loaded.tokenNames),
      ...completenessProblems(record),
    ]),
    ...checkBindingAgreement(records),
    ...validation.problems,
  ];
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
    problems.push(...rewritten.problems);
  }
  return {
    records: new Map([...rewrittenRecords].sort(([left], [right]) => left.localeCompare(right))),
    edges: Object.freeze(validation.edges),
    narrativeReferences,
    assetBytes: loaded.assetBytes,
    assetOwner: loaded.assetOwner,
    problems: Object.freeze(problems),
  };
}

function validateRelations(records) {
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
    left.from.localeCompare(right.from) ||
    left.relation.localeCompare(right.relation) ||
    left.to.localeCompare(right.to)
  );
}
