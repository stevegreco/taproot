import { PROBLEM, problem } from "../tables.js";

/**
 * ADR sources contribute provenance on `sources[]`. The decision body stays
 * in the domain package that owns the ADR.
 *
 * @param {string} text
 * @param {{ path: string, recordId: string }} context
 */
export function readAdr(text, context) {
  const heading = /^#\s+(.+)$/m.exec(text);
  const status = /^\*\*Status:\*\*\s+(.+)$/m.exec(text);

  if (!heading || !status) {
    return {
      fields: {},
      problems: [
        problem({
          code: PROBLEM.SOURCE_UNREADABLE,
          message: "ADR is missing an ATX heading or **Status:** line",
          recordId: context.recordId,
          path: context.path,
        }),
      ],
    };
  }

  // heading and status validate ADR shape. Provenance is the source path and
  // revision on sources[]; compiled records do not copy those fields out.
  return {
    fields: {},
    problems: [],
  };
}
