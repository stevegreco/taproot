import { PROBLEM, problem } from "./tables.js";
import { COMPILED_SCHEMA_VERSION } from "../schema/compiled-extensions.js";

export function assembleRecord(authored, contribution, assets) {
  const record = {
    id: authored.id,
    schemaVersion: authored.schemaVersion,
    compiledSchemaVersion: COMPILED_SCHEMA_VERSION,
    type: authored.type,
    title: authored.title,
    summary: authored.summary,
    status: authored.status,
    visibility: authored.visibility,
    jobs: authored.jobs,
    tags: authored.tags,
    relations: authored.relations,
    sources: contribution.sources,
    body: authored.body,
  };

  if (authored.checks) record.checks = authored.checks;
  if (assets.length > 0) record.assets = assets;
  if (authored.annotations) record.annotations = authored.annotations;
  if (authored.contract) record.contract = authored.contract;
  if (authored.host) record.host = authored.host;
  if (authored.tokenRef) record.tokenRef = authored.tokenRef;
  if (contribution.fields.tokens) record.tokens = contribution.fields.tokens;

  return record;
}

export function checkBindingAgreement(records) {
  const problems = [];

  for (const record of records.values()) {
    if (record.type !== "binding") continue;
    const implementsIds = record.relations?.implements ?? [];
    if (implementsIds.length !== 1) {
      problems.push(
        problem({
          code: PROBLEM.SOURCE_CONFLICT,
          message: `${record.id} must implement exactly one component`,
          recordId: record.id,
          path: "/relations/implements",
        }),
      );
      continue;
    }

    const target = records.get(implementsIds[0]);
    if (!target || target.type !== "component" || !target.contract) {
      problems.push(
        problem({
          code: PROBLEM.SOURCE_CONFLICT,
          message: `${record.id} must implement a component that has a contract`,
          recordId: record.id,
          path: "/relations/implements",
        }),
      );
      continue;
    }

    const host = record.host ?? {};
    const contract = target.contract;
    problems.push(
      ...bijectionProblems(
        record.id,
        "anatomy",
        namesOfList(contract.anatomy),
        namesOfMap(host.anatomy),
      ),
    );
    problems.push(
      ...bijectionProblems(
        record.id,
        "parameters",
        namesOfMap(contract.parameters),
        namesOfMap(host.parameters),
      ),
    );
    problems.push(
      ...bijectionProblems(
        record.id,
        "events",
        namesOfMap(contract.events),
        namesOfMap(host.events),
      ),
    );

    for (const [name, portable] of Object.entries(contract.parameters ?? {})) {
      const mapped = host.parameters?.[name];
      if (!mapped?.values || portable.kind !== "enum") continue;
      for (const value of Object.keys(portable.values ?? {})) {
        if (!Object.hasOwn(mapped.values, value)) {
          problems.push(
            problem({
              code: PROBLEM.SOURCE_CONFLICT,
              message: `${record.id} host parameter ${name} is missing enum value ${value}`,
              recordId: record.id,
              path: `/host/parameters/${name}/values`,
            }),
          );
        }
      }
    }
  }

  return problems;
}

function namesOfList(items) {
  return new Set((items ?? []).map((item) => item.name));
}

function namesOfMap(object) {
  return new Set(Object.keys(object ?? {}));
}

function bijectionProblems(recordId, label, expected, actual) {
  const problems = [];
  for (const name of expected) {
    if (!actual.has(name)) {
      problems.push(
        problem({
          code: PROBLEM.SOURCE_CONFLICT,
          message: `${recordId} host ${label} is missing ${name}`,
          recordId,
          path: `/host/${label}`,
        }),
      );
    }
  }
  for (const name of actual) {
    if (!expected.has(name)) {
      problems.push(
        problem({
          code: PROBLEM.SOURCE_CONFLICT,
          message: `${recordId} host ${label} has unknown ${name}`,
          recordId,
          path: `/host/${label}`,
        }),
      );
    }
  }
  return problems;
}

const CONFIGURATION_EXTRAS = Object.freeze({
  prefersReducedMotion: Object.freeze(["reduce"]),
});

export function checkSourceAgreement(record, tokenNames = new Set()) {
  const problems = [];
  const tokens = record.tokens;
  if (tokens) {
    const namespace = tokens.namespace;
    const prefix = `${namespace}.`;
    const inNamespace = tokens.entries.filter(
      (entry) => entry.name === namespace || entry.name.startsWith(prefix),
    );
    if (inNamespace.length === 0) {
      problems.push(
        problem({
          code: PROBLEM.SOURCE_CONFLICT,
          message: `token namespace ${namespace} is missing from the token source`,
          recordId: record.id,
          path: "/tokens/namespace",
        }),
      );
    }
  }

  problems.push(...checkMappingAgreement(record, tokenNames));
  return problems;
}

export function checkMappingAgreement(record, tokenNames = new Set()) {
  const mappings = record.contract?.mappings;
  if (!Array.isArray(mappings) || mappings.length === 0) return [];

  const problems = [];
  const parts = new Set((record.contract.anatomy ?? []).map((item) => item.name));
  const states = new Set(record.contract.states ?? []);
  const parameters = record.contract.parameters ?? {};

  for (const [index, mapping] of mappings.entries()) {
    const path = `/contract/mappings/${index}`;
    if (!parts.has(mapping.part)) {
      problems.push(
        problem({
          code: PROBLEM.SOURCE_CONFLICT,
          message: `mapping part ${mapping.part} is not in anatomy`,
          recordId: record.id,
          path: `${path}/part`,
        }),
      );
    }
    if (mapping.state && !states.has(mapping.state)) {
      problems.push(
        problem({
          code: PROBLEM.SOURCE_CONFLICT,
          message: `mapping state ${mapping.state} is not in contract.states`,
          recordId: record.id,
          path: `${path}/state`,
        }),
      );
    }
    for (const [key, value] of Object.entries(mapping.configuration ?? {})) {
      if (Object.hasOwn(CONFIGURATION_EXTRAS, key)) {
        if (!CONFIGURATION_EXTRAS[key].includes(value)) {
          problems.push(
            problem({
              code: PROBLEM.SOURCE_CONFLICT,
              message: `mapping configuration ${key} has unknown value ${value}`,
              recordId: record.id,
              path: `${path}/configuration/${key}`,
            }),
          );
        }
        continue;
      }
      const parameter = parameters[key];
      if (!parameter) {
        problems.push(
          problem({
            code: PROBLEM.SOURCE_CONFLICT,
            message: `mapping configuration ${key} is not a contract parameter`,
            recordId: record.id,
            path: `${path}/configuration/${key}`,
          }),
        );
        continue;
      }
      if (parameter.kind === "enum" && !Object.hasOwn(parameter.values ?? {}, value)) {
        problems.push(
          problem({
            code: PROBLEM.SOURCE_CONFLICT,
            message: `mapping configuration ${key} has unknown value ${value}`,
            recordId: record.id,
            path: `${path}/configuration/${key}`,
          }),
        );
      }
    }
    if (mapping.token?.name && !tokenNames.has(mapping.token.name)) {
      problems.push(
        problem({
          code: PROBLEM.SOURCE_CONFLICT,
          message: `mapped token ${mapping.token.name} is missing from the token package`,
          recordId: record.id,
          path: `${path}/token/name`,
        }),
      );
    }
  }

  return problems;
}

export function completenessProblems(record) {
  const problems = [];

  if (record.type === "example") {
    const hasAssets = Array.isArray(record.assets) && record.assets.length > 0;
    const hasAnnotations = Array.isArray(record.annotations) && record.annotations.length > 0;
    if (!hasAssets || !hasAnnotations) {
      problems.push(
        problem({
          code: PROBLEM.CORPUS_INCOMPLETE_EXAMPLE,
          message: `${record.id} needs at least one asset and one annotation`,
          recordId: record.id,
        }),
      );
    }
  }

  if (record.type === "guideline" && record.jobs.includes("review")) {
    if (!Array.isArray(record.checks) || record.checks.length === 0) {
      problems.push(
        problem({
          code: PROBLEM.CORPUS_INCOMPLETE_CHECKS,
          message: `${record.id} review guideline needs at least one check`,
          recordId: record.id,
        }),
      );
    }
  }

  return problems;
}
