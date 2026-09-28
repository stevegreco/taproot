import { PROBLEM, problem } from "./tables.js";
import { byCodeUnit } from "../sort.js";
import { headingAnchors, subsectionAnchors } from "./anchors.js";
import { COMPILED_SCHEMA_VERSION } from "../schema/compiled-extensions.js";
import recordSchema from "../schema/knowledge-record.schema.json" with { type: "json" };

const WEB_KEYS = Object.freeze(Object.keys(recordSchema.$defs.web.properties));

/** Who each record type serves, when the record does not say. */
const DEFAULT_JOBS = Object.freeze({
  component: ["design", "implement", "review"],
  pattern: ["design", "implement", "review"],
  guideline: ["implement", "review"],
  example: ["design", "implement"],
  foundation: ["design"],
  decision: ["design"],
});

export function assembleRecord(authored, contribution, assets) {
  const record = {
    id: authored.id,
    schemaVersion: authored.schemaVersion,
    compiledSchemaVersion: COMPILED_SCHEMA_VERSION,
    type: authored.type,
    title: authored.title,
    summary: authored.summary,
    status: authored.status ?? "draft",
    visibility: authored.visibility,
    jobs: authored.jobs ?? DEFAULT_JOBS[authored.type],
    tags: recordTags(authored),
    relations: authored.related ? { related: authored.related } : {},
    sources: contribution.sources,
    body: authored.body,
  };

  if (authored.docsSections) record.docsSections = authored.docsSections;
  if (authored.variantGuidance)
    record.variantGuidance = expandVariantGuidance(authored.variantGuidance);
  if (assets.length > 0) record.assets = assets;
  if (authored.annotations) record.annotations = authored.annotations;
  if (authored.contract) record.contract = authored.contract;
  if (authored.web) record.web = authored.web;
  if (authored.tokenRef) record.tokenRef = authored.tokenRef;
  if (contribution.fields.tokens) record.tokens = contribution.fields.tokens;

  return record;
}

/**
 * Authored tags plus the record's own name and the names of the records it relates to, so
 * `component.text-field` is found by "text-field" without an author writing it.
 */
function recordTags(authored) {
  const names = [authored.id, ...(authored.related ?? [])].map((id) =>
    id.slice(id.indexOf(".") + 1).replaceAll(".", "-"),
  );
  return [...new Set([...(authored.tags ?? []), ...names])].sort(byCodeUnit);
}

/** A list of variants is shorthand for anchors named after each variant. */
function expandVariantGuidance(guidance) {
  return Object.fromEntries(
    Object.entries(guidance).map(([id, variants]) => [
      id,
      Array.isArray(variants)
        ? Object.fromEntries(variants.map((variant) => [variant, variant]))
        : variants,
    ]),
  );
}

/**
 * Each pattern's variantGuidance must name a component the pattern lists in related, a
 * variant that component's contract has, and a `###` heading with text in the
 * pattern body. A variant takes guidance from at most one pattern.
 */
export function checkVariantGuidance(records, invalidIds = new Set()) {
  const problems = [];
  const guidedBy = new Map();
  for (const record of records.values()) {
    if (!record.variantGuidance) continue;
    const report = (message) =>
      problems.push(
        problem({
          code: PROBLEM.VARIANT_GUIDANCE_INVALID,
          message: `${record.id} variantGuidance ${message}`,
          recordId: record.id,
          path: "/variantGuidance",
        }),
      );
    const anchors = subsectionAnchors(record.body ?? "");
    for (const [id, variants] of Object.entries(record.variantGuidance)) {
      if (invalidIds.has(id)) continue;
      if (!(record.relations?.related ?? []).includes(id)) {
        report(`names ${id}, which the pattern does not list in related`);
        continue;
      }
      const values = records.get(id)?.contract?.parameters?.variant?.values ?? {};
      for (const [variant, anchor] of Object.entries(variants)) {
        if (!Object.hasOwn(values, variant)) {
          report(`names ${id} variant ${variant}, which its contract does not have`);
        }
        if (!anchors.has(anchor)) {
          report(`${id}.${variant} names #${anchor}, but no ### heading with text has that anchor`);
        }
        const key = `${id} ${variant}`;
        if (guidedBy.has(key)) {
          report(`guides ${id} variant ${variant}, which ${guidedBy.get(key)} already guides`);
        }
        guidedBy.set(key, record.id);
      }
    }
  }
  return problems;
}

/**
 * Fill each component's web parameter and part maps from its contract. The `web` section
 * lists only exceptions. A parameter with no entry maps to attribute kebab-case(name) and
 * property name; an entry is the whole mapping, so `{ attribute: full-width }` alone means
 * there is no property. A part with no entry uses its anatomy description. Compiled records
 * carry the resolved maps, so consumers never apply these defaults themselves.
 */
export function resolveWebDefaults(records) {
  const problems = [];

  for (const [id, record] of records) {
    if (record.web == null || record.contract == null) continue;
    const { web, contract } = record;
    const parameters = {};
    for (const name of Object.keys(contract.parameters ?? {})) {
      parameters[name] = web.parameters?.[name] ?? { attribute: kebabCase(name), property: name };
    }
    for (const [name, mapped] of Object.entries(web.parameters ?? {})) {
      // Not a contract parameter. checkWebAgreement reports it.
      if (!Object.hasOwn(parameters, name)) parameters[name] = mapped;
    }

    const descriptions = new Map(
      (contract.anatomy ?? []).map((part) => [part.name, part.description]),
    );
    const parts = {};
    for (const [name, anatomy] of Object.entries(web.anatomy ?? {})) {
      if (!anatomy.part) continue;
      const description = web.parts?.[anatomy.part]?.description ?? descriptions.get(name);
      if (description) parts[anatomy.part] = { description };
    }
    for (const name of Object.keys(web.parts ?? {})) {
      if (Object.hasOwn(parts, name)) continue;
      problems.push(
        problem({
          code: PROBLEM.SOURCE_CONFLICT,
          message: `${id} web parts has unknown ${name}`,
          recordId: id,
          path: "/web/parts",
        }),
      );
    }

    const resolved = { ...web, parameters, parts };
    if (Object.keys(parts).length === 0) delete resolved.parts;
    records.set(id, { ...record, web: inSchemaOrder(resolved) });
  }

  return problems;
}

function inSchemaOrder(web) {
  return Object.fromEntries(
    WEB_KEYS.filter((key) => Object.hasOwn(web, key)).map((key) => [key, web[key]]),
  );
}

function kebabCase(name) {
  return name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

/** A component's `web` section names exactly the contract's parts, parameters, and events. */
export function checkWebAgreement(records) {
  const problems = [];

  for (const record of records.values()) {
    if (record.web == null) continue;
    if (record.contract == null) {
      problems.push(
        problem({
          code: PROBLEM.SOURCE_CONFLICT,
          message: `${record.id} has a web section but no contract`,
          recordId: record.id,
          path: "/web",
        }),
      );
      continue;
    }

    const { web, contract } = record;
    problems.push(
      ...bijectionProblems(
        record.id,
        "anatomy",
        namesOfList(contract.anatomy),
        namesOfMap(web.anatomy),
      ),
      ...bijectionProblems(
        record.id,
        "parameters",
        namesOfMap(contract.parameters),
        namesOfMap(web.parameters),
      ),
      ...bijectionProblems(
        record.id,
        "events",
        namesOfMap(contract.events),
        namesOfMap(web.events),
      ),
    );

    for (const [name, portable] of Object.entries(contract.parameters ?? {})) {
      const mapped = web.parameters?.[name];
      if (!mapped?.values || portable.kind !== "enum") continue;
      for (const value of Object.keys(portable.values ?? {})) {
        if (!Object.hasOwn(mapped.values, value)) {
          problems.push(
            problem({
              code: PROBLEM.SOURCE_CONFLICT,
              message: `${record.id} web parameter ${name} is missing enum value ${value}`,
              recordId: record.id,
              path: `/web/parameters/${name}/values`,
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
          message: `${recordId} web ${label} is missing ${name}`,
          recordId,
          path: `/web/${label}`,
        }),
      );
    }
  }
  for (const name of actual) {
    if (!expected.has(name)) {
      problems.push(
        problem({
          code: PROBLEM.SOURCE_CONFLICT,
          message: `${recordId} web ${label} has unknown ${name}`,
          recordId,
          path: `/web/${label}`,
        }),
      );
    }
  }
  return problems;
}

export function checkSourceAgreement(record) {
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

  return problems;
}

export function checkRuleReferences(record, records, invalidIds = new Set()) {
  const problems = [];
  const contract = record.contract;
  if (contract == null || typeof contract !== "object") return problems;

  for (const { rule, path } of walkContractRules(contract)) {
    for (const [index, reference] of (rule.references ?? []).entries()) {
      if (invalidIds.has(reference.id)) continue;
      const target = records.get(reference.id);
      if (!target) {
        problems.push(
          problem({
            code: PROBLEM.CONTRACT_UNRESOLVED_REFERENCE,
            message: `${record.id} rule ${rule.id} references unresolved record ${reference.id}`,
            recordId: record.id,
            path: `${path}/references/${index}/id`,
          }),
        );
        continue;
      }
      if (
        reference.fragment &&
        target.bodyOrigin === "authored" &&
        !headingAnchors(target.body ?? "").has(reference.fragment)
      ) {
        problems.push(
          problem({
            code: PROBLEM.CONTRACT_UNRESOLVED_REFERENCE,
            message: `${record.id} rule ${rule.id} references #${reference.fragment}, which ${reference.id} has no heading for`,
            recordId: record.id,
            path: `${path}/references/${index}/fragment`,
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
