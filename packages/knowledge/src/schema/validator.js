import schema from "./knowledge-record.schema.json" with { type: "json" };
import { createKnowledgeAjv } from "./ajv.js";
import { byCodeUnit } from "../sort.js";

const validate = createKnowledgeAjv().compile(schema);

function pointerJoin(instancePath, property) {
  const escaped = String(property).replaceAll("~", "~0").replaceAll("/", "~1");
  return `${instancePath}/${escaped}`;
}

function issuePath(error) {
  switch (error.keyword) {
    case "required":
      return pointerJoin(error.instancePath, error.params.missingProperty);
    case "additionalProperties":
      return pointerJoin(error.instancePath, error.params.additionalProperty);
    case "unevaluatedProperties":
      return pointerJoin(error.instancePath, error.params.unevaluatedProperty);
    default:
      return error.instancePath;
  }
}

function issueMessage(error) {
  switch (error.keyword) {
    case "enum":
      return `must be one of ${error.params.allowedValues.map((value) => JSON.stringify(value)).join(", ")}`;
    case "const":
      return `must be ${JSON.stringify(error.params.allowedValue)}`;
    case "required":
      return "is required";
    case "additionalProperties":
    case "unevaluatedProperties":
      return "is not an allowed field";
    case "minLength":
      return error.params.limit === 1
        ? "must not be empty"
        : `must be at least ${error.params.limit} characters`;
    case "minItems":
      return `must contain at least ${error.params.limit} items`;
    case "uniqueItems":
      return "must not contain duplicates";
    case "type":
      return `must be ${error.params.type}`;
    case "pattern":
      return `must match pattern ${JSON.stringify(error.params.pattern ?? error.schema)}`;
    case "contains":
      return error.params?.maxContains === 1
        ? "must contain exactly one authored source"
        : "must contain an authored source";
    case "maxContains":
      return "must contain exactly one authored source";
    case "anyOf":
      return "must name an attribute or a property";
    default:
      return error.message ?? "is invalid";
  }
}

function compareIssues(left, right) {
  const byPath = byCodeUnit(left.path, right.path);
  return byPath === 0 ? byCodeUnit(left.keyword, right.keyword) : byPath;
}

export function findSchemaIssues(candidate) {
  const schemaIssues = validate(candidate)
    ? []
    : (validate.errors ?? [])
        // `contains` also emits per-item const/required failures while probing members.
        .filter((error) => !error.schemaPath.includes("/contains/"))
        // A failed `then` branch is already reported by its own errors.
        .filter((error) => error.keyword !== "if")
        .map((error) => ({
          path: issuePath(error),
          keyword: error.keyword,
          message: issueMessage(error),
        }));
  // A failing subschema leaves its properties unevaluated, so unevaluatedProperties
  // then flags valid fields. Report it only when nothing else went wrong.
  const specific = schemaIssues.filter((issue) => issue.keyword !== "unevaluatedProperties");
  const reported = specific.length > 0 ? specific : schemaIssues;

  return [...reported, ...findContractSemanticIssues(candidate)].sort(compareIssues);
}

function claimUniqueId(seen, id, path, issues) {
  if (typeof id !== "string" || id.length === 0) return;
  const previous = seen.get(id);
  if (previous) {
    issues.push({
      path,
      keyword: "uniqueItems",
      message: `id ${id} is already used at ${previous}`,
    });
    return;
  }
  seen.set(id, path);
}

function findContractSemanticIssues(candidate) {
  const contract = candidate?.contract;
  if (contract == null || typeof contract !== "object" || Array.isArray(contract)) {
    return [];
  }

  const issues = [];
  const seenAnatomy = new Set();
  for (const [index, part] of (contract.anatomy ?? []).entries()) {
    const name = part?.name;
    if (typeof name !== "string" || name.length === 0) continue;
    if (seenAnatomy.has(name)) {
      issues.push({
        path: `/contract/anatomy/${index}/name`,
        keyword: "uniqueItems",
        message: "must be unique",
      });
      continue;
    }
    seenAnatomy.add(name);
  }

  for (const [name, parameter] of Object.entries(contract.parameters ?? {})) {
    if (parameter?.kind !== "enum") continue;
    const values = parameter.values;
    if (values == null || typeof values !== "object" || Array.isArray(values)) continue;
    for (const value of Object.keys(parameter.examples ?? {})) {
      if (!Object.hasOwn(values, value)) {
        issues.push({
          path: `/contract/parameters/${name}/examples/${value}`,
          keyword: "enum",
          message: `must name one of the parameter values`,
        });
      }
    }
    // A non-string default already fails the schema's type check.
    if (typeof parameter.default !== "string") continue;
    if (!Object.hasOwn(values, parameter.default)) {
      const allowed = Object.keys(values).map((value) => JSON.stringify(value));
      issues.push({
        path: `/contract/parameters/${name}/default`,
        keyword: "enum",
        message: `must be one of ${allowed.join(", ")}`,
      });
    }
  }

  const seenIds = new Map();
  for (const [index, item] of (contract.usage?.do ?? []).entries()) {
    claimUniqueId(seenIds, item?.id, `/contract/usage/do/${index}/id`, issues);
  }
  for (const [index, item] of (contract.usage?.avoid ?? []).entries()) {
    claimUniqueId(seenIds, item?.id, `/contract/usage/avoid/${index}/id`, issues);
  }
  for (const [index, rule] of (contract.content ?? []).entries()) {
    claimUniqueId(seenIds, rule?.id, `/contract/content/${index}/id`, issues);
  }
  for (const [index, rule] of (contract.behavior ?? []).entries()) {
    claimUniqueId(seenIds, rule?.id, `/contract/behavior/${index}/id`, issues);
  }
  for (const [index, rule] of (contract.accessibility?.requirements ?? []).entries()) {
    claimUniqueId(seenIds, rule?.id, `/contract/accessibility/requirements/${index}/id`, issues);
  }

  return issues;
}
