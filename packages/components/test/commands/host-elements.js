/**
 * Browser command (runs in Node): what test/host-checks.test.js needs from
 * each web-component binding in the compiled catalog.
 */
import { openCatalog } from "@stevegreco/design-system-knowledge/retrieve";

export async function hostElements() {
  const catalog = await openCatalog();
  const bindings = catalog
    .list({ type: "binding" })
    .map((summary) => catalog.get(summary.id))
    .filter((binding) => binding.host.platform === "web-component");
  if (bindings.length === 0) throw new Error("compiled catalog has no web-component bindings");

  return bindings.map(({ host, relations }) => {
    const component = catalog.get(relations.implements[0]);
    const { contract } = component;
    return {
      id: component.id,
      slug: component.id.slice("component.".length),
      tagName: host.defaultTagName,
      className: host.export,
      defineExport: host.registration.export,
      supportsAliases: host.registration.supportsAliases,
      focusPart: host.focus ? (host.anatomy[host.focus.forwardsTo]?.part ?? null) : null,
      ruleIds: [...(contract.behavior ?? []), ...(contract.accessibility?.requirements ?? [])].map(
        (rule) => rule.id,
      ),
      properties: sampleProperties(contract.parameters ?? {}, host.parameters ?? {}),
    };
  });
}

/** One non-default value for each mapped property, as its getter should return it. */
function sampleProperties(parameters, mapped) {
  const samples = {};
  for (const [name, parameter] of Object.entries(parameters)) {
    const property = mapped[name]?.property;
    if (!property) continue;
    if (parameter.kind === "boolean") samples[property] = parameter.default !== true;
    else if (parameter.kind === "enum") {
      const values = Object.keys(parameter.values);
      const value = values.find((candidate) => candidate !== parameter.default) ?? values[0];
      samples[property] = mapped[name].values?.[value] ?? value;
    } else samples[property] = `sample ${name}`;
  }
  return samples;
}
