import recordSchema from "../schema/knowledge-record.schema.json" with { type: "json" };
import { PROBLEM, problem } from "./tables.js";
import { byCodeUnit } from "../sort.js";

export const VISUAL_LITERALS = Object.freeze(["transparent", "inherit", "none"]);

/** Channel names, in display order. The schema's `channelMapProperties` is the one list. */
export const VISUAL_CHANNELS = Object.freeze(
  Object.keys(recordSchema.$defs.channelMapProperties.properties),
);

/** The CSS property each channel sets on the web. */
export const CHANNEL_CSS = Object.freeze({
  background: "background-color",
  foreground: "color",
  border: "border-color",
  "focus-ring": "outline-color",
  "padding-horizontal": "padding-inline",
  "padding-vertical": "padding-block",
  radius: "border-radius",
  gap: "gap",
  "font-family": "font-family",
  "font-size": "font-size",
  "font-weight": "font-weight",
  "line-height": "line-height",
  "letter-spacing": "letter-spacing",
  motion: "transition",
  "motion-duration": "transition-duration",
  "motion-easing": "transition-timing-function",
});

const RESERVED_PART_KEYS = Object.freeze(["base", "states"]);
const REST_STATE = "default";
const MOTION = "motion";
const MOTION_CLEARED = Object.freeze(["motion-duration", "motion-easing"]);
const BOOLEAN_CONFIGURATION_VALUES = Object.freeze(["true", "false"]);
const GENERATED_FIELDS = Object.freeze(["mappings", "visualCoverage"]);

/**
 * Expand compact `visuals` into compiled `mappings` and drop the authored source.
 * With `tokenNames`, every token a visual names must exist. Does not mutate the input.
 *
 * @param {object} contract
 * @param {string} recordId
 * @param {Set<string>|null} [tokenNames]
 */
export function compileContractVisuals(contract, recordId, tokenNames = null) {
  if (!contract) return { contract, problems: [] };

  const next = structuredClone(contract);
  const problems = [...stateOrderProblems(next, recordId)];

  // `visuals` is the only authored form of token mappings.
  for (const field of GENERATED_FIELDS.filter((name) => Object.hasOwn(next, name))) {
    problems.push(
      conflict(
        recordId,
        `/contract/${field}`,
        `${field} is generated from visuals and cannot be authored`,
      ),
    );
    delete next[field];
  }

  if (Object.hasOwn(next, "visuals")) {
    const expanded = expandVisuals(next, recordId, tokenNames);
    problems.push(...expanded.problems);
    next.mappings = expanded.mappings.map(({ source: _source, ...row }) => row);
    next.visualCoverage = buildVisualCoverage(next);
    problems.push(...missingValueWarnings(next.visualCoverage, recordId));
    delete next.visuals;
  }

  return { contract: next, problems };
}

/**
 * Compile grouped visuals into deterministic mapping rows. Each row keeps its authored
 * `source` pointer until `stripMappingSources` removes it.
 */
export function expandVisuals(contract, recordId, tokenNames = null) {
  const problems = [];
  const mappings = [];
  const parts = new Set((contract.anatomy ?? []).map((item) => item.name));
  const context = { contract, recordId, tokenNames, problems, mappings };

  problems.push(...reservedAxisNameProblems(contract, recordId));

  const visuals = contract.visuals ?? {};
  for (const partName of Object.keys(visuals).sort(byCodeUnit)) {
    const path = `/contract/visuals/${partName}`;
    if (!parts.has(partName)) {
      problems.push(conflict(recordId, path, `visuals part ${partName} is not in anatomy`));
      continue;
    }
    expandPart(partName, visuals[partName], path, context);
  }

  const sorted = sortMappings(mappings);
  problems.push(...overlappingAssignmentProblems(sorted, recordId));
  return { mappings: sorted, problems };
}

/**
 * Resolve mapping rows for one configuration and a set of active states.
 *
 * `states` is the contract's list, highest priority first. For each part and channel, the
 * row of the highest-priority active state wins, then rows with no state. Among rows for
 * the same state, the one with more configuration keys wins. `motion: none` clears the
 * motion duration and easing on the same part.
 *
 * @param {readonly object[]} mappings
 * @param {readonly string[]} states
 * @param {{ configuration?: object, states?: readonly string[], part?: string }} [options]
 */
export function resolveMappings(mappings, states = [], options = {}) {
  const configuration = options.configuration ?? {};
  const active = new Set(options.states ?? []);
  // Rank 0 is no state; active states rank above it, the first listed highest.
  const rank = new Map(
    [...states]
      .reverse()
      .filter((state) => active.has(state))
      .map((state, index) => [state, index + 1]),
  );
  /** @type {Map<string, Map<string, { row: object, rank: number, specificity: number }>>} */
  const winners = new Map();

  for (const mapping of mappings ?? []) {
    if (options.part && mapping.part !== options.part) continue;
    if (!configurationMatches(mapping.configuration, configuration)) continue;
    const layer = mapping.state ? rank.get(mapping.state) : 0;
    if (layer === undefined) continue;
    const specificity = Object.keys(mapping.configuration ?? {}).length;
    if (!winners.has(mapping.part)) winners.set(mapping.part, new Map());
    const channels = winners.get(mapping.part);
    const previous = channels.get(mapping.channel);
    if (
      !previous ||
      previous.rank < layer ||
      (previous.rank === layer && previous.specificity < specificity)
    ) {
      const { source: _source, ...row } = mapping;
      channels.set(mapping.channel, { row, rank: layer, specificity });
    }
  }

  const parts = {};
  for (const part of [...winners.keys()].sort(byCodeUnit)) {
    const channels = winners.get(part);
    if (channels.get(MOTION)?.row.token.literal === "none") {
      for (const channel of MOTION_CLEARED) channels.delete(channel);
    }
    const selected = {};
    for (const channel of VISUAL_CHANNELS) {
      if (channels.has(channel)) selected[channel] = channels.get(channel).row;
    }
    parts[part] = selected;
  }

  const partNames = Object.keys(parts);
  const selectedPart = options.part ?? (partNames.length === 1 ? partNames[0] : undefined);
  const result = { parts };
  if (selectedPart || partNames.length === 0) {
    result.channels = selectedPart ? (parts[selectedPart] ?? {}) : {};
  } else {
    Object.defineProperty(result, "channels", {
      enumerable: false,
      get() {
        throw new TypeError(
          `resolveMappings matched parts ${partNames.join(", ")}; pass { part } to read channels, or use parts`,
        );
      },
    });
  }
  return result;
}

/** Drop compiler-only authored paths from compiled mapping rows. */
export function stripMappingSources(contract) {
  if (!contract || !Array.isArray(contract.mappings)) return contract;
  contract.mappings = contract.mappings.map(({ source: _source, ...row }) => row);
  return contract;
}

/**
 * A part holds `base` channels, part-wide `states`, and one block per configuration axis.
 * An axis value holds channels and its own `states`.
 */
function expandPart(partName, node, path, context) {
  addChannels(partName, node.base, undefined, undefined, `${path}/base`, context);
  addStates(partName, node.states, undefined, `${path}/states`, context);

  const { contract, recordId, problems } = context;
  for (const axis of Object.keys(node)
    .filter((key) => !RESERVED_PART_KEYS.includes(key))
    .sort(byCodeUnit)) {
    const axisPath = `${path}/${axis}`;
    const allowed = configurationValues(
      axis,
      contract.parameters ?? {},
      contract.configurationAxes ?? {},
    );
    if (!allowed) {
      problems.push(
        conflict(
          recordId,
          axisPath,
          `visuals axis ${axis} is not a contract parameter or configuration axis`,
        ),
      );
      continue;
    }
    for (const value of Object.keys(node[axis]).sort(byCodeUnit)) {
      const valuePath = `${axisPath}/${value}`;
      if (!allowed.has(value)) {
        problems.push(
          conflict(recordId, valuePath, `visuals configuration ${axis} has unknown value ${value}`),
        );
        continue;
      }
      const { states, ...channels } = node[axis][value];
      const configuration = { [axis]: value };
      addChannels(partName, channels, configuration, undefined, valuePath, context);
      addStates(partName, states, configuration, `${valuePath}/states`, context);
    }
  }
}

function addStates(partName, states, configuration, path, context) {
  if (states == null) return;
  const allowed = new Set(context.contract.states ?? []);
  for (const state of Object.keys(states).sort(byCodeUnit)) {
    const statePath = `${path}/${state}`;
    if (!allowed.has(state) || state === REST_STATE) {
      context.problems.push(
        conflict(
          context.recordId,
          statePath,
          state === REST_STATE
            ? "visuals for the default state go outside states"
            : `visuals state ${state} is not in contract.states`,
        ),
      );
      continue;
    }
    addChannels(partName, states[state], configuration, state, statePath, context);
  }
}

function addChannels(partName, channels, configuration, state, path, context) {
  if (channels == null) return;
  const { recordId, tokenNames, problems, mappings } = context;
  for (const channel of Object.keys(channels).sort(byCodeUnit)) {
    const source = `${path}/${channel}`;
    const raw = channels[channel];
    const token = VISUAL_LITERALS.includes(raw) ? { literal: raw } : { name: raw };
    if (token.name && tokenNames != null && !tokenNames.has(token.name)) {
      problems.push(
        conflict(recordId, source, `mapped token ${token.name} is missing from the token package`),
      );
    }
    const mapping = { part: partName, channel, token, source };
    if (configuration) mapping.configuration = { ...configuration };
    if (state) mapping.state = state;
    mappings.push(mapping);
  }
}

function reservedAxisNameProblems(contract, recordId) {
  return RESERVED_PART_KEYS.filter(
    (name) =>
      Object.hasOwn(contract.parameters ?? {}, name) ||
      Object.hasOwn(contract.configurationAxes ?? {}, name),
  ).map((name) =>
    conflict(
      recordId,
      `/contract/parameters/${name}`,
      `${name} is reserved in visuals and cannot be a parameter or configuration axis`,
    ),
  );
}

/** `default` is the rest state, so it can only come last in the priority list. */
function stateOrderProblems(contract, recordId) {
  const states = contract.states ?? [];
  const at = states.indexOf(REST_STATE);
  if (at === -1 || at === states.length - 1) return [];
  return [
    conflict(
      recordId,
      `/contract/states/${at}`,
      "default is the rest state and must come last, after the states that override it",
    ),
  ];
}

function buildVisualCoverage(contract) {
  const visuals = contract.visuals ?? {};
  const parts = {};
  const usedAxes = new Set();

  for (const partName of Object.keys(visuals).sort(byCodeUnit)) {
    const node = visuals[partName];
    const axes = [];
    const values = {};
    const states = new Set();
    const channels = new Set();

    collectChannels(node.base, channels);
    collectStates(node.states, states, channels);

    for (const axis of Object.keys(node)
      .filter((key) => !RESERVED_PART_KEYS.includes(key))
      .sort(byCodeUnit)) {
      axes.push(axis);
      usedAxes.add(axis);
      values[axis] = Object.keys(node[axis]).sort(byCodeUnit);
      for (const body of Object.values(node[axis])) {
        const { states: valueStates, ...rest } = body;
        collectChannels(rest, channels);
        collectStates(valueStates, states, channels);
      }
    }

    const coverage = {
      axes,
      values,
      states: [...states].sort(byCodeUnit),
      channels: VISUAL_CHANNELS.filter((channel) => channels.has(channel)),
    };
    const missingValues = missingAxisValues(axes, values, contract);
    if (Object.keys(missingValues).length > 0) coverage.missingValues = missingValues;
    parts[partName] = coverage;
  }

  const uncoveredParts = (contract.anatomy ?? [])
    .map((item) => item.name)
    .filter((name) => !Object.hasOwn(parts, name))
    .sort(byCodeUnit);
  const uncoveredAxes = [
    ...Object.keys(contract.parameters ?? {}),
    ...Object.keys(contract.configurationAxes ?? {}),
  ]
    .filter((name) => !usedAxes.has(name))
    .sort(byCodeUnit);

  return { parts, uncoveredParts, uncoveredAxes };
}

function collectChannels(channels, into) {
  for (const channel of Object.keys(channels ?? {})) into.add(channel);
}

function collectStates(states, stateSet, channels) {
  for (const [state, body] of Object.entries(states ?? {})) {
    stateSet.add(state);
    collectChannels(body, channels);
  }
}

function missingAxisValues(axes, authoredValues, contract) {
  const missing = {};
  for (const axis of axes) {
    const allowed = configurationValues(
      axis,
      contract.parameters ?? {},
      contract.configurationAxes ?? {},
    );
    // A string parameter accepts any value, so it has none to be missing.
    if (!(allowed instanceof Set)) continue;
    const authored = new Set(authoredValues[axis] ?? []);
    const absent = [...allowed].filter((value) => !authored.has(value)).sort(byCodeUnit);
    if (absent.length > 0) missing[axis] = absent;
  }
  return missing;
}

/**
 * Two rows for one channel and state whose configurations can both apply, where neither
 * is more specific, leave the resolved value to chance.
 */
function overlappingAssignmentProblems(mappings, recordId) {
  const problems = [];
  for (let i = 0; i < mappings.length; i += 1) {
    for (let j = i + 1; j < mappings.length; j += 1) {
      const left = mappings[i];
      const right = mappings[j];
      if (left.part !== right.part || left.channel !== right.channel) continue;
      if ((left.state ?? "") !== (right.state ?? "")) continue;
      if (!configurationsCanApplyTogether(left.configuration, right.configuration)) continue;
      if (
        isMoreSpecific(left.configuration, right.configuration) ||
        isMoreSpecific(right.configuration, left.configuration)
      ) {
        continue;
      }
      problems.push(
        conflict(
          recordId,
          left.source,
          `visuals ${left.part} ${left.channel} assigns overlapping ${formatConfig(left.configuration)} and ${formatConfig(right.configuration)} rules`,
        ),
      );
    }
  }
  return problems;
}

function configurationMatches(mappingConfiguration, provided) {
  for (const [key, value] of Object.entries(mappingConfiguration ?? {})) {
    if (provided[key] !== value) return false;
  }
  return true;
}

function configurationsCanApplyTogether(left, right) {
  const other = right ?? {};
  for (const [key, value] of Object.entries(left ?? {})) {
    if (Object.hasOwn(other, key) && other[key] !== value) return false;
  }
  return true;
}

function isMoreSpecific(left, right) {
  const specific = left ?? {};
  const general = right ?? {};
  const generalKeys = Object.keys(general);
  if (generalKeys.length === 0) return Object.keys(specific).length > 0;
  for (const key of generalKeys) {
    if (specific[key] !== general[key]) return false;
  }
  return Object.keys(specific).length > generalKeys.length;
}

/** Values a configuration key may take, or null when it names no parameter or axis. */
export function configurationValues(key, parameters, configurationAxes) {
  if (Object.hasOwn(configurationAxes, key)) {
    return new Set(configurationAxes[key].values ?? []);
  }
  const parameter = parameters[key];
  if (!parameter) return null;
  if (parameter.kind === "enum") return new Set(Object.keys(parameter.values ?? {}));
  if (parameter.kind === "boolean") return new Set(BOOLEAN_CONFIGURATION_VALUES);
  if (parameter.kind === "string") return { has: () => true };
  return null;
}

function sortMappings(mappings) {
  return [...mappings].sort(
    (left, right) =>
      byCodeUnit(left.part, right.part) ||
      byCodeUnit(left.channel, right.channel) ||
      byCodeUnit(
        serializeConfiguration(left.configuration),
        serializeConfiguration(right.configuration),
      ) ||
      byCodeUnit(left.state ?? "", right.state ?? ""),
  );
}

function serializeConfiguration(configuration) {
  return Object.entries(configuration ?? {})
    .sort(([left], [right]) => byCodeUnit(left, right))
    .map(([key, value]) => `${key}=${value}`)
    .join(",");
}

function formatConfig(configuration) {
  return serializeConfiguration(configuration) || "shared";
}

function conflict(recordId, path, message) {
  return problem({ code: PROBLEM.SOURCE_CONFLICT, message, recordId, path });
}

/** A new axis value with no visuals compiles, but should not do so silently. */
function missingValueWarnings(coverage, recordId) {
  return Object.entries(coverage.parts ?? {}).flatMap(([part, { missingValues }]) =>
    Object.entries(missingValues ?? {}).flatMap(([axis, values]) =>
      values.map((value) =>
        problem({
          code: PROBLEM.VISUAL_MISSING_VALUE,
          message: `${recordId} part ${part} has visuals for ${axis} but none for ${axis}=${value}`,
          recordId,
          path: `/contract/visuals/${part}/${axis}`,
          severity: "warning",
        }),
      ),
    ),
  );
}
