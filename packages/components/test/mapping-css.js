import { flatten } from "@stevegreco/design-system/flatten";
import { openCatalog } from "@stevegreco/design-system-knowledge/retrieve";

/** Resolve a mapping token name through the published flatten() kebab-case rule. */
export function cssVariableFromTokenName(name) {
  const tree = {};
  let cursor = tree;
  const parts = name.split(".");
  for (const [index, part] of parts.entries()) {
    if (index === parts.length - 1) {
      cursor[part] = "";
      continue;
    }
    cursor[part] = {};
    cursor = cursor[part];
  }
  const [token] = flatten(tree);
  if (!token?.cssVariable) {
    throw new Error(`flatten() produced no CSS variable for ${name}`);
  }
  return token.cssVariable;
}

/** Every token CSS variable a stylesheet reads with var(). */
export function tokenVariables(styles) {
  return new Set(
    [...styles.matchAll(/var\((--(?:semantic|primitives|component)-[a-z0-9-]+)/g)].map(
      (match) => match[1],
    ),
  );
}

export async function componentRecords() {
  const catalog = await openBuiltCatalog("Component records");
  const records = catalog.list({ type: "component" });
  if (records.length === 0) throw new Error("compiled catalog has no component records");
  return records;
}

export async function compiledMappings(recordId) {
  const catalog = await openBuiltCatalog(recordId);
  const record = catalog.get(recordId);
  const mappings = record?.contract?.mappings;
  if (!Array.isArray(mappings) || mappings.length === 0) {
    throw new Error(`${recordId} compiled contract has no mappings`);
  }
  return mappings;
}

async function openBuiltCatalog(subject) {
  try {
    return await openCatalog();
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(
      `${subject} needs the compiled knowledge bundle. From the repo root run: pnpm exec turbo run build --filter=@stevegreco/design-system-knowledge. ${reason}`,
    );
  }
}
