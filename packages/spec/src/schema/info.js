import schema from "./spec-record.schema.json" with { type: "json" };

export { schema };

export const RECORD_ID = new RegExp(schema.$defs.recordId.pattern);

const typeBranches = schema.allOf.map((branch) => ({
  type: branch.if.properties.type.const,
  fields: Object.keys(branch.then.properties),
}));

/** Fields every record may have. */
export const COMMON_FIELDS = Object.freeze(Object.keys(schema.properties));

/** Fields only records of this type may have, beyond the common ones. */
export function typeFields(type) {
  return typeBranches.find((branch) => branch.type === type)?.fields ?? [];
}
