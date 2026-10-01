import { validateKnowledge } from "./index.js";
import { loadImplementations, renderImplementation } from "./implementation.js";
import { editDistance, typoAllowance } from "./util.js";

/**
 * The operations behind both the CLI and the MCP server. Each returns `{ text, data, ok }`:
 * Markdown for agents, the library's return value for `--json`, and whether the call found what
 * it was asked for. A call that found nothing also returns `error`, with a stable code to branch
 * on and what the caller probably meant.
 *
 * @typedef {"ERR_UNKNOWN_RECORD" | "ERR_UNKNOWN_SECTION" | "ERR_UNKNOWN_IMPLEMENTATION" | "ERR_NO_IMPLEMENTATION"} ErrorCode
 * @typedef {{ code: ErrorCode, suggestions: string[] }} ResultError
 * @typedef {{ text: string, data: unknown, ok: boolean, error?: ResultError }} Result
 */

const cell = (value) =>
  String(value ?? "")
    .replaceAll("|", "\\|")
    .replaceAll("\n", " ");

/** @param {{ id: string, title: string, summary: string }[]} items */
function summaryList(items) {
  return items.map((item) => `- ${item.id} — ${item.title}: ${item.summary}`).join("\n");
}

export function list(knowledge, { type, tag, status } = {}) {
  const data = knowledge.list({ type, tag, status });
  return { text: data.length ? summaryList(data) : "No records match.", data, ok: true };
}

/**
 * @param {{ implementations?: Record<string, string>, next?: (id: string, implementation?: string) => string }} [options]
 *   With `next`, each result is followed by the call that reads it, with its implementation when
 *   it has one.
 */
export function search(knowledge, { query, type, tag, limit } = {}, options = {}) {
  if (!query || !query.trim()) throw new UsageError("search needs a query");
  const data = knowledge.search(query, { type, tags: tag ? [tag] : undefined, limit });
  if (data.length === 0) return { text: `No results for "${query}".`, data, ok: true };
  if (!options.next) return { text: summaryList(data), data, ok: true };
  const implemented = implementationIndex(options.implementations ?? {});
  const text = data
    .map(
      (item) =>
        `- ${item.id} — ${item.title}: ${item.summary}\n  → ${options.next(item.id, implemented.get(item.id)?.[0])}`,
    )
    .join("\n");
  return { text, data, ok: true };
}

const shortName = (id) => id.slice(id.indexOf(".") + 1);
const squash = (text) =>
  String(text)
    .toLowerCase()
    .replace(/[\s_-]+/g, "");

/**
 * The record id a caller meant: the id itself, or a name that matches exactly one record by the
 * part of its id after the type or by its title, ignoring case, spaces, and hyphens. `button`,
 * `Text field`, and `textfield` all find their component.
 *
 * @returns {string | undefined}
 */
export function resolveId(knowledge, input) {
  if (knowledge.get(input)) return input;
  const wanted = squash(input);
  if (!wanted) return undefined;
  const matches = knowledge
    .list()
    .filter((record) => squash(shortName(record.id)) === wanted || squash(record.title) === wanted);
  return matches.length === 1 ? matches[0].id : undefined;
}

/** Split `id#section` and resolve the id part. */
function resolveTarget(knowledge, target) {
  const hash = target.indexOf("#");
  const typed = hash === -1 ? target : target.slice(0, hash);
  const section = hash === -1 ? undefined : target.slice(hash + 1);
  return { typed, id: resolveId(knowledge, typed), section };
}

/**
 * @param {{ target: string, implementation?: string }} args `implementation` names a configured
 *   implementation, such as `web`, to print after the record.
 * @param {{ implementations?: Record<string, string>, hint?: (id: string, names: string[]) => string }} [options]
 *   Implementation folders by name, and the line that tells the caller how to ask for one.
 */
export function get(knowledge, { target: typedTarget, implementation }, options = {}) {
  if (!typedTarget) throw new UsageError("get needs an id or id#section");
  const { typed, id, section } = resolveTarget(knowledge, typedTarget);
  if (!id) return notFound(knowledge, typed);
  const record = knowledge.get(id);
  const target = section === undefined ? id : `${id}#${section}`;
  const folders = options.implementations ?? {};
  if (implementation !== undefined) {
    if (section !== undefined) {
      throw new UsageError("an implementation goes with a whole record, not a section");
    }
    return getWithImplementation(knowledge, record, implementation, folders);
  }
  if (section === undefined) {
    const names = record.type === "component" ? (implementationIndex(folders).get(id) ?? []) : [];
    const hint = names.length && options.hint ? `\n${options.hint(id, names)}\n` : "";
    return { text: knowledge.render(target) + hint, data: record, ok: true };
  }
  const found = knowledge.section(target);
  if (!found) {
    const known = record.sections.map((name) => `${id}#${name}`);
    return failure(
      `Unknown section "${target}". Sections: ${known.join(", ") || "none"}.`,
      "ERR_UNKNOWN_SECTION",
      nearest(section, record.sections).map((name) => `${id}#${name}`),
    );
  }
  return { text: knowledge.render(target), data: found, ok: true };
}

function getWithImplementation(knowledge, record, name, folders) {
  const configured = Object.keys(folders);
  if (!folders[name]) {
    const text = configured.length
      ? `No implementation named "${name}". Configured: ${configured.join(", ")}.`
      : "No implementations are configured. Add `implementations` to knowledge.config.json.";
    return failure(text, "ERR_UNKNOWN_IMPLEMENTATION", configured);
  }
  const found = loadImplementations(folders[name]).find((item) => item.component === record.id);
  if (!found) {
    const why =
      record.type === "component"
        ? ""
        : " Only components have implementations; get the components it links to.";
    return failure(
      `No ${name} implementation for ${record.id}.${why}`,
      "ERR_NO_IMPLEMENTATION",
      [],
    );
  }
  return {
    text: `${knowledge.render(record.id)}\n${renderImplementation(record, found, name)}`,
    data: { record, implementation: found },
    ok: true,
  };
}

/**
 * Component id -> the configured implementation names that have a file for it. A folder that
 * cannot be read or parsed is skipped here, so it cannot break `get` or `search`; asking for that
 * implementation reports the error.
 *
 * @param {Record<string, string>} folders
 * @returns {Map<string, string[]>}
 */
function implementationIndex(folders) {
  const index = new Map();
  for (const [name, dir] of Object.entries(folders)) {
    let items;
    try {
      items = loadImplementations(dir);
    } catch {
      continue;
    }
    for (const item of items) {
      if (!index.has(item.component)) index.set(item.component, []);
      index.get(item.component).push(name);
    }
  }
  return index;
}

/** @param {string} text @param {ErrorCode} code @param {string[]} suggestions @returns {Result} */
function failure(text, code, suggestions) {
  return { text, data: null, ok: false, error: { code, suggestions } };
}

/** The candidates within a typo of `input`, nearest first. */
function nearest(input, candidates) {
  const allowance = Math.max(typoAllowance(input), 1);
  return candidates
    .map((candidate) => ({ candidate, distance: editDistance(input, candidate) }))
    .filter(({ distance }) => distance <= allowance)
    .sort((a, b) => a.distance - b.distance)
    .map(({ candidate }) => candidate);
}

/** An unknown record, with the ids the caller probably meant. */
function notFound(knowledge, typed) {
  const wanted = squash(typed);
  const suggestions = knowledge
    .list()
    .map((record) => record.id)
    .filter(
      (id) =>
        // An id fragment, such as "hierarchy", or a name several records share.
        (wanted.length >= 3 && squash(id).includes(wanted)) ||
        // A typo of a name, such as "buton", or of a whole id.
        nearest(wanted, [squash(shortName(id))]).length > 0 ||
        nearest(String(typed).toLowerCase(), [id]).length > 0,
    );
  const hint = suggestions.length ? ` Did you mean: ${suggestions.join(", ")}?` : "";
  return failure(`Unknown record "${typed}".${hint}`, "ERR_UNKNOWN_RECORD", suggestions);
}

export function links(knowledge, { id: typed, kind, direction } = {}) {
  if (!typed) throw new UsageError("links needs a record id");
  const id = resolveId(knowledge, typed);
  if (!id) return notFound(knowledge, typed);
  const data = knowledge.links(id, { kind, direction });
  if (data.length === 0) return { text: `No links for ${id}.`, data, ok: true };
  // A link's kind reads from its `from` side, so a link into this record is grouped apart and shown
  // with both ends: under `alternative (incoming)`, `- component.button → component.badge` means
  // Badge is the alternative to Button.
  const groups = new Map();
  for (const link of data) {
    const heading = link.from === id ? link.kind : `${link.kind} (incoming)`;
    if (!groups.has(heading)) groups.set(heading, []);
    groups.get(heading).push(link);
  }
  const lines = [];
  for (const [heading, group] of groups) {
    lines.push(`## ${heading}`, "");
    for (const link of group) {
      // A link from a parameter value names that value, such as `parameters.variant.danger`.
      const from = link.from === id ? link.fromSection : link.from;
      const source = link.fromSection && link.from !== id ? `${from}#${link.fromSection}` : from;
      let line = source ? `- ${source} → ${link.to}` : `- ${link.to}`;
      if (link.situation) line += `: ${link.situation}`;
      if (link.why) line += ` (${link.why})`;
      lines.push(line);
    }
    lines.push("");
  }
  return { text: lines.join("\n").trimEnd(), data, ok: true };
}

export function rules(knowledge, { id: typed, topic, level, query } = {}) {
  let id;
  if (typed) {
    const target = resolveTarget(knowledge, typed);
    if (!target.id) return notFound(knowledge, target.typed);
    id = target.section === undefined ? target.id : `${target.id}#${target.section}`;
  }
  const data = knowledge.rules({ id, topic, level, query });
  const text = data.length
    ? data.map((r) => `- **${r.level.toUpperCase()}** ${r.address}: ${r.statement}`).join("\n")
    : "No rules match.";
  return { text, data, ok: true };
}

/**
 * @param {{ resolveToken?: (ref: string) => Record<string, string> | undefined }} [options]
 *   Resolve values with this instead of the resolver the knowledge was loaded with.
 */
export function tokens(
  knowledge,
  { id: typed, part, condition, property, resolve } = {},
  options = {},
) {
  if (!typed) throw new UsageError("tokens needs a component id");
  const id = resolveId(knowledge, typed);
  if (!id) return notFound(knowledge, typed);
  let data = knowledge.tokens(id, { part, condition, property });
  if (resolve && options.resolveToken) {
    data = data.map((row) => {
      const values = options.resolveToken(row.token);
      return values ? { ...row, values } : row;
    });
  }
  if (!resolve)
    data = data.map((row) => ({
      part: row.part,
      condition: row.condition,
      property: row.property,
      token: row.token,
    }));
  if (data.length === 0) return { text: "No tokens match.", data, ok: true };
  const sets = resolve ? [...new Set(data.flatMap((row) => Object.keys(row.values ?? {})))] : [];
  const header = ["Part", "Condition", "Property", "Token", ...sets];
  const rows = data.map((row) => [
    row.part,
    row.condition,
    row.property,
    `\`${row.token}\``,
    ...sets.map((set) => (row.values?.[set] ? `\`${row.values[set]}\`` : "")),
  ]);
  const table = [header, header.map(() => "---"), ...rows]
    .map((cells) => `| ${cells.map(cell).join(" | ")} |`)
    .join("\n");
  const note =
    resolve && sets.length === 0
      ? "\n\nNo values resolved. Configure `tokens` in knowledge.config.json to resolve values."
      : "";
  return { text: table + note, data, ok: true };
}

/** @param {import("./index.js").LoadOptions} options */
export async function validate(options) {
  const { issues, recordCount } = await validateKnowledge(options);
  return formatIssues(issues, recordCount);
}

/** @param {import("./validate.js").Issue[]} issues */
export function formatIssues(issues, recordCount) {
  const lines = issues.map(
    (i) => `${i.file}${i.line ? `:${i.line}` : ""} ${i.path || "<record>"} ${i.message}`,
  );
  const count =
    issues.length === 0
      ? `OK: ${recordCount} records, no issues.`
      : `${issues.length} issue${issues.length === 1 ? "" : "s"} in ${recordCount} records.`;
  return {
    text: [...lines, count].join("\n"),
    data: { issues, recordCount },
    ok: issues.length === 0,
  };
}

export class UsageError extends Error {}
