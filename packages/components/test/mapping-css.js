import { openCatalog } from "@stevegreco/design-system-knowledge/retrieve";

const kebabCase = (segment) => segment.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();

export function cssVariableFromTokenName(name) {
  return `--${name.split(".").map(kebabCase).join("-")}`;
}

export function stylesheetNeedle(mapping) {
  if (mapping.token?.name) {
    return `var(${cssVariableFromTokenName(mapping.token.name)})`;
  }
  if (mapping.token?.literal) {
    return mapping.token.literal;
  }
  throw new Error("mapping has neither token.name nor token.literal");
}

export async function compiledMappings(recordId) {
  const catalog = await openCatalog();
  const record = catalog.get(recordId);
  const mappings = record?.contract?.mappings;
  if (!Array.isArray(mappings) || mappings.length === 0) {
    throw new Error(`${recordId} compiled contract has no mappings`);
  }
  return mappings;
}
