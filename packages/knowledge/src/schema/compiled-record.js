import Ajv2020 from "ajv/dist/2020.js";
import { PROBLEM, problem } from "../compile/tables.js";
import { COMPILED_DEFS, COMPILED_PROPERTIES, COMPILED_REQUIRED } from "./compiled-extensions.js";

const Ajv = Ajv2020.default ?? Ajv2020;

const COMPILED_ID = "urn:stevegreco:design-system:compiled-knowledge-record:1";

export function deriveCompiledSchema(authoredSchema) {
  const schema = structuredClone(authoredSchema);
  schema.$id = COMPILED_ID;
  schema.title = "Compiled knowledge record";
  schema.properties = { ...schema.properties, ...COMPILED_PROPERTIES };
  schema.required = [...schema.required, ...COMPILED_REQUIRED];
  schema.$defs = { ...schema.$defs, ...COMPILED_DEFS };
  return schema;
}

export function findCompiledIssues(compiledSchema, records) {
  const ajv = new Ajv({ allErrors: true, strict: true });
  const validate = ajv.compile(compiledSchema);
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
