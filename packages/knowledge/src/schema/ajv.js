import Ajv2020 from "ajv/dist/2020.js";
import hostBinding from "./host-binding.schema.json" with { type: "json" };
import portableContract from "./portable-contract.schema.json" with { type: "json" };

const Ajv = Ajv2020.default ?? Ajv2020;

export function createKnowledgeAjv(options = {}) {
  const ajv = new Ajv({ allErrors: true, strict: true, ...options });
  ajv.addSchema(portableContract);
  ajv.addSchema(hostBinding);
  return ajv;
}
