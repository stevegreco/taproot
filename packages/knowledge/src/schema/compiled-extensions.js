export const COMPILED_SCHEMA_VERSION = 6;

export const COMPILED_REQUIRED = Object.freeze([
  "schemaVersion",
  "visibility",
  "relations",
  "sources",
  "compiledSchemaVersion",
  "backlinks",
]);

export const COMPILED_PROPERTIES = Object.freeze({
  compiledSchemaVersion: { const: COMPILED_SCHEMA_VERSION },
  backlinks: { $ref: "#/$defs/backlinks" },
  tokens: { $ref: "#/$defs/tokenContract" },
});

export const COMPILED_DEFS = Object.freeze({
  source: {
    type: "object",
    required: ["kind", "path", "revision"],
    additionalProperties: false,
    properties: {
      kind: {
        enum: ["authored", "token-source", "adr", "generated"],
      },
      path: { $ref: "#/$defs/repositoryPath" },
      revision: { type: "string", minLength: 1 },
    },
  },
  asset: {
    type: "object",
    required: ["id", "path", "mediaType", "width", "height", "alt", "bundlePath", "revision"],
    additionalProperties: false,
    properties: {
      id: { $ref: "#/$defs/dottedId" },
      path: { $ref: "#/$defs/repositoryPath" },
      mediaType: {
        type: "string",
        pattern: "^[a-z]+/[a-zA-Z0-9.+-]+$",
      },
      width: { type: "integer", minimum: 1 },
      height: { type: "integer", minimum: 1 },
      alt: { type: "string", minLength: 1 },
      bundlePath: { type: "string", minLength: 1 },
      revision: { type: "string", minLength: 1 },
    },
  },
  backlinks: {
    type: "object",
    additionalProperties: false,
    properties: {
      usedBy: { $ref: "#/$defs/recordIdList" },
      demonstratedBy: { $ref: "#/$defs/recordIdList" },
      guidedBy: { $ref: "#/$defs/recordIdList" },
      implementedBy: { $ref: "#/$defs/recordIdList" },
      reviewedBy: { $ref: "#/$defs/recordIdList" },
      supersededBy: { $ref: "#/$defs/recordIdList" },
      related: { $ref: "#/$defs/recordIdList" },
    },
  },
  tokenContract: {
    type: "object",
    required: ["tier", "namespace", "description", "entries"],
    additionalProperties: false,
    properties: {
      tier: { enum: ["primitive", "semantic", "component"] },
      namespace: { type: "string", minLength: 1 },
      description: { type: "string" },
      entries: {
        type: "array",
        items: { $ref: "#/$defs/tokenEntry" },
      },
    },
  },
  tokenEntry: {
    type: "object",
    required: ["name", "alias", "valueType"],
    additionalProperties: false,
    properties: {
      name: { type: "string", minLength: 1 },
      alias: { type: ["string", "null"] },
      valueType: { type: "string" },
    },
  },
});
