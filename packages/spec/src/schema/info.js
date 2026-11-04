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

/**
 * The neutral property names a token binding uses where they fit, as SPEC.md lists them. Other
 * lowercase, hyphenated names are allowed.
 */
export const TOKEN_PROPERTIES = [
  "background",
  "foreground",
  "border",
  "border-width",
  "radius",
  "gap",
  "padding-horizontal",
  "padding-vertical",
  "focus-ring",
  "font-family",
  "font-size",
  "font-weight",
  "line-height",
  "letter-spacing",
  "motion",
  "motion-duration",
  "motion-easing",
  "shadow",
  "size",
  "height",
  "track",
];

/** Values that name no token, for a property no token applies to. */
export const TOKEN_KEYWORDS = ["transparent", "none", "inherit", "linear"];
