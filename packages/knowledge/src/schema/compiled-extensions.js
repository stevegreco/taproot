export const COMPILED_REQUIRED = Object.freeze(["compiledSchemaVersion", "backlinks"]);

export const COMPILED_PROPERTIES = Object.freeze({
  compiledSchemaVersion: { const: 1 },
  backlinks: { $ref: "#/$defs/backlinks" },
  contract: { $ref: "#/$defs/componentContract" },
  tokens: { $ref: "#/$defs/tokenContract" },
  decisions: {
    type: "array",
    items: { $ref: "#/$defs/decisionRef" },
  },
});

export const COMPILED_DEFS = Object.freeze({
  source: {
    type: "object",
    required: ["kind", "path", "revision"],
    additionalProperties: false,
    properties: {
      kind: {
        enum: ["authored", "component-spec", "token-source", "adr", "generated"],
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
  componentContract: {
    type: "object",
    required: [
      "specVersion",
      "tagName",
      "description",
      "usage",
      "anatomy",
      "api",
      "states",
      "behavior",
      "accessibility",
      "rationale",
    ],
    additionalProperties: false,
    properties: {
      specVersion: { const: 1 },
      tagName: { type: "string", minLength: 1 },
      description: { type: "string" },
      usage: { type: "object" },
      anatomy: { type: "array" },
      api: { type: "object" },
      states: { type: "array", items: { type: "string" } },
      behavior: { type: "array", items: { type: "string" } },
      accessibility: { type: "object" },
      rationale: { type: "array" },
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
    required: ["name", "alias", "valueType", "group"],
    additionalProperties: false,
    properties: {
      name: { type: "string", minLength: 1 },
      alias: { type: ["string", "null"] },
      valueType: { type: "string" },
      group: { type: ["string", "null"] },
    },
  },
  decisionRef: {
    type: "object",
    required: ["path", "title", "status", "revision"],
    additionalProperties: false,
    properties: {
      path: { type: "string", minLength: 1 },
      title: { type: "string", minLength: 1 },
      status: { type: "string", minLength: 1 },
      revision: { type: "string", minLength: 1 },
    },
  },
});
