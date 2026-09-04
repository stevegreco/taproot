import schema from "./knowledge-record.schema.json" with { type: "json" };
import { createKnowledgeAjv } from "./ajv.js";

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
  const byPath = left.path.localeCompare(right.path);
  return byPath === 0 ? left.keyword.localeCompare(right.keyword) : byPath;
}

export function findSchemaIssues(candidate) {
  const schemaIssues = validate(candidate)
    ? []
    : (validate.errors ?? [])
        // `contains` also emits per-item const/required failures while probing members.
        .filter((error) => !error.schemaPath.includes("/contains/"))
        .map((error) => ({
          path: issuePath(error),
          keyword: error.keyword,
          message: issueMessage(error),
        }));

  return [...schemaIssues, ...findContractSemanticIssues(candidate)].sort(compareIssues);
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
    if (parameter?.kind !== "enum" || !Object.hasOwn(parameter, "default")) continue;
    const values = parameter.values;
    if (values == null || typeof values !== "object" || Array.isArray(values)) continue;
    if (!Object.hasOwn(values, parameter.default)) {
      const allowed = Object.keys(values).map((value) => JSON.stringify(value));
      issues.push({
        path: `/contract/parameters/${name}/default`,
        keyword: "enum",
        message: `must be one of ${allowed.join(", ")}`,
      });
    }
  }

  return issues;
}
