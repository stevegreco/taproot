/**
 * Browser command (runs in Node): turn each compiled component record into
 * render cases for test/contract-mappings.test.js. Each case is one
 * configuration and one set of simultaneous states, with every part/channel
 * value `resolveMappings()` expects there.
 */
import { resolveMappings } from "@stevegreco/design-system-knowledge/compile";
import { openCatalog } from "@stevegreco/design-system-knowledge/retrieve";

import { cssVariableFromTokenName } from "../mapping-css.js";

/** Configuration axes that are not host parameters, and the media feature that drives each. */
const MEDIA_AXES = Object.freeze({
  prefersReducedMotion: "prefers-reduced-motion",
});

export async function contractCases() {
  const catalog = await openCatalog();
  const full = (summary) => catalog.get(summary.id);
  const components = catalog.list({ type: "component" }).map(full);
  const bindings = catalog.list({ type: "binding" }).map(full);
  if (components.length === 0) throw new Error("compiled catalog has no component records");
  return components.map((record) => componentCases(record, bindingFor(bindings, record.id)));
}

function bindingFor(bindings, id) {
  const binding = bindings.find((record) => record.relations?.implements?.includes(id));
  if (!binding) throw new Error(`${id} has no binding record`);
  return binding;
}

function componentCases(record, binding) {
  const { contract } = record;
  const { host } = binding;
  const axes = configurationAxes(contract, host, record.id);
  const cases = [];

  for (const configuration of product(axes)) {
    for (const states of stateSets(contract)) {
      const resolved = resolveMappings(contract.mappings, contract.stateResolution, {
        configuration: configuration.values,
        states,
      });
      const expected = [];
      for (const [part, channels] of Object.entries(resolved.parts)) {
        for (const [channel, row] of Object.entries(channels)) {
          expected.push({ part, channel, value: cssValue(row.token) });
        }
      }
      cases.push({
        configuration: configuration.values,
        attributes: configuration.attributes,
        media: configuration.media,
        states,
        expected,
        problems: resolved.problems.map((problem) => problem.message),
      });
    }
  }

  return {
    id: record.id,
    slug: record.id.slice("component.".length),
    defineExport: host.registration.export,
    parts: Object.fromEntries(
      Object.entries(host.anatomy)
        .filter(([, node]) => node.part)
        .map(([name, node]) => [name, node.part]),
    ),
    focusPart: host.focus?.forwardsTo ?? null,
    stateAttributes: stateAttributes(host),
    cases,
  };
}

/**
 * Every axis a mapping row is configured by. A host parameter is driven by its
 * attribute, including "absent", which resolves to the contract default. Other
 * axes are media features and are either emulated or not.
 */
function configurationAxes(contract, host, id) {
  const names = new Set();
  for (const mapping of contract.mappings) {
    for (const name of Object.keys(mapping.configuration ?? {})) names.add(name);
  }

  return [...names].sort().map((name) => {
    const parameter = contract.parameters?.[name];
    if (parameter) {
      const attribute = host.parameters?.[name]?.attribute;
      if (!attribute) throw new Error(`${id} parameter ${name} has no binding attribute`);
      const values =
        parameter.kind === "boolean" ? ["true", "false"] : Object.keys(parameter.values);
      const hostValue = (value) => host.parameters[name].values?.[value] ?? value;
      return [
        { values: { [name]: String(parameter.default) }, attributes: {}, media: [] },
        ...values.map((value) => ({
          values: { [name]: value },
          attributes:
            parameter.kind === "boolean"
              ? value === "true"
                ? { [attribute]: "" }
                : {}
              : { [attribute]: hostValue(value) },
          media: [],
        })),
      ];
    }

    const feature = MEDIA_AXES[name];
    if (!feature) {
      throw new Error(
        `${id} configuration axis ${name} is neither a parameter nor a known media feature; add it to MEDIA_AXES`,
      );
    }
    return [
      { values: {}, attributes: {}, media: [] },
      ...contract.configurationAxes[name].values.map((value) => ({
        values: { [name]: value },
        attributes: {},
        media: [{ name: feature, value }],
      })),
    ];
  });
}

/** Rest, each mapped state alone, and each suppressing state with what it suppresses. */
function stateSets(contract) {
  const mapped = new Set();
  for (const mapping of contract.mappings) {
    if (mapping.state && mapping.state !== "default") mapped.add(mapping.state);
  }
  const sets = [[], ...[...mapped].sort().map((state) => [state])];
  for (const [winner, losers] of Object.entries(contract.stateResolution?.suppress ?? {})) {
    for (const loser of losers) sets.push([winner, loser]);
  }
  return sets;
}

/** Host attributes that put the element into an attribute-driven state. */
function stateAttributes(host) {
  const attributes = {};
  if (host.parameters?.disabled?.attribute) {
    attributes.disabled = { name: host.parameters.disabled.attribute, value: "" };
  }
  // A non-empty error message is what marks the control invalid.
  if (host.parameters?.error?.attribute) {
    attributes.invalid = { name: host.parameters.error.attribute, value: "Fix this." };
  }
  return attributes;
}

function product(axes) {
  let combinations = [{ values: {}, attributes: {}, media: [] }];
  for (const options of axes) {
    combinations = combinations.flatMap((combination) =>
      options.map((option) => ({
        values: { ...combination.values, ...option.values },
        attributes: { ...combination.attributes, ...option.attributes },
        media: [...combination.media, ...option.media],
      })),
    );
  }
  return combinations;
}

function cssValue(token) {
  if (token.name) return `var(${cssVariableFromTokenName(token.name)})`;
  return token.literal;
}
