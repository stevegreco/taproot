import { PROBLEM, SIZE_BRIDGE, problem } from "./tables.js";

export function assembleRecord(authored, contribution, assets) {
  const record = {
    id: authored.id,
    schemaVersion: authored.schemaVersion,
    compiledSchemaVersion: 3,
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
  if (contribution.fields.decisions) record.decisions = contribution.fields.decisions;

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

export function withTokenGroups(record) {
  if (!record.tokens) return record;
  const variants = new Set(Object.keys(record.contract?.parameters?.variant?.values ?? {}));
  return {
    ...record,
    tokens: {
      ...record.tokens,
      entries: record.tokens.entries.map((entry) => ({
        ...entry,
        group: assignGroup(entry.name, record.tokens.namespace, variants),
      })),
    },
  };
}

export function checkSourceAgreement(record) {
  const tokens = record.tokens;
  if (!tokens) return [];

  const problems = [];
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

  const variantValues = record.contract?.parameters?.variant?.values ?? {};
  const variantNames = new Set(Object.keys(variantValues));

  if (tokens.tier === "component") {
    for (const variant of variantNames) {
      if (!tokens.entries.some((entry) => entry.group === variant)) {
        problems.push(
          problem({
            code: PROBLEM.SOURCE_CONFLICT,
            message: `component variant ${variant} has no token entries`,
            recordId: record.id,
            path: `/contract/parameters/variant/${variant}`,
          }),
        );
      }
    }

    const extraGroups = new Set(
      tokens.entries
        .map((entry) => entry.group)
        .filter((group) => group != null && !variantNames.has(group)),
    );
    for (const group of extraGroups) {
      problems.push(
        problem({
          code: PROBLEM.SOURCE_CONFLICT,
          message: `token group ${group} is not a spec variant`,
          recordId: record.id,
          path: "/tokens/entries",
        }),
      );
    }
  }

  const specSizes = Object.keys(record.contract?.parameters?.size?.values ?? {});
  for (const size of specSizes) {
    if (!Object.hasOwn(SIZE_BRIDGE, size)) {
      problems.push(
        problem({
          code: PROBLEM.SOURCE_CONFLICT,
          message: `spec size ${size} is not in SIZE_BRIDGE`,
          recordId: record.id,
          path: `/contract/parameters/size/${size}`,
        }),
      );
    }
  }

  const sizePrefix = `${namespace}.size.`;
  const tokenSizeKeys = new Set();
  for (const entry of tokens.entries) {
    if (!entry.name.startsWith(sizePrefix)) continue;
    const key = entry.name.slice(sizePrefix.length).split(".")[0];
    if (key) tokenSizeKeys.add(key);
  }
  const bridged = new Set(Object.values(SIZE_BRIDGE));
  for (const key of tokenSizeKeys) {
    if (!bridged.has(key)) {
      problems.push(
        problem({
          code: PROBLEM.SOURCE_CONFLICT,
          message: `token size key ${key} is not in SIZE_BRIDGE`,
          recordId: record.id,
          path: "/tokens/entries",
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

function assignGroup(name, namespace, variantNames) {
  const prefix = `${namespace}.`;
  if (!name.startsWith(prefix)) return null;
  const parts = name.slice(prefix.length).split(".");
  const first = parts[0];
  if (!first || first === "size") return null;
  if (variantNames.has(first)) return first;
  if (
    parts.length >= 3 &&
    (parts[1] === "background" || parts[1] === "foreground" || parts[1] === "border")
  ) {
    return first;
  }
  return null;
}
