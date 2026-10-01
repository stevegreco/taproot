/**
 * Implementation files: how one technology realizes a component record.
 *
 * A knowledge record says what a component is. An implementation file says how, for example, the
 * web component realizes it: package, tag name, registration function, usage markup, the API rows
 * that map web attributes, properties, and events to the record's parameters and events, and
 * optional Markdown guidance. Records stay technology-neutral; these files live wherever the
 * implementation does and are found through `implementations` in knowledge.config.json.
 *
 * Front matter is validated on load, and every error names the file.
 */
import { readFileSync, readdirSync } from "node:fs";
import { basename, join } from "node:path";
import { parse } from "yaml";
import { table } from "./render.js";

/** @typedef {"attribute" | "property" | "event"} ApiMemberKind */

/**
 * One row of the API table. Spec-backed rows take their text from the knowledge record.
 *
 * @typedef {object} ImplementationApiRow
 * @property {string} name The name in the technology: an attribute, property, or event name.
 * @property {ApiMemberKind} kind
 * @property {string} [parameter] The knowledge parameter this attribute or property implements.
 * @property {Record<string, string>} [values] Spec value name -> implementation value name, for
 *   parameters whose values differ.
 * @property {string} [event] The knowledge event this event implements.
 * @property {string} [type] The type shown, when the row is not derived from a parameter.
 * @property {string} [description]
 */

/**
 * @typedef {object} Implementation
 * @property {string} component Knowledge record id, such as `component.button`.
 * @property {string} package
 * @property {string} tagName
 * @property {string} defineExport
 * @property {string} usage
 * @property {ImplementationApiRow[]} api
 * @property {string} body Markdown guidance; each `##` section is one topic.
 * @property {string} file File name, for error messages.
 */

export class ImplementationError extends Error {
  /**
   * @param {string} file
   * @param {string} message
   */
  constructor(file, message) {
    super(`${file}: ${message}`);
    this.name = "ImplementationError";
  }
}

const COMPONENT_ID = /^component\.[a-z][a-z0-9]*(-[a-z0-9]+)*$/;
const TAG_NAME = /^[a-z][a-z0-9]*(-[a-z0-9]+)+$/;
const IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/;
const FRONT_MATTER = /^---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/;
const TOP_KEYS = ["component", "package", "tagName", "defineExport", "usage", "api"];
const ROW_KEYS = ["name", "kind", "parameter", "values", "event", "type", "description"];
const KINDS = ["attribute", "property", "event"];

/** @returns {value is Record<string, unknown>} */
function isObject(value) {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

/**
 * @param {string} file
 * @param {string} where
 * @param {Record<string, unknown>} source
 * @param {string} key
 * @param {{ regex: RegExp, hint: string }} [pattern]
 * @returns {string}
 */
function stringField(file, where, source, key, pattern) {
  const value = source[key];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ImplementationError(file, `${where}${key} must be a non-empty string.`);
  }
  if (pattern && !pattern.regex.test(value)) {
    throw new ImplementationError(file, `${where}${key} "${value}" must be ${pattern.hint}.`);
  }
  return value;
}

/**
 * @param {string} file
 * @param {string} where
 * @param {Record<string, unknown>} source
 * @param {string} key
 * @returns {string | undefined}
 */
function optionalString(file, where, source, key) {
  if (source[key] === undefined) return undefined;
  return stringField(file, where, source, key);
}

/**
 * @param {string} file
 * @param {string} where
 * @param {Record<string, unknown>} source
 * @param {readonly string[]} allowed
 */
function rejectUnknownKeys(file, where, source, allowed) {
  for (const key of Object.keys(source)) {
    if (!allowed.includes(key)) {
      throw new ImplementationError(
        file,
        `${where}has an unknown field "${key}". Allowed fields: ${allowed.join(", ")}.`,
      );
    }
  }
}

/**
 * @param {string} file
 * @param {unknown} raw
 * @param {number} index
 * @returns {ImplementationApiRow}
 */
function parseRow(file, raw, index) {
  const where = `api[${index}] `;
  if (!isObject(raw)) throw new ImplementationError(file, `${where}must be a mapping.`);
  rejectUnknownKeys(file, where, raw, ROW_KEYS);
  const name = stringField(file, where, raw, "name");
  const kind = raw.kind;
  if (typeof kind !== "string" || !KINDS.includes(kind)) {
    throw new ImplementationError(
      file,
      `${where}(${name}) kind must be one of ${KINDS.join(", ")}.`,
    );
  }
  /** @type {ImplementationApiRow} */
  const row = { name, kind: /** @type {ApiMemberKind} */ (kind) };
  const label = `api[${index}] (${name}) `;
  row.parameter = optionalString(file, label, raw, "parameter");
  row.event = optionalString(file, label, raw, "event");
  row.type = optionalString(file, label, raw, "type");
  row.description = optionalString(file, label, raw, "description");

  if (raw.values !== undefined) {
    if (!isObject(raw.values) || Object.keys(raw.values).length === 0) {
      throw new ImplementationError(
        file,
        `${label}values must map spec value names to web value names.`,
      );
    }
    for (const [spec, web] of Object.entries(raw.values)) {
      if (typeof web !== "string" || web.length === 0) {
        throw new ImplementationError(file, `${label}values.${spec} must be a non-empty string.`);
      }
    }
    row.values = /** @type {Record<string, string>} */ (raw.values);
  }

  if (row.kind === "event") {
    if (row.parameter || row.values || row.type) {
      throw new ImplementationError(
        file,
        `${label}is an event; it takes "event" and "description", not parameter, values, or type.`,
      );
    }
    if (!row.event && !row.description) {
      throw new ImplementationError(
        file,
        `${label}needs "event" (the knowledge event it implements) or a "description".`,
      );
    }
  } else {
    if (row.event) {
      throw new ImplementationError(file, `${label}is ${row.kind}; only event rows take "event".`);
    }
    if (!row.parameter && !(row.type && row.description)) {
      throw new ImplementationError(
        file,
        `${label}needs "parameter" (the knowledge parameter it implements) or both "type" and "description".`,
      );
    }
    if (row.values && !row.parameter) {
      throw new ImplementationError(file, `${label}values need a "parameter" to rename.`);
    }
  }
  return row;
}

/**
 * Parse and validate one implementation file. `file` is used in error messages.
 *
 * @param {string} source
 * @param {string} file
 * @returns {Implementation}
 */
export function parseImplementation(source, file) {
  const match = source.match(FRONT_MATTER);
  if (!match) {
    throw new ImplementationError(file, "must start with YAML front matter between --- lines.");
  }
  let data;
  try {
    data = parse(match[1]);
  } catch (error) {
    throw new ImplementationError(
      file,
      `front matter is not valid YAML: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  if (!isObject(data)) throw new ImplementationError(file, "front matter must be a mapping.");
  rejectUnknownKeys(file, "front matter ", data, TOP_KEYS);

  const component = stringField(file, "", data, "component", {
    regex: COMPONENT_ID,
    hint: 'a component record id such as "component.button"',
  });
  const tagName = stringField(file, "", data, "tagName", {
    regex: TAG_NAME,
    hint: 'a custom element name such as "ds-button"',
  });
  const defineExport = stringField(file, "", data, "defineExport", {
    regex: IDENTIFIER,
    hint: "a JavaScript identifier",
  });
  if (!Array.isArray(data.api) || data.api.length === 0) {
    throw new ImplementationError(file, "api must be a non-empty list of rows.");
  }
  const api = data.api.map((row, index) => parseRow(file, row, index));
  const seen = new Set();
  for (const row of api) {
    const key = `${row.kind}:${row.name}`;
    if (seen.has(key)) {
      throw new ImplementationError(file, `api lists the ${row.kind} "${row.name}" twice.`);
    }
    seen.add(key);
  }

  return {
    component,
    package: stringField(file, "", data, "package"),
    tagName,
    defineExport,
    usage: typeof data.usage === "string" ? data.usage.trim() : "",
    api,
    body: source.slice(match[0].length).trim(),
    file,
  };
}

/**
 * Every `*.md` file in `dir`, parsed, in file-name order.
 *
 * @param {string} dir
 * @returns {Implementation[]}
 */
export function loadImplementations(dir) {
  return readdirSync(dir)
    .filter((name) => name.endsWith(".md"))
    .sort()
    .map((name) =>
      parseImplementation(readFileSync(join(dir, name), "utf8"), `implementation/${name}`),
    );
}

/**
 * `implementation/button.md` -> `button`.
 *
 * @param {Implementation} implementation
 */
export function implementationSlug(implementation) {
  return basename(implementation.file, ".md");
}

const code = (value) => `\`${value}\``;
const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);

/**
 * One API row's "Values" cell: the record's enum values, renamed where the implementation spells
 * them differently, or the row's own type.
 *
 * @param {ImplementationApiRow} row
 * @param {Record<string, any> | undefined} parameter
 */
function valuesCell(row, parameter) {
  if (row.type) return code(row.type);
  const values = parameter?.values;
  const names = Array.isArray(values) ? values : Object.keys(values ?? {});
  if (names.length === 0) return parameter?.kind ?? "";
  return names
    .map((name) => {
      const renamed = row.values?.[name];
      return renamed && renamed !== name ? `${code(name)} → ${code(renamed)}` : code(name);
    })
    .join(", ");
}

/**
 * Render an implementation as a Markdown section to follow its record: package, element and
 * registration, usage, an API table that names the record parameter or event each row implements,
 * and the guidance body with its headings one level down.
 *
 * @param {Record<string, any>} record The component record the implementation realizes.
 * @param {Implementation} implementation
 * @param {string} name The implementation set name, such as `web`.
 */
export function renderImplementation(record, implementation, name) {
  const rows = implementation.api.map((row) => {
    const parameter = row.parameter ? record.parameters?.[row.parameter] : undefined;
    const implementsCell = row.parameter
      ? `parameter ${code(row.parameter)}`
      : row.event
        ? `event ${code(row.event)}`
        : "";
    const description =
      row.description ??
      parameter?.description ??
      (row.event ? record.events?.[row.event] : undefined) ??
      "";
    return [
      code(row.name),
      row.kind,
      implementsCell,
      row.kind === "event" ? "" : valuesCell(row, parameter),
      description,
    ];
  });
  const blocks = [
    `## ${capitalize(name)} implementation`,
    [
      `- Package: ${code(implementation.package)}`,
      `- Element: ${code(`<${implementation.tagName}>`)}`,
    ].join("\n"),
    [
      "### Import",
      "",
      "```js",
      `import { ${implementation.defineExport} } from "${implementation.package}/${implementationSlug(implementation)}";`,
      "",
      `${implementation.defineExport}();`,
      "```",
    ].join("\n"),
    implementation.usage && `### Usage\n\n\`\`\`html\n${implementation.usage}\n\`\`\``,
    `### API\n\n${table(["Name", "Kind", "Implements", "Values", "Description"], rows)}`,
    implementation.body.replace(/^(#{2,5}) /gm, "#$1 "),
  ];
  return `${blocks.filter(Boolean).join("\n\n")}\n`;
}
