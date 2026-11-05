import { stringify } from "yaml";
import { links, recordRules, tokens } from "./query.js";
import { byCodeUnit, recordIdOf } from "./util.js";

const TOPICS = ["content", "behavior", "accessibility"];
/** Shown under the summary for records that are not stable. */
const STATUS_NOTES = {
  draft:
    "**Status: draft.** Still being specified. A draft component has no implementation yet, so do not build with it.",
  deprecated: "**Status: deprecated.** Do not use it in new work.",
};

const FIELD_ORDER = [
  "usage",
  "anatomy",
  "parameters",
  "events",
  "parts",
  "items",
  "states",
  "preferences",
  "rules",
  "accessibility",
  "tokens",
  "rationale",
];

/**
 * Markdown for a record, or for one section of it, for an agent or a person to read.
 *
 * @param {import("./query.js").State} state
 * @param {string} target A record ID, or `id#section`.
 * @param {{ omit?: string[] }} [options] Component fields to leave out of a whole record, such as
 *   `tokens`. Ignored for a section.
 */
export function render(state, target, options = {}) {
  const id = recordIdOf(target);
  const record = state.records.get(id);
  if (!record) throw new Error(`No record has the id ${id}`);
  if (!target.includes("#")) return join(renderRecord(state, record, options.omit ?? []));

  const name = target.slice(id.length + 1);
  const entry = state.sections.get(id).get(name);
  if (!entry) throw new Error(`Record ${id} has no section ${name}`);
  return join(renderSection(state, record, name, entry));
}

const join = (blocks) => `${blocks.filter(Boolean).join("\n\n")}\n`;

// --- Records ---

function renderRecord(state, record, omit) {
  const blocks = [
    `# ${record.title}`,
    record.summary,
    STATUS_NOTES[record.status],
    renderKnownIssues(record["known-issues"]),
  ];
  if (record.type === "component") {
    blocks.push(record.description);
    for (const field of FIELD_ORDER) {
      if (omit.includes(field)) continue;
      // Inherited rules count, so a component with no rules of its own still lists them.
      const present = field === "rules" ? hasRules(state, record) : record[field] !== undefined;
      if (present) blocks.push(renderField(state, record, field));
    }
  } else {
    if (record.body) blocks.push(record.body);
    if (record.rules?.length) blocks.push(renderField(state, record, "rules"));
  }
  if (record.type === "example") blocks.push(renderAnnotations(state, record));
  blocks.push(renderLinks(state, record.id));
  return blocks;
}

/** Open problems go near the top, so a reader meets them before building on the record. */
function renderKnownIssues(knownIssues = []) {
  if (knownIssues.length === 0) return "";
  const items = knownIssues.map(({ statement, issue }) =>
    issue ? `${statement} ([tracking issue](${issue}))` : statement,
  );
  return `## Known issues\n\n${bullets(items)}`;
}

function renderLinks(state, id) {
  const found = links(state, id, { direction: "out" });
  if (found.length === 0) return "";
  const lines = ["## Links"];
  let kind;
  for (const link of found) {
    if (link.kind !== kind) {
      kind = link.kind;
      lines.push("", `### ${kind}`, "");
    }
    lines.push(`- ${linkText(state, link)}`);
  }
  return lines.join("\n");
}

function renderAnnotations(state, record) {
  const annotations = record.annotations ?? [];
  if (annotations.length === 0) return "";
  const items = annotations.map((annotation) => {
    const references = (annotation.references ?? []).map((target) => referenceText(state, target));
    return [
      `**${annotation.label}** (\`${record.id}#${annotation.id}\`): ${annotation.description}`,
      references.length > 0 ? ` See ${references.join(", ")}.` : "",
    ].join("");
  });
  return `## Annotations\n\n${bullets(items)}`;
}

function linkText(state, link) {
  const from = link.fromSection ? `\`${link.fromSection}\` → ` : "";
  const reference = from + referenceText(state, link.to);
  const detail = [link.situation, link.why].filter(Boolean).join(" ");
  return detail ? `${reference} — ${detail}` : reference;
}

function referenceText(state, target) {
  const title = state.records.get(recordIdOf(target))?.title ?? target;
  return `[${title}](${target})`;
}

// --- Sections ---

function renderSection(state, record, name, entry) {
  if (entry.kind === "heading") return [`${"#".repeat(entry.depth)} ${entry.title}`, entry.content];
  if (entry.kind === "rule") {
    const rule = recordRules(state, record.id).rules.find((item) => item.id === name);
    return [ruleLine(rule ?? entry.content, record.id)];
  }
  if (entry.kind === "value") {
    const { meaning, example, guidance } = entry.content;
    // A section is headed by its path, such as `parameters.variant.primary`, so it says where it is.
    return [
      `## ${name}`,
      meaning,
      example && `Example: ${example}`,
      guidance && `Guidance: ${referenceText(state, guidance)}`,
    ];
  }
  if (entry.kind === "annotation") {
    const { description, references = [] } = entry.content;
    return [
      `## ${entry.title}`,
      description,
      references.map((target) => `- ${referenceText(state, target)}`).join("\n"),
    ];
  }
  if (FIELD_ORDER.includes(name)) return [renderField(state, record, name)];
  // A part or an item, or its parameters or events, reads like the component's own: tables, not YAML.
  const owner = name.match(/^(parts|items)\.([^.]+)(?:\.(parameters|events))?$/);
  if (owner) {
    const [, kind, part, field] = owner;
    if (field === "parameters")
      return [section("Parameters", renderParameters(state, entry.content))];
    if (field === "events") return [section("Events", renderEvents(entry.content))];
    return [renderPartOptions(state, kind, part, entry.content).replace(/^### /, "## ")];
  }
  if (name === "description") return [`## Description`, entry.content];
  const value = entry.content;
  return [`## ${name}`, typeof value === "string" ? value : fence(value)];
}

const fence = (value) => `\`\`\`yaml\n${stringify(value).trimEnd()}\n\`\`\``;

// --- Component fields ---

function renderField(state, record, field) {
  const value = record[field];
  switch (field) {
    case "usage":
      return renderUsage(state, value);
    case "anatomy":
      return section(
        "Anatomy",
        table(
          ["Part", "Role", "Description"],
          Object.entries(value).map(([part, item]) => [part, item.role, item.description]),
        ),
      );
    case "parameters":
      return section("Parameters", renderParameters(state, value));
    case "events":
      return section("Events", renderEvents(value));
    case "parts":
    case "items":
      return section(
        field === "parts" ? "Parts" : "Items",
        Object.entries(value)
          .map(([part, options]) => renderPartOptions(state, field, part, options))
          .join("\n\n"),
      );
    case "states":
      return section("States", value.map((name) => `\`${name}\``).join(", "));
    case "preferences":
      return section(
        "Preferences",
        bullets(
          Object.entries(value).map(
            ([name, options]) =>
              `\`${name}\`: ${options.map((option) => `\`${option}\``).join(", ")}`,
          ),
        ),
      );
    case "rules":
      return section("Rules", renderRules(state, record));
    case "accessibility":
      return section("Accessibility", renderAccessibility(value));
    case "tokens":
      return section("Tokens", renderTokens(tokens(state, record.id, {})));
    case "rationale":
      return section("Rationale", bullets(value.map((item) => `**${item.decision}** ${item.why}`)));
    default:
      return "";
  }
}

const section = (title, body) => `## ${title}\n\n${body}`;
const bullets = (items) => items.map((item) => `- ${item}`).join("\n");

function renderUsage(state, usage) {
  const blocks = [];
  if (usage.do?.length) blocks.push(section("When to use", bullets(usage.do)));
  if (usage.avoid?.length) {
    const items = usage.avoid.map((item) => {
      const instead = item.instead
        ? state.records.has(item.instead)
          ? `Use ${referenceText(state, item.instead)} instead.`
          : // Prose, such as "no indicator" or "A step-by-step flow", reads as its own phrase.
            `Instead: ${item.instead.charAt(0).toUpperCase()}${item.instead.slice(1)}.`
        : "";
      return [item.situation, instead, item.why].filter(Boolean).join(" ");
    });
    blocks.push(section("When not to use", bullets(items)));
  }
  return blocks.join("\n\n");
}

/** One repeated part: the parameters and events each copy of it carries. */
/** One part's or one item's options. `kind` is `parts` or `items`. */
function renderPartOptions(state, kind, part, options) {
  const lead =
    kind === "items" ? `Options of each \`${part}\`.` : `Options of the \`${part}\` part.`;
  const blocks = [`### ${part}`, lead];
  if (options.parameters) blocks.push(renderParameters(state, options.parameters));
  if (options.events) blocks.push(`Events:\n\n${renderEvents(options.events)}`);
  return blocks.join("\n\n");
}

function renderEvents(events) {
  return bullets(Object.entries(events).map(([name, text]) => `\`${name}\`: ${text}`));
}

function renderParameters(state, parameters) {
  const rows = Object.entries(parameters).map(([name, parameter]) => [
    name,
    parameter.kind,
    Object.keys(parameter.values ?? {})
      .map((value) => `\`${value}\``)
      .join(", "),
    parameter.default === undefined ? "" : `\`${parameter.default}\``,
    parameter.description ?? "",
  ]);
  const blocks = [table(["Name", "Kind", "Values", "Default", "Description"], rows)];
  for (const [name, parameter] of Object.entries(parameters)) {
    if (parameter.kind !== "enum") continue;
    const items = Object.entries(parameter.values).map(([value, meaning]) => {
      const example = parameter.examples?.[value];
      const guidance = parameter.guidance?.[value];
      return [
        `\`${value}\`: ${meaning}`,
        example ? ` Example: ${example}` : "",
        guidance ? ` Guidance: ${referenceText(state, guidance)}` : "",
      ].join("");
    });
    blocks.push(`\`${name}\` values:\n\n${bullets(items)}`);
  }
  return blocks.join("\n\n");
}

/**
 * A rule the record writes reads by its id. An inherited rule reads by its full address, and one
 * that narrows an inherited rule names it, so the reader knows where each requirement comes from.
 */
function ruleLine(rule, recordId) {
  const details = [
    rule.extends && `Extends: ${rule.extends}`,
    rule.applicability && `Applies when: ${rule.applicability}`,
    rule.rationale && `Why: ${rule.rationale}`,
    rule.references && `See: ${rule.references.join(", ")}`,
    rule.examples?.do && `Do: ${rule.examples.do.join("; ")}`,
    rule.examples?.avoid && `Avoid: ${rule.examples.avoid.join("; ")}`,
  ].filter(Boolean);
  const name = rule.recordId && rule.recordId !== recordId ? rule.address : rule.id;
  return [
    `- **${rule.level.toUpperCase()}** ${name}: ${rule.statement}`,
    ...details.map((line) => `  - ${line}`),
  ].join("\n");
}

const hasRules = (state, record) => {
  const { rules, waived } = recordRules(state, record.id);
  return rules.length > 0 || waived.length > 0;
};

function renderRules(state, record) {
  const { rules, waived } = recordRules(state, record.id);
  const inherited = [...new Set(rules.map((rule) => rule.recordId))].filter(
    (id) => id !== record.id,
  );
  const blocks = [];
  if (inherited.length > 0) {
    blocks.push(
      `Includes the rules of ${inherited.join(", ")}, which this component follows. Cite each rule by the address shown.`,
    );
  }
  for (const topic of TOPICS) {
    const ofTopic = rules.filter((rule) => rule.topic === topic);
    if (ofTopic.length === 0) continue;
    const heading = `### ${topic[0].toUpperCase()}${topic.slice(1)}`;
    blocks.push(`${heading}\n\n${ofTopic.map((rule) => ruleLine(rule, record.id)).join("\n")}`);
  }
  if (waived.length > 0) {
    blocks.push(
      `### Waived\n\n${waived.map((item) => `- ${item.address}: ${item.waived}`).join("\n")}`,
    );
  }
  return blocks.join("\n\n");
}

function renderAccessibility(accessibility) {
  const blocks = [];
  const facts = [
    accessibility.role && `Role: ${accessibility.role}`,
    accessibility.name && `Name: ${accessibility.name}`,
  ].filter(Boolean);
  if (facts.length) blocks.push(bullets(facts));
  if (accessibility.keyboard) {
    blocks.push(table(["Key", "Action"], Object.entries(accessibility.keyboard)));
  }
  return blocks.join("\n\n");
}

function renderTokens(rows) {
  const sets = [...new Set(rows.flatMap((row) => Object.keys(row.values ?? {})))].sort(byCodeUnit);
  return table(
    ["Part", "Condition", "Property", "Token", ...sets],
    rows.map((row) => [
      row.part,
      `\`${row.condition}\``,
      row.property,
      `\`${row.token}\``,
      ...sets.map((set) => row.values?.[set] ?? ""),
    ]),
  );
}

// --- Tables ---

export function table(headers, rows) {
  const cell = (text) =>
    String(text ?? "")
      .replaceAll("|", "\\|")
      .replace(/\s*\n\s*/g, " ")
      .trim();
  const line = (cells) => `| ${cells.map(cell).join(" | ")} |`;
  return [line(headers), line(headers.map(() => "---")), ...rows.map(line)].join("\n");
}
