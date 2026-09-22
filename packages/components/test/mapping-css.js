import { flatten } from "@stevegreco/design-system/flatten";
import { openCatalog } from "@stevegreco/design-system-knowledge/retrieve";

const STATE_SUFFIX = Object.freeze({
  hover: "hover",
  pressed: "press",
  disabled: "disabled",
});

const HOST_CHANNEL = Object.freeze({
  background: "background",
  foreground: "foreground",
  border: "border",
  "padding-inline": "padding-x",
  "padding-block": "padding-y",
  radius: "radius",
});

const CSS_PROPERTY = Object.freeze({
  background: "background-color",
  foreground: "color",
  border: "border-color",
  outline: "outline",
  "padding-inline": "padding",
  "padding-block": "padding",
  radius: "border-radius",
  gap: "gap",
  "font-family": "font-family",
  "font-size": "font-size",
  "font-weight": "font-weight",
  "line-height": "line-height",
  "letter-spacing": "letter-spacing",
  transition: "transition",
  "transition-duration": "transition",
  "transition-timing-function": "transition",
});

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

export function mappedValue(mapping) {
  if (mapping.token?.name) {
    return `var(${cssVariableFromTokenName(mapping.token.name)})`;
  }
  if (mapping.token?.literal) {
    return mapping.token.literal;
  }
  throw new Error("mapping has neither token.name nor token.literal");
}

export function hostCustomProperty(mapping) {
  const channel = HOST_CHANNEL[mapping.channel];
  if (!channel) return null;
  const suffix = mapping.state ? STATE_SUFFIX[mapping.state] : null;
  if (mapping.state && mapping.state !== "default" && !suffix) return null;
  return suffix ? `--_${channel}-${suffix}` : `--_${channel}`;
}

export function stylesheetNeedles(mapping) {
  const value = mappedValue(mapping);
  const needles = [];
  const hostVar = hostCustomProperty(mapping);
  if (hostVar) needles.push({ property: hostVar, value });
  const property = CSS_PROPERTY[mapping.channel];
  if (property) needles.push({ property, value });
  return needles;
}

export function stylesheetContains(styles, mapping) {
  return stylesheetNeedles(mapping).some(({ property, value }) =>
    declarationContains(styles, property, value),
  );
}

export function declarationContains(styles, property, value) {
  const pattern = new RegExp(`${escapeRegExp(property)}\\s*:([^;]*)${escapeRegExp(value)}`);
  return pattern.test(styles);
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

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
