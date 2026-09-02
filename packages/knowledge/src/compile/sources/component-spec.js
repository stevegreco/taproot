import yaml from "js-yaml";
import { PROBLEM, problem } from "../tables.js";

/**
 * @param {string} text
 * @param {{ path: string, recordId: string }} context
 */
export function readComponentSpec(text, context) {
  let spec;
  try {
    spec = yaml.load(text);
  } catch (error) {
    return unreadable(context, error instanceof Error ? error.message : "YAML parse failure");
  }

  if (spec == null || typeof spec !== "object" || Array.isArray(spec)) {
    return unreadable(context, "component spec root must be a mapping");
  }

  if (spec.specVersion !== 1) {
    return unreadable(context, "component spec specVersion must be 1");
  }

  /** @type {Record<string, unknown>} */
  const fields = {
    contract: {
      specVersion: spec.specVersion,
      tagName: spec.tagName ?? "",
      description: spec.description ?? "",
      usage: spec.usage ?? { do: [], avoid: [] },
      anatomy: spec.anatomy ?? [],
      api: spec.api ?? { attributes: {} },
      states: spec.states ?? [],
      behavior: spec.behavior ?? [],
      accessibility: spec.accessibility ?? {},
      rationale: Array.isArray(spec.decisions) ? spec.decisions : [],
    },
  };

  if (spec.tokens && typeof spec.tokens === "object") {
    fields.tokens = {
      tier: spec.tokens.tier,
      namespace: spec.tokens.namespace,
      description: spec.tokens.description ?? "",
    };
  }

  return { fields, problems: [] };
}

function unreadable(context, detail) {
  return {
    fields: {},
    problems: [
      problem({
        code: PROBLEM.SOURCE_UNREADABLE,
        message: `component spec is unreadable: ${detail}`,
        recordId: context.recordId,
        path: context.path,
      }),
    ],
  };
}
