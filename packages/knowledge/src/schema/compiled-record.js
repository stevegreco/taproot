import authoredSchema from "./index.js";
import { PROBLEM, problem } from "../compile/tables.js";
import { createKnowledgeAjv } from "./ajv.js";
import {
  COMPILED_DEFS,
  COMPILED_PROPERTIES,
  COMPILED_REQUIRED,
  COMPILED_SCHEMA_VERSION,
} from "./compiled-extensions.js";

export const COMPILED_ID = `urn:stevegreco:design-system:compiled-knowledge-record:${COMPILED_SCHEMA_VERSION}`;

function deriveCompiledSchema(authoredSchema) {
  const schema = structuredClone(authoredSchema);
  schema.$id = COMPILED_ID;
  schema.title = "Compiled knowledge record";
  schema.properties = { ...schema.properties, ...COMPILED_PROPERTIES };
  schema.required = [...schema.required, ...COMPILED_REQUIRED];
  schema.$defs = { ...schema.$defs, ...COMPILED_DEFS };
  return schema;
}

export const compiledSchema = deriveCompiledSchema(authoredSchema);
let validate;

/** Compile once per process; return fresh errors for each record. */
export function compiledRecordErrors(record) {
  validate ??= createKnowledgeAjv().compile(compiledSchema);
  return validate(record) ? [] : [...validate.errors];
}

export function findCompiledIssues(records) {
  const problems = [];

  for (const record of records) {
    for (const error of compiledRecordErrors(record)) {
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
