/**
 * Browser command (runs in Node): what test/host-checks.test.js needs from
 * each component's web section in the compiled catalog.
 */
import { openCatalog } from "@stevegreco/design-system-knowledge/retrieve";

export async function hostElements() {
  const catalog = await openCatalog();
  const components = catalog
    .list({ type: "component" })
    .map((summary) => catalog.get(summary.id))
    .filter((component) => component.web);
  if (components.length === 0) throw new Error("compiled catalog has no web components");

  return components.map((component) => {
    const { contract, web: host } = component;
    return {
      id: component.id,
      slug: component.id.slice("component.".length),
      tagName: host.defaultTagName,
      className: host.export,
      defineExport: host.registration.export,
      supportsAliases: host.registration.supportsAliases,
      events: [...new Set(Object.values(host.events ?? {}).map((entry) => entry.event))],
      focusPart: host.focus ? (host.anatomy[host.focus.forwardsTo]?.part ?? null) : null,
      ruleIds: [...(contract.behavior ?? []), ...(contract.accessibility?.requirements ?? [])].map(
        (rule) => rule.id,
      ),
      properties: sampleProperties(contract.parameters ?? {}, host.parameters ?? {}),
      enums: enumProperties(contract.parameters ?? {}, host.parameters ?? {}),
      // Every string attribute set, so parts that render only with text are present.
      textAttributes: Object.fromEntries(
        Object.entries(contract.parameters ?? {})
          .filter(
            ([name, parameter]) =>
              parameter.kind === "string" && host.parameters?.[name]?.attribute,
          )
          .filter(([name]) => !host.parameters[name].attribute.startsWith("aria-"))
          .map(([name]) => [host.parameters[name].attribute, `Sample ${name}`]),
      ),
      parts: Object.values(host.anatomy ?? {})
        .map((node) => node.part)
        .filter(Boolean),
      requiresDefaultSlot: Object.values(host.anatomy ?? {}).some(
        (node) => node.slot === "default" && node.required,
      ),
      disabledAttribute: host.parameters?.disabled?.attribute ?? null,
      fieldsetDisables: host.formAssociation?.fieldsetDisables === true,
      suppressedWhenDisabled: [
        ...new Set(
          Object.values(host.events ?? {})
            .filter((entry) => entry.suppressedWhen === "effectively-disabled")
            .map((entry) => entry.event),
        ),
      ],
      hasFormProperty: Object.hasOwn(host.properties ?? {}, "form"),
      activationKeys: (contract.accessibility?.keyboard ?? [])
        .map((binding) => binding.key)
        .filter((key) => key === "Enter" || key === "Space"),
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

/** Each mapped enum property with its host values and default, as its getter should return them. */
function enumProperties(parameters, mapped) {
  return Object.entries(parameters)
    .filter(([name, parameter]) => parameter.kind === "enum" && mapped[name]?.property)
    .map(([name, parameter]) => {
      const hostValue = (value) => mapped[name].values?.[value] ?? value;
      return {
        attribute: mapped[name].attribute,
        property: mapped[name].property,
        values: Object.keys(parameter.values).map(hostValue),
        default: hostValue(parameter.default),
      };
    });
}
