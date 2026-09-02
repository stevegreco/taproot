import { PROBLEM, problem } from "../compile/tables.js";
import { createKnowledgeAjv } from "./ajv.js";
import { COMPILED_DEFS, COMPILED_PROPERTIES, COMPILED_REQUIRED } from "./compiled-extensions.js";

const COMPILED_ID = "urn:stevegreco:design-system:compiled-knowledge-record:3";

const TYPE_HOST_RULES = Object.freeze([
  {
    if: { properties: { type: { const: "component" } }, required: ["type"] },
    then: { not: { required: ["host"] } },
  },
  {
    if: {
      properties: {
        type: {
          enum: ["pattern", "guideline", "example", "foundation", "decision", "binding"],
        },
      },
      required: ["type"],
    },
    then: { not: { required: ["contract"] } },
  },
]);

export function deriveCompiledSchema(authoredSchema) {
  const schema = structuredClone(authoredSchema);
  schema.$id = COMPILED_ID;
  schema.title = "Compiled knowledge record";
  schema.properties = { ...schema.properties, ...COMPILED_PROPERTIES };
  schema.required = [...schema.required, ...COMPILED_REQUIRED];
  schema.$defs = { ...schema.$defs, ...COMPILED_DEFS };
  schema.allOf = [...(schema.allOf ?? []), ...TYPE_HOST_RULES];
  return schema;
}

export function findCompiledIssues(compiledSchema, records) {
  const validate = createKnowledgeAjv().compile(compiledSchema);
  const problems = [];

  for (const record of records) {
    if (validate(record)) continue;
    for (const error of validate.errors ?? []) {
      problems.push(
        problem({
          code: PROBLEM.COMPILED_INVALID,
          message: `compiler produced invalid output (${error.instancePath || "/"} ${error.message}). This is a compiler bug, not an authored-record fault.`,
          recordId: record.id ?? null,
          path: error.instancePath || "/",
        }),
      );
    }
  }

  return problems;
}
