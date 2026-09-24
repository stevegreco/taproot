import { PROBLEM, problem } from "./tables.js";
import { COMPILED_SCHEMA_VERSION } from "../schema/compiled-extensions.js";
import hostBindingSchema from "../schema/host-binding.schema.json" with { type: "json" };

const HOST_KEYS = Object.freeze(Object.keys(hostBindingSchema.properties));

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
  if (authored.docsSections) record.docsSections = authored.docsSections;
  if (authored.variantGuidance) record.variantGuidance = authored.variantGuidance;
  if (assets.length > 0) record.assets = assets;
  if (authored.annotations) record.annotations = authored.annotations;
  if (authored.contract) record.contract = authored.contract;
  if (authored.host) record.host = authored.host;
  if (authored.tokenRef) record.tokenRef = authored.tokenRef;
  if (contribution.fields.tokens) record.tokens = contribution.fields.tokens;

  return record;
}

/**
 * Fill each binding's parameter and part maps from the contract it implements.
 * Authored bindings list only exceptions. A parameter with no entry maps to
 * attribute kebab-case(name) and property name; an entry is the whole mapping,
 * so `{ attribute: full-width }` alone means there is no property. A part with
 * no entry uses its anatomy description. Compiled records carry the resolved
 * maps, so consumers never apply these defaults themselves.
 */
export function resolveBindingDefaults(records) {
  const problems = [];

  for (const [id, record] of records) {
    if (record.type !== "binding" || record.host == null) continue;
    const target = records.get(record.relations?.implements?.[0]);
    // checkBindingAgreement reports a binding without a component contract.
    if (target?.type !== "component" || !target.contract) continue;

    const host = record.host;
    const contract = target.contract;
    const parameters = {};
    for (const name of Object.keys(contract.parameters ?? {})) {
      parameters[name] = host.parameters?.[name] ?? { attribute: kebabCase(name), property: name };
    }
    for (const [name, mapped] of Object.entries(host.parameters ?? {})) {
      // Not a contract parameter. checkBindingAgreement reports it.
      if (!Object.hasOwn(parameters, name)) parameters[name] = mapped;
    }

    const descriptions = new Map(
      (contract.anatomy ?? []).map((part) => [part.name, part.description]),
    );
    const parts = {};
    for (const [name, anatomy] of Object.entries(host.anatomy ?? {})) {
      if (!anatomy.part) continue;
      const description = host.parts?.[anatomy.part]?.description ?? descriptions.get(name);
      if (description) parts[anatomy.part] = { description };
    }
    for (const name of Object.keys(host.parts ?? {})) {
      if (Object.hasOwn(parts, name)) continue;
      problems.push(
        problem({
          code: PROBLEM.SOURCE_CONFLICT,
          message: `${id} host parts has unknown ${name}`,
          recordId: id,
          path: "/host/parts",
        }),
      );
    }

    const resolved = { ...host, parameters, parts };
    if (Object.keys(parts).length === 0) delete resolved.parts;
    records.set(id, { ...record, host: inSchemaOrder(resolved) });
  }

  return problems;
}

function inSchemaOrder(host) {
  return Object.fromEntries(
    HOST_KEYS.filter((key) => Object.hasOwn(host, key)).map((key) => [key, host[key]]),
  );
}

function kebabCase(name) {
  return name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
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

const BOOLEAN_CONFIGURATION_VALUES = Object.freeze(["true", "false"]);

export function checkSourceAgreement(record, tokenNames = null) {
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

export function checkMappingAgreement(record, tokenNames = null) {
  const mappings = record.contract?.mappings;
  if (!Array.isArray(mappings) || mappings.length === 0) return [];

  const problems = [];
  const parts = new Set((record.contract.anatomy ?? []).map((item) => item.name));
  const states = new Set(record.contract.states ?? []);
  const parameters = record.contract.parameters ?? {};
  const configurationAxes = record.contract.configurationAxes ?? {};
  const seen = new Map();

  for (const [index, mapping] of mappings.entries()) {
    const path = mapping.source ?? `/contract/mappings/${index}`;
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
      const allowed = configurationValues(key, parameters, configurationAxes);
      if (!allowed) {
        problems.push(
          problem({
            code: PROBLEM.SOURCE_CONFLICT,
            message: `mapping configuration ${key} is not a contract parameter or configuration axis`,
            recordId: record.id,
            path: `${path}/configuration/${key}`,
          }),
        );
        continue;
      }
      if (!allowed.has(value)) {
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
    if (mapping.token?.name && tokenNames != null && !tokenNames.has(mapping.token.name)) {
      problems.push(
        problem({
          code: PROBLEM.SOURCE_CONFLICT,
          message: `mapped token ${mapping.token.name} is missing from the token package`,
          recordId: record.id,
          path: `${path}/token/name`,
        }),
      );
    }

    const identity = mappingIdentity(mapping);
    const previous = seen.get(identity);
    if (previous !== undefined && previous.token !== tokenIdentity(mapping.token)) {
      problems.push(
        problem({
          code: PROBLEM.SOURCE_CONFLICT,
          message: `mapping ${mapping.part} ${mapping.channel} names both ${previous.token} and ${tokenIdentity(mapping.token)}`,
          recordId: record.id,
          path,
        }),
      );
    } else if (previous === undefined) {
      seen.set(identity, { token: tokenIdentity(mapping.token), index });
    } else {
      problems.push(
        problem({
          code: PROBLEM.SOURCE_CONFLICT,
          message: `mapping ${mapping.part} ${mapping.channel} is duplicated`,
          recordId: record.id,
          path,
        }),
      );
    }
  }

  return problems;
}

function configurationValues(key, parameters, configurationAxes) {
  if (Object.hasOwn(configurationAxes, key)) {
    return new Set(configurationAxes[key].values ?? []);
  }
  const parameter = parameters[key];
  if (!parameter) return null;
  if (parameter.kind === "enum") {
    return new Set(Object.keys(parameter.values ?? {}));
  }
  if (parameter.kind === "boolean") {
    return new Set(BOOLEAN_CONFIGURATION_VALUES);
  }
  if (parameter.kind === "string") {
    return { has: () => true };
  }
  return null;
}

function mappingIdentity(mapping) {
  const configuration = Object.entries(mapping.configuration ?? {})
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join(",");
  return `${mapping.part}\0${mapping.channel}\0${configuration}\0${mapping.state ?? ""}`;
}

function tokenIdentity(token) {
  if (token?.name) return token.name;
  if (token?.literal) return token.literal;
  return "unknown";
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

export function checkRuleReferences(record, records) {
  const problems = [];
  const contract = record.contract;
  if (contract == null || typeof contract !== "object") return problems;

  for (const { rule, path } of walkContractRules(contract)) {
    for (const [index, reference] of (rule.references ?? []).entries()) {
      if (!records.has(reference.id)) {
        problems.push(
          problem({
            code: PROBLEM.CONTRACT_UNRESOLVED_REFERENCE,
            message: `${record.id} rule ${rule.id} references unresolved record ${reference.id}`,
            recordId: record.id,
            path: `${path}/references/${index}/id`,
          }),
        );
      }
    }
  }

  return problems;
}

function* walkContractRules(contract) {
  for (const [index, rule] of (contract.content ?? []).entries()) {
    yield { rule, path: `/contract/content/${index}` };
  }
  for (const [index, rule] of (contract.behavior ?? []).entries()) {
    yield { rule, path: `/contract/behavior/${index}` };
  }
  for (const [index, rule] of (contract.accessibility?.requirements ?? []).entries()) {
    yield { rule, path: `/contract/accessibility/requirements/${index}` };
  }
}
