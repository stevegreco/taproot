import Ajv2020 from "ajv/dist/2020.js";

const Ajv = Ajv2020.default ?? Ajv2020;

export function createKnowledgeAjv(options = {}) {
  return new Ajv({ allErrors: true, strict: true, ...options });
}
