import { validateKnowledge } from "./index.js";
import { loadImplementations, renderImplementation } from "./implementation.js";

/**
 * The operations behind both the CLI and the MCP server. Each returns `{ text, data, ok }`:
 * Markdown for agents, the library's return value for `--json`, and whether the call found what
 * it was asked for.
 *
 * @typedef {{ text: string, data: unknown, ok: boolean }} Result
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

export function search(knowledge, { query, type, tag, limit } = {}) {
  if (!query || !query.trim()) throw new UsageError("search needs a query");
  const data = knowledge.search(query, { type, tags: tag ? [tag] : undefined, limit });
  const text = data.length ? summaryList(data) : `No results for "${query}".`;
  return { text, data, ok: true };
}

/**
 * @param {{ target: string, implementation?: string }} args `implementation` names a configured
 *   implementation, such as `web`, to print after the record.
 * @param {{ implementations?: Record<string, string>, hint?: (id: string, names: string[]) => string }} [options]
 *   Implementation folders by name, and the line that tells the caller how to ask for one.
 */
export function get(knowledge, { target, implementation }, options = {}) {
  if (!target) throw new UsageError("get needs an id or id#section");
  const [id, section] = target.split("#");
  const record = knowledge.get(id);
  if (!record) return notFound(knowledge, `Unknown record "${id}".`, id);
  const folders = options.implementations ?? {};
  if (implementation !== undefined) {
    if (section !== undefined) {
      throw new UsageError("an implementation goes with a whole record, not a section");
    }
    return getWithImplementation(knowledge, record, implementation, folders);
  }
  if (section === undefined) {
    const names = record.type === "component" ? implementedBy(folders, id) : [];
    const hint = names.length && options.hint ? `\n${options.hint(id, names)}\n` : "";
    return { text: knowledge.render(target) + hint, data: record, ok: true };
  }
  const found = knowledge.section(target);
  if (!found) {
    const known = record.sections.map((s) => `${id}#${s}`).join(", ");
    return {
      text: `Unknown section "${target}". Sections: ${known || "none"}.`,
      data: null,
      ok: false,
    };
  }
  return { text: knowledge.render(target), data: found, ok: true };
}

function getWithImplementation(knowledge, record, name, folders) {
  const configured = Object.keys(folders);
  if (!folders[name]) {
    const text = configured.length
      ? `No implementation named "${name}". Configured: ${configured.join(", ")}.`
      : "No implementations are configured. Add `implementations` to knowledge.config.json.";
    return { text, data: null, ok: false };
  }
  const found = loadImplementations(folders[name]).find((item) => item.component === record.id);
  if (!found) {
    return { text: `No ${name} implementation for ${record.id}.`, data: null, ok: false };
  }
  return {
    text: `${knowledge.render(record.id)}\n${renderImplementation(record, found, name)}`,
    data: { record, implementation: found },
    ok: true,
  };
}

/**
 * The configured implementation names that have a file for `id`. A folder that cannot be read or
 * parsed is skipped here, so it cannot break a plain `get`; asking for it reports the error.
 */
function implementedBy(folders, id) {
  return Object.entries(folders)
    .filter(([, dir]) => {
      try {
        return loadImplementations(dir).some((item) => item.component === id);
      } catch {
        return false;
      }
    })
    .map(([name]) => name);
}

function notFound(knowledge, message, id) {
  const near = knowledge
    .list()
    .map((r) => r.id)
    .filter((known) => known.includes(id) || id.includes(known.split(".").at(-1)));
  const hint = near.length ? ` Did you mean: ${near.join(", ")}?` : "";
  return { text: message + hint, data: null, ok: false };
}

export function links(knowledge, { id, kind, direction } = {}) {
  if (!id) throw new UsageError("links needs a record id");
  if (!knowledge.get(id)) return notFound(knowledge, `Unknown record "${id}".`, id);
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

export function rules(knowledge, { id, topic, level, query } = {}) {
  if (id && !knowledge.get(id.split("#")[0])) {
    return notFound(knowledge, `Unknown record "${id}".`, id);
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
export function tokens(knowledge, { id, part, condition, property, resolve } = {}, options = {}) {
  if (!id) throw new UsageError("tokens needs a component id");
  if (!knowledge.get(id)) return notFound(knowledge, `Unknown record "${id}".`, id);
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
