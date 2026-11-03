import { validateSpec } from "./index.js";
import {
  ImplementationError,
  checkImplementation,
  loadImplementations,
  renderImplementation,
} from "./implementation.js";
import { schema } from "./schema/info.js";
import { editDistance, typoAllowance } from "./util.js";
import { TOKEN_KEYWORDS, TOKEN_PROPERTIES } from "./validate.js";

/**
 * The operations behind both the CLI and the MCP server. Each returns `{ text, data, ok }`:
 * Markdown for agents, the library's return value for `--json`, and whether the call found what
 * it was asked for. A call that found nothing also returns `error`, with a stable code to branch
 * on and what the caller probably meant.
 *
 * @typedef {"ERR_UNKNOWN_RECORD" | "ERR_UNKNOWN_SECTION" | "ERR_UNKNOWN_IMPLEMENTATION" | "ERR_NO_IMPLEMENTATION" | "ERR_INVALID_IMPLEMENTATION"} ErrorCode
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

/**
 * @param {{ type?: string, tag?: string, status?: string, implementation?: string }} [args]
 *   `implementation` keeps only the components that implementation has a file for.
 * @param {{ implementations?: Record<string, import("./config.js").ImplementationConfig> }} [options]
 */
export function list(spec, { type, tag, status, implementation } = {}, options = {}) {
  let data = spec.list({ type, tag, status });
  if (implementation !== undefined) {
    const folders = options.implementations ?? {};
    if (!folders[implementation]) return unknownImplementation(implementation, folders);
    const index = implementationIndex(folders);
    data = data.filter((record) => index.get(record.id)?.includes(implementation));
  }
  return { text: data.length ? summaryList(data) : "No records match.", data, ok: true };
}

/**
 * A hit below this score matched no name, title, or tag, only a word or two in the prose. It is
 * marked weak, and when every hit is weak the result says there is no strong match.
 */
export const WEAK_SCORE = 5;

/**
 * @param {{ implementations?: Record<string, import("./config.js").ImplementationConfig>, next?: (id: string, implementations: string[]) => string, browse?: string }} [options]
 *   With `next`, each result is followed by the call that reads it, given every implementation
 *   that has a file for it, in config order, so no technology reads as the default. `browse` names
 *   the call that lists every record, for when nothing fits.
 */
export function search(spec, { query, type, tag, limit } = {}, options = {}) {
  if (!query || !query.trim()) throw new UsageError("search needs a query");
  const data = spec
    .search(query, { type, tags: tag ? [tag] : undefined, limit })
    .map((hit) => ({ ...hit, weak: hit.score < WEAK_SCORE }));
  const fallback = `browse with ${options.browse ?? "`list`"}, or read guideline.compose-or-propose to compose or propose one.`;
  if (data.length === 0) {
    return { text: `No results for "${query}". Try other words, ${fallback}`, data, ok: true };
  }
  const implemented = implementationIndex(options.implementations ?? {});
  const lines = data.map((item) => {
    const line = `- ${item.id} — ${item.title}: ${item.summary}${item.weak ? " (weak match)" : ""}`;
    if (!options.next) return line;
    return `${line}\n  → ${options.next(item.id, implemented.get(item.id) ?? [])}`;
  });
  const text = data[0].weak
    ? [
        `No strong match for "${query}". The closest records follow. If none fits, ${fallback}`,
        "",
        ...lines,
      ].join("\n")
    : lines.join("\n");
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
export function resolveId(spec, input) {
  if (spec.get(input)) return input;
  const wanted = squash(input);
  if (!wanted) return undefined;
  const matches = spec
    .list()
    .filter((record) => squash(shortName(record.id)) === wanted || squash(record.title) === wanted);
  return matches.length === 1 ? matches[0].id : undefined;
}

/** Split `id#section` and resolve the id part. */
function resolveTarget(spec, target) {
  const hash = target.indexOf("#");
  const typed = hash === -1 ? target : target.slice(0, hash);
  const section = hash === -1 ? undefined : target.slice(hash + 1);
  return { typed, id: resolveId(spec, typed), section };
}

/**
 * @param {{ target: string, implementation?: string }} args `implementation` names a configured
 *   implementation, such as `web`, to print after the record.
 * A whole component record leaves out its token table, which is most of its length and rarely
 * needed to choose or use the component. A closing line names the call that reads it.
 *
 * @param {{ implementations?: Record<string, import("./config.js").ImplementationConfig>, implementationHint?: (id: string, names: string[]) => string, tokensHint?: (id: string, count: number) => string }} [options]
 *   Implementations by name, and the lines that tell the caller how to ask for an
 *   implementation or the tokens.
 */
export function get(spec, { target: typedTarget, implementation }, options = {}) {
  if (!typedTarget) throw new UsageError("get needs an id or id#section");
  const { typed, id, section } = resolveTarget(spec, typedTarget);
  if (!id) return notFound(spec, typed);
  const record = spec.get(id);
  const target = section === undefined ? id : `${id}#${section}`;
  const folders = options.implementations ?? {};
  if (implementation !== undefined) {
    if (section !== undefined) {
      throw new UsageError("an implementation goes with a whole record, not a section");
    }
    return getWithImplementation(spec, record, implementation, folders, options);
  }
  if (section === undefined) {
    const names = record.type === "component" ? (implementationIndex(folders).get(id) ?? []) : [];
    const lines = [
      names.length && options.implementationHint?.(id, names),
      tokensLine(spec, record, options),
    ].filter(Boolean);
    const more = lines.length ? `\n${lines.join("\n")}\n` : "";
    return { text: renderWithoutTokens(spec, id) + more, data: record, ok: true };
  }
  const found = spec.section(target);
  // A part's or item's parameter or event can be named without its group, as in
  // `items.section.value` for `items.section.parameters.value`.
  const short = /^((?:parts|items)\.[^.]+)\.(.+)$/.exec(section);
  const full = short
    ? ["parameters", "events"]
        .map((group) => `${short[1]}.${group}.${short[2]}`)
        .filter((name) => record.sections.includes(name))
    : [];
  if (!found && full.length === 1) {
    const resolved = `${id}#${full[0]}`;
    return { text: spec.render(resolved), data: spec.section(resolved), ok: true };
  }
  if (!found) {
    const known = record.sections.map((name) => `${id}#${name}`);
    // A bare name, such as `title`, usually means a section whose path ends in it, such as
    // `anatomy.title` or `parts.title`.
    const meant = [
      ...new Set([
        ...full,
        ...record.sections.filter((name) => name.endsWith(`.${section}`)),
        ...nearest(section, record.sections),
      ]),
    ].map((name) => `${id}#${name}`);
    const didYouMean = meant.length ? ` Did you mean ${meant.join(", ")}?` : "";
    return failure(
      `Unknown section "${target}".${didYouMean} Sections: ${known.join(", ") || "none"}.`,
      "ERR_UNKNOWN_SECTION",
      meant,
    );
  }
  return { text: spec.render(target), data: found, ok: true };
}

const renderWithoutTokens = (spec, id) => spec.render(id, { omit: ["tokens"] });

function tokensLine(spec, record, options) {
  const count = spec.tokens(record.id).length;
  return count > 0 && options.tokensHint ? options.tokensHint(record.id, count) : "";
}

function getWithImplementation(spec, record, name, folders, options) {
  if (!folders[name]) return unknownImplementation(name, folders);
  // A broken file or a mapping that does not match the record fails, rather than serving guidance
  // with missing values or descriptions.
  let found;
  try {
    const { folder, technology } = folders[name];
    found = loadImplementations(folder, technology).find((item) => item.component === record.id);
    if (found) checkImplementation(found, record);
  } catch (error) {
    if (!(error instanceof ImplementationError)) throw error;
    return failure(
      `The ${name} implementation of ${record.id} is invalid: ${error.message}`,
      "ERR_INVALID_IMPLEMENTATION",
      [],
    );
  }
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
  const tokens = tokensLine(spec, record, options);
  return {
    text: `${renderWithoutTokens(spec, record.id)}\n${renderImplementation(record, found, name)}${tokens ? `\n${tokens}\n` : ""}`,
    data: { record, implementation: found },
    ok: true,
  };
}

/**
 * Component id -> the configured implementation names that have a file for it. A folder that
 * cannot be read or parsed is skipped here, so it cannot break `get` or `search`; asking for that
 * implementation reports the error.
 *
 * @param {Record<string, import("./config.js").ImplementationConfig>} folders
 * @returns {Map<string, string[]>}
 */
function implementationIndex(folders) {
  const index = new Map();
  for (const [name, { folder, technology }] of Object.entries(folders)) {
    let items;
    try {
      items = loadImplementations(folder, technology);
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

function unknownImplementation(name, folders) {
  const configured = Object.keys(folders);
  const text = configured.length
    ? `No implementation named "${name}". Configured: ${configured.join(", ")}.`
    : "No implementations are configured. Add `implementations` to spec.config.json.";
  return failure(text, "ERR_UNKNOWN_IMPLEMENTATION", configured);
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
function notFound(spec, typed) {
  const wanted = squash(typed);
  const suggestions = spec
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

export function links(spec, { id: typed, kind, direction } = {}) {
  if (!typed) throw new UsageError("links needs a record id");
  const id = resolveId(spec, typed);
  if (!id) return notFound(spec, typed);
  const data = spec.links(id, { kind, direction });
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
      // A link from a parameter value names that value, such as `parameters.variant.destructive`.
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

/**
 * Each rule as its level, address, statement, and the condition it applies under, if any, so a
 * conditional rule never reads as unconditional.
 *
 * @param {{ detailHint?: (address: string) => string }} [options] The line that tells the caller
 *   how to read a rule's rationale, references, and examples, which the list leaves out.
 */
export function rules(spec, { id: typed, topic, level, query } = {}, options = {}) {
  let id;
  if (typed) {
    const target = resolveTarget(spec, typed);
    if (!target.id) return notFound(spec, target.typed);
    id = target.section === undefined ? target.id : `${target.id}#${target.section}`;
  }
  const data = spec.rules({ id, topic, level, query });
  if (data.length === 0) return { text: "No rules match.", data, ok: true };
  const lines = data.map((r) => {
    const line = `- **${r.level.toUpperCase()}** ${r.address}: ${r.statement}`;
    return r.applicability ? `${line}\n  - Applies when: ${r.applicability}` : line;
  });
  const detailed = data.find((r) => r.rationale || r.references || r.examples);
  const hint = detailed && options.detailHint?.(detailed.address);
  return { text: lines.join("\n") + (hint ? `\n\n${hint}` : ""), data, ok: true };
}

/**
 * @param {{ resolveToken?: (ref: string) => Record<string, string> | undefined }} [options]
 *   Resolve values with this instead of the resolver the spec was loaded with.
 */
export function tokens(spec, { id: typed, part, condition, property, resolve } = {}, options = {}) {
  if (!typed) throw new UsageError("tokens needs a component id");
  const id = resolveId(spec, typed);
  if (!id) return notFound(spec, typed);
  let data = spec.tokens(id, { part, condition, property });
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
  const notes = [
    // A condition's bindings override the base ones, so they are not the whole style.
    condition &&
      condition !== "base" &&
      "Only the bindings for this condition are shown. The `base` bindings still apply where these do not override them.",
    resolve &&
      sets.length === 0 &&
      "No values resolved. Configure `tokens` in spec.config.json to resolve values.",
  ].filter(Boolean);
  return { text: [table, ...notes].join("\n\n"), data, ok: true };
}

const KEYWORD_NOTES = {
  inherit: "the value comes from the surrounding content",
  linear: "for `motion-easing`",
};

/**
 * The parts of the format an implementer needs and records do not repeat: the token binding
 * property names and keywords, condition syntax, anatomy roles, and the system-wide constants with
 * the tokens that hold them. SPEC.md is the full reference.
 *
 * @param {{ resolve?: boolean }} [args]
 * @param {{ constants?: Record<string, string>, resolveToken?: (ref: string) => Record<string, string> | undefined, resolveHint?: string }} [options]
 *   The configured constants, a resolver for their values, and the line that tells the caller how
 *   to ask for values.
 */
export function format({ resolve } = {}, options = {}) {
  const version = Number(schema.$id.slice(schema.$id.lastIndexOf(":") + 1));
  const anatomyRoles = schema.$defs.anatomy.additionalProperties.properties.role.enum;
  const constants = Object.entries(options.constants ?? {}).map(([name, token]) => {
    const values = resolve ? options.resolveToken?.(token) : undefined;
    return values ? { name, token, values } : { name, token };
  });
  const code = (names) => names.map((name) => `\`${name}\``).join(", ");
  const keywords = TOKEN_KEYWORDS.map((word) =>
    KEYWORD_NOTES[word] ? `\`${word}\` (${KEYWORD_NOTES[word]})` : `\`${word}\``,
  ).join(", ");
  const lines = [
    "# Spec format",
    "",
    `Format version ${version}. SPEC.md in the spec package is the full reference.`,
    "",
    "## Token bindings",
    "",
    "A component record's `tokens` maps each anatomy part to conditions, and each condition to properties and token references.",
    "",
    "- **Conditions:** `base`, a parameter value (`variant.primary`), a state (`hover`), a preference value (`reducedMotion.reduce`), or several of those joined with ` + `.",
    `- **Properties:** ${code(TOKEN_PROPERTIES)}. \`track\` is the unfilled path behind an indicator. Other lowercase, hyphenated names are allowed.`,
    `- **Keywords,** where no token applies: ${keywords}.`,
    "",
    "## System-wide constants",
    "",
  ];
  if (constants.length === 0) {
    lines.push("None are configured. Add `constants` to spec.config.json.");
  } else {
    lines.push(
      "Every component uses these, so a component record does not have to bind them. Use these tokens wherever a part needs one.",
      "",
    );
    const sets = [...new Set(constants.flatMap((row) => Object.keys(row.values ?? {})))];
    const header = ["Constant", "Token", ...sets];
    const rows = constants.map((row) => [
      row.name,
      `\`${row.token}\``,
      ...sets.map((set) => (row.values?.[set] ? `\`${row.values[set]}\`` : "")),
    ]);
    lines.push(
      ...[header, header.map(() => "---"), ...rows].map(
        (cells) => `| ${cells.map(cell).join(" | ")} |`,
      ),
    );
    if (!resolve && options.resolveHint) lines.push("", options.resolveHint);
    if (resolve && sets.length === 0) {
      lines.push(
        "",
        "No values resolved. Configure `tokens` in spec.config.json to resolve values.",
      );
    }
  }
  lines.push("", "## Anatomy roles", "", `${code(anatomyRoles)}.`);
  return {
    text: lines.join("\n"),
    data: {
      version,
      properties: TOKEN_PROPERTIES,
      keywords: TOKEN_KEYWORDS,
      anatomyRoles,
      constants,
    },
    ok: true,
  };
}

/** @param {import("./index.js").LoadOptions} options */
export async function validate(options) {
  const { issues, recordCount } = await validateSpec(options);
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
