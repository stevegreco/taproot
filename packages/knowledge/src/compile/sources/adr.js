import { PROBLEM, problem } from "../tables.js";

/**
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

  return {
    fields: {
      decisions: [
        {
          path: context.path,
          title: heading[1].trim(),
          status: status[1].trim(),
          revision: "",
        },
      ],
    },
    problems: [],
  };
}
