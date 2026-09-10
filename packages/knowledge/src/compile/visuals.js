import { PROBLEM, problem } from "./tables.js";

export const VISUAL_LITERALS = Object.freeze(["transparent", "inherit", "none"]);

export const VISUAL_CHANNELS = Object.freeze([
  "background",
  "foreground",
  "border",
  "outline",
  "padding-inline",
  "padding-block",
  "radius",
  "gap",
  "font-family",
  "font-size",
  "font-weight",
  "line-height",
  "letter-spacing",
  "transition",
  "transition-duration",
  "transition-timing-function",
]);

const VISUAL_CHANNEL_SET = new Set(VISUAL_CHANNELS);
const RESERVED_PART_KEYS = Object.freeze(["base", "states"]);
const REST_STATE = "default";
const MOTION_SHORTHAND = "transition";
const MOTION_CLEARED = Object.freeze(["transition-duration", "transition-timing-function"]);
const BOOLEAN_CONFIGURATION_VALUES = Object.freeze(["true", "false"]);

/**
 * Expand compact `visuals` into compiled `mappings` and drop the authored source.
 * Does not mutate the input contract.
 */
export function compileContractVisuals(contract, recordId) {
  if (!contract) return { contract, problems: [] };

  const hasVisuals = Object.hasOwn(contract, "visuals");
  const hasMappings = Object.hasOwn(contract, "mappings");
  if (
    !hasVisuals &&
    !Object.hasOwn(contract, "stateResolution") &&
    !Object.hasOwn(contract, "visualCoverage")
  ) {
    return { contract, problems: [] };
  }

  const next = structuredClone(contract);
  const problems = [];

  if (hasVisuals && hasMappings) {
    problems.push(
      conflict(
        recordId,
        "/contract/visuals",
        "contract cannot author both visuals and mappings",
      ),
    );
  }

  if (Object.hasOwn(next, "visualCoverage")) {
    problems.push(
      conflict(
        recordId,
        "/contract/visualCoverage",
        "visualCoverage is generated from visuals and cannot be authored",
      ),
    );
    delete next.visualCoverage;
  }

  problems.push(...stateResolutionProblems(next, recordId));

  if (hasVisuals) {
    const expanded = expandVisuals(next, recordId);
    problems.push(...expanded.problems);
    next.mappings = expanded.mappings;
    next.visualCoverage = buildVisualCoverage(next);
    delete next.visuals;
  }

  return { contract: next, problems };
}

/**
 * Compile grouped visuals into deterministic partial mapping rows.
 */
export function expandVisuals(contract, recordId) {
  const problems = [];
  const visuals = contract.visuals ?? {};
  const mappings = [];
  const parts = new Set((contract.anatomy ?? []).map((item) => item.name));
  const parameters = contract.parameters ?? {};
  const configurationAxes = contract.configurationAxes ?? {};

  problems.push(...reservedAxisNameProblems(parameters, configurationAxes, recordId));

  for (const partName of Object.keys(visuals).sort(compareKey)) {
    const path = `/contract/visuals/${partName}`;
    if (!parts.has(partName)) {
      problems.push(conflict(recordId, path, `visuals part ${partName} is not in anatomy`));
      continue;
    }
    const node = visuals[partName];
    if (!isPlainObject(node)) {
      problems.push(conflict(recordId, path, `visuals part ${partName} must be an object`));
      continue;
    }
    const expanded = expandPart(partName, node, contract, recordId, path);
    problems.push(...expanded.problems);
    mappings.push(...expanded.mappings);
  }

  const sorted = sortMappings(mappings);
  problems.push(...overlappingAssignmentProblems(sorted, recordId));
  problems.push(...independentChannelProblems(sorted, contract.stateResolution, recordId));
  return { mappings: sorted, problems };
}

/**
 * Resolve partial mapping rows for one configuration and simultaneous states.
 * Rows are grouped by anatomy part. Base (no state, specificity 0) applies
 * first, then `default`, then overlay, then suppress winners, then independent
 * states. At the same layer, more configuration keys win. Independent states
 * must not share channels with overlay or suppress winners; the compiler rejects
 * that overlap so independence is orthogonal, not last-write-wins.
 * `transition: none` clears duration/easing on the same part.
 */
export function resolveMappings(mappings, stateResolution = {}, options = {}) {
  const configuration = options.configuration ?? {};
  const requested = new Set(options.states ?? []);
  const problems = [];
  const active = applySuppression(requested, stateResolution);
  const layers = layerStates(active, stateResolution);
  /** @type {Map<string, Map<string, object>>} */
  const resolved = new Map();
  /** @type {Map<string, { layer: number, specificity: number, state: string }>} */
  const sources = new Map();

  for (const mapping of mappings ?? []) {
    if (options.part && mapping.part !== options.part) continue;
    if (!configurationMatches(mapping.configuration, configuration)) continue;
    const layer = mappingLayer(mapping.state, layers);
    if (layer < 0) continue;
    const key = `${mapping.part}\0${mapping.channel}`;
    const specificity = Object.keys(mapping.configuration ?? {}).length;
    const previous = sources.get(key);
    if (
      previous &&
      previous.layer === layer &&
      previous.specificity === specificity &&
      previous.state !== (mapping.state ?? "")
    ) {
      problems.push({
        code: PROBLEM.SOURCE_CONFLICT,
        message: `resolved ${mapping.part} ${mapping.channel} is ambiguous between ${previous.state || "base"} and ${mapping.state}`,
        path: mapping.source ?? null,
      });
    }
    if (
      !previous ||
      previous.layer < layer ||
      (previous.layer === layer && previous.specificity < specificity)
    ) {
      if (!resolved.has(mapping.part)) resolved.set(mapping.part, new Map());
      resolved.get(mapping.part).set(mapping.channel, {
        part: mapping.part,
        channel: mapping.channel,
        token: mapping.token,
        configuration: mapping.configuration,
        state: mapping.state,
      });
      sources.set(key, { layer, specificity, state: mapping.state ?? "" });
    }
  }

  const parts = {};
  for (const [part, channels] of [...resolved.entries()].sort(([left], [right]) =>
    left.localeCompare(right),
  )) {
    if (isNone(channels.get(MOTION_SHORTHAND)?.token)) {
      for (const channel of MOTION_CLEARED) channels.delete(channel);
    }
    const selected = {};
    for (const channel of VISUAL_CHANNELS) {
      const row = channels.get(channel);
      if (row) selected[channel] = row;
    }
    parts[part] = selected;
  }

  const partNames = Object.keys(parts);
  const selectedPart = options.part ?? (partNames.length === 1 ? partNames[0] : undefined);
  const result = { parts, problems };
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
  contract.mappings = contract.mappings.map((mapping) => {
    if (!Object.hasOwn(mapping, "source")) return mapping;
    const { source: _source, ...row } = mapping;
    return row;
  });
  return contract;
}

function expandPart(partName, node, contract, recordId, path) {
  const mappings = [];
  const problems = [];

  if (Object.hasOwn(node, "base")) {
    mappings.push(
      ...channelMappings(partName, node.base, undefined, undefined, recordId, `${path}/base`, problems),
    );
  }
  if (Object.hasOwn(node, "states")) {
    problems.push(
      ...expandStateBlock(partName, node.states, undefined, contract, recordId, `${path}/states`, mappings),
    );
  }

  for (const axis of Object.keys(node).filter((key) => !RESERVED_PART_KEYS.includes(key)).sort(compareKey)) {
    const allowed = configurationValues(axis, contract.parameters ?? {}, contract.configurationAxes ?? {});
    const axisPath = `${path}/${axis}`;
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
    const values = node[axis];
    if (!isPlainObject(values)) {
      problems.push(conflict(recordId, axisPath, `visuals axis ${axis} must be an object`));
      continue;
    }
    for (const value of Object.keys(values).sort(compareKey)) {
      const valuePath = `${axisPath}/${value}`;
      if (!allowed.has(value)) {
        problems.push(
          conflict(recordId, valuePath, `visuals configuration ${axis} has unknown value ${value}`),
        );
        continue;
      }
      const body = values[value];
      if (!isPlainObject(body)) {
        problems.push(conflict(recordId, valuePath, `visuals ${axis} ${value} must be an object`));
        continue;
      }
      const configuration = { [axis]: value };
      const rest = Object.fromEntries(
        Object.entries(body).filter(([key]) => key !== "states"),
      );
      const restState = Object.hasOwn(body, "states") && (contract.states ?? []).includes(REST_STATE)
        ? REST_STATE
        : undefined;
      mappings.push(
        ...channelMappings(partName, rest, configuration, restState, recordId, valuePath, problems),
      );
      if (Object.hasOwn(body, "states")) {
        problems.push(
          ...expandStateBlock(
            partName,
            body.states,
            configuration,
            contract,
            recordId,
            `${valuePath}/states`,
            mappings,
          ),
        );
      }
    }
  }

  return { mappings, problems };
}

function expandStateBlock(partName, states, configuration, contract, recordId, path, mappings) {
  const problems = [];
  if (!isPlainObject(states)) {
    problems.push(conflict(recordId, path, "visuals states must be an object"));
    return problems;
  }
  const allowed = new Set(contract.states ?? []);
  for (const state of Object.keys(states).sort(compareKey)) {
    const statePath = `${path}/${state}`;
    if (!allowed.has(state)) {
      problems.push(
        conflict(recordId, statePath, `visuals state ${state} is not in contract.states`),
      );
      continue;
    }
    mappings.push(
      ...channelMappings(partName, states[state], configuration, state, recordId, statePath, problems),
    );
  }
  return problems;
}

function channelMappings(partName, channels, configuration, state, recordId, path, problems) {
  if (channels == null) return [];
  if (!isPlainObject(channels)) {
    problems.push(conflict(recordId, path, "visuals channels must be an object"));
    return [];
  }
  const mappings = [];
  for (const channel of Object.keys(channels).sort(compareKey)) {
    const channelPath = `${path}/${channel}`;
    if (!VISUAL_CHANNEL_SET.has(channel)) {
      problems.push(conflict(recordId, channelPath, `visuals channel ${channel} is not a known channel`));
      continue;
    }
    const token = parseChannelValue(channels[channel], recordId, channelPath, problems);
    if (!token) continue;
    const mapping = { part: partName, channel, token, source: channelPath };
    if (configuration && Object.keys(configuration).length > 0) mapping.configuration = { ...configuration };
    if (state) mapping.state = state;
    mappings.push(mapping);
  }
  return mappings;
}

function parseChannelValue(raw, recordId, path, problems) {
  if (typeof raw !== "string" || raw.length === 0) {
    problems.push(conflict(recordId, path, "visuals values must be a token name or closed literal"));
    return null;
  }
  if (VISUAL_LITERALS.includes(raw)) return { literal: raw };
  return { name: raw };
}

function reservedAxisNameProblems(parameters, configurationAxes, recordId) {
  const problems = [];
  for (const name of RESERVED_PART_KEYS) {
    if (Object.hasOwn(parameters, name) || Object.hasOwn(configurationAxes, name)) {
      problems.push(
        conflict(
          recordId,
          `/contract/parameters/${name}`,
          `${name} is reserved in visuals and cannot be a parameter or configuration axis`,
        ),
      );
    }
  }
  return problems;
}

function stateResolutionProblems(contract, recordId) {
  const resolution = contract.stateResolution;
  if (!resolution) return [];
  const problems = [];
  const states = new Set(contract.states ?? []);
  const path = "/contract/stateResolution";

  for (const [winner, losers] of Object.entries(resolution.suppress ?? {})) {
    checkResolutionState(winner, states, recordId, `${path}/suppress/${winner}`, problems);
    if (winner === REST_STATE) {
      problems.push(conflict(recordId, `${path}/suppress/${winner}`, "stateResolution cannot suppress from default"));
    }
    for (const [index, loser] of (losers ?? []).entries()) {
      checkResolutionState(loser, states, recordId, `${path}/suppress/${winner}/${index}`, problems);
      if (loser === REST_STATE) {
        problems.push(
          conflict(recordId, `${path}/suppress/${winner}/${index}`, "stateResolution cannot suppress default"),
        );
      }
      if (loser === winner) {
        problems.push(conflict(recordId, `${path}/suppress/${winner}`, `${winner} cannot suppress itself`));
      }
    }
  }

  for (const [index, state] of (resolution.overlay ?? []).entries()) {
    checkResolutionState(state, states, recordId, `${path}/overlay/${index}`, problems);
    if (state === REST_STATE) {
      problems.push(conflict(recordId, `${path}/overlay/${index}`, "stateResolution overlay cannot include default"));
    }
  }

  for (const [index, state] of (resolution.independent ?? []).entries()) {
    checkResolutionState(state, states, recordId, `${path}/independent/${index}`, problems);
    if (state === REST_STATE) {
      problems.push(
        conflict(recordId, `${path}/independent/${index}`, "stateResolution independent cannot include default"),
      );
    }
  }

  return problems;
}

function checkResolutionState(state, states, recordId, path, problems) {
  if (!states.has(state)) {
    problems.push(conflict(recordId, path, `stateResolution state ${state} is not in contract.states`));
  }
}

function independentChannelProblems(mappings, stateResolution, recordId) {
  const independent = new Set(stateResolution?.independent ?? []);
  const contested = new Set([
    ...(stateResolution?.overlay ?? []),
    ...Object.keys(stateResolution?.suppress ?? {}),
  ]);
  if (independent.size === 0 || contested.size === 0) return [];

  const problems = [];
  for (let i = 0; i < mappings.length; i += 1) {
    for (let j = i + 1; j < mappings.length; j += 1) {
      const left = mappings[i];
      const right = mappings[j];
      if (left.part !== right.part || left.channel !== right.channel) continue;
      if (!configurationsCanApplyTogether(left.configuration, right.configuration)) continue;
      const leftIndependent = independent.has(left.state);
      const rightIndependent = independent.has(right.state);
      if (leftIndependent === rightIndependent) continue;
      const independentRow = leftIndependent ? left : right;
      const other = leftIndependent ? right : left;
      if (!contested.has(other.state)) continue;
      problems.push(
        conflict(
          recordId,
          independentRow.source ?? `/contract/visuals/${independentRow.part}`,
          `independent state ${independentRow.state} cannot share ${independentRow.part} ${independentRow.channel} with ${other.state}`,
        ),
      );
    }
  }
  return problems;
}

function buildVisualCoverage(contract) {
  const visuals = contract.visuals ?? {};
  const parts = {};
  const usedAxes = new Set();

  for (const partName of Object.keys(visuals).sort(compareKey)) {
    const node = visuals[partName];
    if (!isPlainObject(node)) continue;
    const axes = [];
    const values = {};
    const states = new Set();
    const channels = new Set();

    collectChannels(node.base, channels);
    collectStates(node.states, states, channels);

    for (const axis of Object.keys(node).filter((key) => !RESERVED_PART_KEYS.includes(key)).sort(compareKey)) {
      const axisValues = node[axis];
      if (!isPlainObject(axisValues)) continue;
      axes.push(axis);
      usedAxes.add(axis);
      const authored = [];
      for (const value of Object.keys(axisValues).sort(compareKey)) {
        authored.push(value);
        const body = axisValues[value];
        if (!isPlainObject(body)) continue;
        const rest = Object.fromEntries(Object.entries(body).filter(([key]) => key !== "states"));
        collectChannels(rest, channels);
        if (Object.hasOwn(body, "states")) {
          if (Object.keys(rest).length > 0) states.add(REST_STATE);
          collectStates(body.states, states, channels);
        }
      }
      values[axis] = authored;
    }

    const coverage = {
      axes,
      values,
      states: [...states].sort(compareKey),
      channels: VISUAL_CHANNELS.filter((channel) => channels.has(channel)),
    };
    const missingValues = missingAxisValues(axes, values, contract);
    if (Object.keys(missingValues).length > 0) coverage.missingValues = missingValues;
    parts[partName] = coverage;
  }

  const uncoveredParts = (contract.anatomy ?? [])
    .map((item) => item.name)
    .filter((name) => !Object.hasOwn(parts, name))
    .sort(compareKey);
  const uncoveredAxes = [
    ...Object.keys(contract.parameters ?? {}),
    ...Object.keys(contract.configurationAxes ?? {}),
  ]
    .filter((name) => !usedAxes.has(name) && !RESERVED_PART_KEYS.includes(name))
    .sort(compareKey);

  return { parts, uncoveredParts, uncoveredAxes };
}

function collectChannels(channels, into) {
  if (!isPlainObject(channels)) return;
  for (const channel of Object.keys(channels)) {
    if (VISUAL_CHANNEL_SET.has(channel)) into.add(channel);
  }
}

function collectStates(states, stateSet, channels) {
  if (!isPlainObject(states)) return;
  for (const [state, body] of Object.entries(states)) {
    stateSet.add(state);
    collectChannels(body, channels);
  }
}

function missingAxisValues(axes, authoredValues, contract) {
  const missing = {};
  for (const axis of axes) {
    const allowed = configurationValues(axis, contract.parameters ?? {}, contract.configurationAxes ?? {});
    if (!allowed || typeof allowed.has !== "function" || !allowed[Symbol.iterator]) continue;
    const authored = new Set(authoredValues[axis] ?? []);
    const absent = [...allowed].filter((value) => !authored.has(value)).sort(compareKey);
    if (absent.length > 0) missing[axis] = absent;
  }
  return missing;
}

function overlappingAssignmentProblems(mappings, recordId) {
  const problems = [];
  for (let i = 0; i < mappings.length; i += 1) {
    for (let j = i + 1; j < mappings.length; j += 1) {
      const left = mappings[i];
      const right = mappings[j];
      if (left.part !== right.part || left.channel !== right.channel) continue;
      if (mappingIdentity(left) === mappingIdentity(right)) continue;
      if (!configurationsCanApplyTogether(left.configuration, right.configuration)) continue;
      if (sameConfiguration(left.configuration, right.configuration)) continue;
      if (
        isMoreSpecific(left.configuration, right.configuration) ||
        isMoreSpecific(right.configuration, left.configuration)
      ) {
        continue;
      }
      problems.push(
        conflict(
          recordId,
          left.source ?? `/contract/visuals/${left.part}`,
          `visuals ${left.part} ${left.channel} assigns overlapping ${formatConfig(left.configuration)} and ${formatConfig(right.configuration)} rules`,
        ),
      );
    }
  }
  return problems;
}

function applySuppression(requested, stateResolution) {
  const active = new Set(requested);
  for (const [winner, losers] of Object.entries(stateResolution?.suppress ?? {})) {
    if (!active.has(winner)) continue;
    for (const loser of losers ?? []) active.delete(loser);
  }
  return active;
}

function layerStates(active, stateResolution) {
  const overlay = stateResolution?.overlay ?? [];
  const independent = new Set(stateResolution?.independent ?? []);
  const suppressWinners = Object.keys(stateResolution?.suppress ?? {});
  const layers = new Map();
  let rank = 2;
  layers.set(REST_STATE, 1);
  for (const state of overlay) {
    if (active.has(state) && !independent.has(state)) layers.set(state, rank++);
  }
  for (const state of suppressWinners.sort(compareKey)) {
    if (active.has(state) && !independent.has(state) && !layers.has(state)) layers.set(state, rank++);
  }
  for (const state of [...independent].sort(compareKey)) {
    if (active.has(state)) layers.set(state, rank++);
  }
  for (const state of [...active].sort(compareKey)) {
    if (!layers.has(state) && state !== REST_STATE) {
      layers.set(state, rank++);
    }
  }
  return layers;
}

function mappingLayer(state, layers) {
  if (!state) return 0;
  return layers.has(state) ? layers.get(state) : -1;
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

function sameConfiguration(left, right) {
  return serializeConfiguration(left) === serializeConfiguration(right);
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

function configurationValues(key, parameters, configurationAxes) {
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
  return [...mappings].sort((left, right) => {
    return (
      left.part.localeCompare(right.part) ||
      left.channel.localeCompare(right.channel) ||
      serializeConfiguration(left.configuration).localeCompare(serializeConfiguration(right.configuration)) ||
      (left.state ?? "").localeCompare(right.state ?? "")
    );
  });
}

function mappingIdentity(mapping) {
  return `${mapping.part}\0${mapping.channel}\0${serializeConfiguration(mapping.configuration)}\0${mapping.state ?? ""}`;
}

function serializeConfiguration(configuration) {
  return Object.entries(configuration ?? {})
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join(",");
}

function formatConfig(configuration) {
  return serializeConfiguration(configuration) || "shared";
}

function isNone(token) {
  return token?.literal === "none";
}

function isPlainObject(value) {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

function compareKey(left, right) {
  return left.localeCompare(right);
}

function conflict(recordId, path, message) {
  return problem({
    code: PROBLEM.SOURCE_CONFLICT,
    message,
    recordId,
    path,
  });
}
