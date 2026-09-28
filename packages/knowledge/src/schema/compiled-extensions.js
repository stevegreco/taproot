import recordSchema from "./knowledge-record.schema.json" with { type: "json" };

export const COMPILED_SCHEMA_VERSION = 8;

export const COMPILED_REQUIRED = Object.freeze([
  "schemaVersion",
  "status",
  "jobs",
  "tags",
  "visibility",
  "relations",
  "sources",
  "body",
  "compiledSchemaVersion",
  "backlinks",
  "bodyOrigin",
]);

export const COMPILED_PROPERTIES = Object.freeze({
  compiledSchemaVersion: { const: COMPILED_SCHEMA_VERSION },
  relations: {
    description: "The record's authored links. backlinks holds the links other records declare.",
    type: "object",
    additionalProperties: false,
    properties: { related: { $ref: "#/$defs/recordIdList" } },
  },
  backlinks: { $ref: "#/$defs/backlinks" },
  tokens: { $ref: "#/$defs/tokenContract" },
  bodyOrigin: { enum: ["authored", "generated"] },
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

/** Fields the compiler adds to a component contract. */
export const COMPILED_CONTRACT_PROPERTIES = Object.freeze({
  mappings: {
    description: "One row per part, channel, configuration, and state, expanded from visuals.",
    type: "array",
    items: { $ref: "#/$defs/visualMapping" },
  },
  visualCoverage: { $ref: "#/$defs/visualCoverage" },
});

const stringList = { type: "array", items: { type: "string", minLength: 1 } };

export const COMPILED_CONTRACT_DEFS = Object.freeze({
  visualMapping: {
    type: "object",
    additionalProperties: false,
    required: ["part", "channel", "token"],
    properties: {
      part: { type: "string", minLength: 1 },
      channel: { enum: Object.keys(recordSchema.$defs.channelMapProperties.properties) },
      configuration: {
        type: "object",
        additionalProperties: { type: "string", minLength: 1 },
      },
      state: { type: "string", minLength: 1 },
      token: {
        oneOf: [
          {
            type: "object",
            additionalProperties: false,
            required: ["name"],
            properties: { name: { type: "string", minLength: 1 } },
          },
          {
            type: "object",
            additionalProperties: false,
            required: ["literal"],
            properties: { literal: { enum: ["transparent", "inherit", "none"] } },
          },
        ],
      },
    },
  },
  visualCoverage: {
    type: "object",
    additionalProperties: false,
    required: ["parts", "uncoveredParts", "uncoveredAxes"],
    properties: {
      parts: { type: "object", additionalProperties: { $ref: "#/$defs/visualPartCoverage" } },
      uncoveredParts: stringList,
      uncoveredAxes: stringList,
    },
  },
  visualPartCoverage: {
    type: "object",
    additionalProperties: false,
    required: ["axes", "values", "states", "channels"],
    properties: {
      axes: stringList,
      values: { type: "object", additionalProperties: stringList },
      missingValues: {
        type: "object",
        additionalProperties: { ...stringList, minItems: 1 },
      },
      states: stringList,
      channels: stringList,
    },
  },
});
