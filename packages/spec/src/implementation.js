/**
 * Implementation files: how one technology realizes a component record.
 *
 * A component record says what a component is. An implementation file says how one technology
 * realizes it: package, what to import, usage, the API rows that map the technology's members
 * (web attributes and properties, React props and callbacks) to the record's parameters and events,
 * and optional Markdown guidance. A component with options on one part, such as Card's title, lists
 * the API rows for each part and, when the part is its own element or component, what realizes it.
 * A component with repeated items, such as Accordion's sections, lists what realizes each item and
 * its API rows. Records stay technology-neutral; these files live
 * wherever the implementation does and are found through `implementations` in spec.config.json,
 * which names each folder's technology.
 *
 * Front matter is validated on load against the technology's fields, and every error names the file.
 */
import { readFileSync, readdirSync } from "node:fs";
import { basename, join } from "node:path";
import { parse } from "yaml";
import { table } from "./render.js";

/** @typedef {"web-component" | "react"} Technology */

/** @typedef {"attribute" | "property" | "event" | "prop" | "callback"} ApiMemberKind */

/**
 * One row of the API table. Spec-backed rows take their text from the component record.
 *
 * @typedef {object} ImplementationApiRow
 * @property {string} name The name in the technology, such as an attribute, prop, or event name.
 * @property {ApiMemberKind} kind
 * @property {string} [parameter] The record parameter this attribute or property implements.
 * @property {Record<string, string>} [values] Spec value name -> implementation value name, for
 *   parameters whose values differ.
 * @property {string} [event] The record event this event implements.
 * @property {string} [type] The type shown, when the row is not derived from a parameter.
 * @property {string} [description]
 */

/**
 * How one part of the record that appears once is realized. Without a tag name or export, its rows
 * are members of the component itself; with one, the part is its own element or component.
 *
 * @typedef {object} ImplementationPart
 * @property {string} [tagName] Web components.
 * @property {string} [export] React.
 * @property {ImplementationApiRow[]} api
 */

/**
 * How one repeated item of the record is realized: by an element for a web component, by an
 * exported component for React.
 *
 * @typedef {object} ImplementationItem
 * @property {string} [tagName] Web components.
 * @property {string} [export] React.
 * @property {ImplementationApiRow[]} api
 */

/**
 * @typedef {object} Implementation
 * @property {Technology} technology
 * @property {string} component Spec record id, such as `component.button`.
 * @property {string} package
 * @property {string} [tagName] Web components: the custom element name.
 * @property {string} [defineExport] Web components: the function that registers the element.
 * @property {string} [export] React: the exported component name.
 * @property {string} usage
 * @property {ImplementationApiRow[]} api
 * @property {Record<string, ImplementationPart>} parts By record part, such as `title`.
 * @property {Record<string, ImplementationItem>} items By record item, such as `section`.
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
/** An item or part element may be a native one, such as Radio group's `option`. */
const ELEMENT_NAME = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;
const IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/;
const FRONT_MATTER = /^---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/;
const COMPONENT_NAME = /^[A-Z][A-Za-z0-9]*$/;
const ROW_KEYS = ["name", "kind", "parameter", "values", "event", "type", "description"];

/**
 * What each technology's files hold beyond the shared fields: the fields that say what to import,
 * the fields that say what realizes an item, the row kinds, and which kind implements an event.
 * The rest renders the file: what the component is, how to import it, the usage code language, and
 * the heading for each item.
 */
const TECHNOLOGIES = {
  "web-component": {
    fields: {
      tagName: { regex: TAG_NAME, hint: 'a custom element name such as "ds-button"' },
      defineExport: { regex: IDENTIFIER, hint: "a JavaScript identifier" },
    },
    itemFields: {
      tagName: {
        regex: ELEMENT_NAME,
        hint: 'an element name such as "ds-tab-panel" or "option"',
      },
    },
    kinds: ["attribute", "property", "event"],
    eventKind: "event",
    identity: (implementation) => `- Element: ${code(`<${implementation.tagName}>`)}`,
    importCode: (implementation) =>
      [
        "```js",
        `import { ${implementation.defineExport} } from "${implementation.package}/${implementationSlug(implementation)}";`,
        "",
        `${implementation.defineExport}();`,
        "```",
      ].join("\n"),
    language: "html",
    itemHeading: (part, item) => `${capitalize(part)} element: ${code(`<${item.tagName}>`)}`,
    partHeading: (part, owner, implementation) =>
      owner.tagName
        ? `${capitalize(part)} element: ${code(`<${owner.tagName}>`)}`
        : `${capitalize(part)} part, on ${code(`<${implementation.tagName}>`)}`,
  },
  react: {
    fields: {
      export: { regex: COMPONENT_NAME, hint: 'a component name such as "Button"' },
    },
    itemFields: {
      export: { regex: COMPONENT_NAME, hint: 'a component name such as "TabsSection"' },
    },
    kinds: ["prop", "callback"],
    eventKind: "callback",
    identity: (implementation) => `- Component: ${code(implementation.export)}`,
    importCode: (implementation) => {
      const names = [
        implementation.export,
        ...Object.values(implementation.parts).flatMap((part) => part.export ?? []),
        ...Object.values(implementation.items).map((item) => item.export),
      ];
      return [
        "```tsx",
        `import { ${names.join(", ")} } from "${implementation.package}";`,
        "```",
      ].join("\n");
    },
    language: "tsx",
    itemHeading: (part, item) => `${capitalize(part)} component: ${code(item.export)}`,
    partHeading: (part, owner, implementation) =>
      owner.export
        ? `${capitalize(part)} component: ${code(owner.export)}`
        : `${capitalize(part)} part, on ${code(implementation.export)}`,
  },
};

/** The technologies an implementation folder can declare in spec.config.json. */
export const TECHNOLOGY_NAMES = Object.keys(TECHNOLOGIES);

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
function parseRow(file, raw, index, technology, prefix = "") {
  const { kinds, eventKind } = TECHNOLOGIES[technology];
  const where = `${prefix}api[${index}] `;
  if (!isObject(raw)) throw new ImplementationError(file, `${where}must be a mapping.`);
  rejectUnknownKeys(file, where, raw, ROW_KEYS);
  const name = stringField(file, where, raw, "name");
  const kind = raw.kind;
  if (typeof kind !== "string" || !kinds.includes(kind)) {
    throw new ImplementationError(
      file,
      `${where}(${name}) kind must be one of ${kinds.join(", ")} for ${technology}.`,
    );
  }
  /** @type {ImplementationApiRow} */
  const row = { name, kind: /** @type {ApiMemberKind} */ (kind) };
  const label = `${prefix}api[${index}] (${name}) `;
  row.parameter = optionalString(file, label, raw, "parameter");
  row.event = optionalString(file, label, raw, "event");
  row.type = optionalString(file, label, raw, "type");
  row.description = optionalString(file, label, raw, "description");

  if (raw.values !== undefined) {
    if (!isObject(raw.values) || Object.keys(raw.values).length === 0) {
      throw new ImplementationError(
        file,
        `${label}values must map spec value names to implementation value names.`,
      );
    }
    for (const [spec, web] of Object.entries(raw.values)) {
      if (typeof web !== "string" || web.length === 0) {
        throw new ImplementationError(file, `${label}values.${spec} must be a non-empty string.`);
      }
    }
    row.values = /** @type {Record<string, string>} */ (raw.values);
  }

  if (row.kind === eventKind) {
    if (row.parameter || row.values || row.type) {
      throw new ImplementationError(
        file,
        `${label}is ${article(eventKind)}; it takes "event" and "description", not parameter, values, or type.`,
      );
    }
    if (!row.event && !row.description) {
      throw new ImplementationError(
        file,
        `${label}needs "event" (the record event it implements) or a "description".`,
      );
    }
  } else {
    if (row.event) {
      throw new ImplementationError(
        file,
        `${label}is ${article(row.kind)}; only ${eventKind} rows take "event".`,
      );
    }
    if (!row.parameter && !(row.type && row.description)) {
      throw new ImplementationError(
        file,
        `${label}needs "parameter" (the record parameter it implements) or both "type" and "description".`,
      );
    }
    if (row.values && !row.parameter) {
      throw new ImplementationError(file, `${label}values need a "parameter" to rename.`);
    }
  }
  return row;
}

/**
 * Parse and validate one implementation file against its technology's fields. `file` is used in
 * error messages.
 *
 * @param {string} source
 * @param {string} file
 * @param {Technology} technology
 * @returns {Implementation}
 */
export function parseImplementation(source, file, technology) {
  const profile = TECHNOLOGIES[technology];
  if (!profile) {
    throw new ImplementationError(
      file,
      `unknown technology "${technology}". Known: ${TECHNOLOGY_NAMES.join(", ")}.`,
    );
  }
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
  rejectUnknownKeys(file, "front matter ", data, [
    "component",
    "package",
    ...Object.keys(profile.fields),
    "usage",
    "api",
    "parts",
    "items",
  ]);

  const component = stringField(file, "", data, "component", {
    regex: COMPONENT_ID,
    hint: 'a component record id such as "component.button"',
  });
  const own = Object.fromEntries(
    Object.entries(profile.fields).map(([key, pattern]) => [
      key,
      stringField(file, "", data, key, pattern),
    ]),
  );
  const api = parseApi(file, data.api, technology, "");
  /** @type {Record<string, ImplementationPart>} */
  const parts = {};
  if (data.parts !== undefined) {
    if (!isObject(data.parts) || Object.keys(data.parts).length === 0) {
      throw new ImplementationError(file, "parts must map each record part to its api rows.");
    }
    for (const [part, raw] of Object.entries(data.parts)) {
      const where = `parts.${part} `;
      if (!isObject(raw)) throw new ImplementationError(file, `${where}must be a mapping.`);
      rejectUnknownKeys(file, where, raw, [...Object.keys(profile.itemFields), "api"]);
      parts[part] = {
        ...Object.fromEntries(
          Object.entries(profile.itemFields)
            .filter(([key]) => raw[key] !== undefined)
            .map(([key, pattern]) => [key, stringField(file, where, raw, key, pattern)]),
        ),
        api: parseApi(file, raw.api, technology, `parts.${part}.`),
      };
    }
  }
  /** @type {Record<string, ImplementationItem>} */
  const items = {};
  if (data.items !== undefined) {
    if (!isObject(data.items) || Object.keys(data.items).length === 0) {
      throw new ImplementationError(file, "items must map each record item to what realizes it.");
    }
    for (const [part, raw] of Object.entries(data.items)) {
      const where = `items.${part} `;
      if (!isObject(raw)) throw new ImplementationError(file, `${where}must be a mapping.`);
      rejectUnknownKeys(file, where, raw, [...Object.keys(profile.itemFields), "api"]);
      items[part] = {
        ...Object.fromEntries(
          Object.entries(profile.itemFields).map(([key, pattern]) => [
            key,
            stringField(file, where, raw, key, pattern),
          ]),
        ),
        api: parseApi(file, raw.api, technology, `items.${part}.`),
      };
    }
  }

  return {
    technology,
    component,
    package: stringField(file, "", data, "package"),
    ...own,
    usage: typeof data.usage === "string" ? data.usage.trim() : "",
    api,
    parts,
    items,
    body: source.slice(match[0].length).trim(),
    file,
  };
}

/**
 * The rows may be empty, as for a component whose options all belong to its parts or items;
 * `checkImplementation` requires a row for each parameter and event the record declares.
 *
 * @param {string} file
 * @param {unknown} raw
 * @param {Technology} technology
 * @param {string} prefix Where the rows are, such as `items.section.`, for error messages.
 * @returns {ImplementationApiRow[]}
 */
function parseApi(file, raw, technology, prefix) {
  if (!Array.isArray(raw)) {
    throw new ImplementationError(file, `${prefix}api must be a list of rows.`);
  }
  const api = raw.map((row, index) => parseRow(file, row, index, technology, prefix));
  const seen = new Set();
  for (const row of api) {
    const key = `${row.kind}:${row.name}`;
    if (seen.has(key)) {
      throw new ImplementationError(
        file,
        `${prefix}api lists the ${row.kind} "${row.name}" twice.`,
      );
    }
    seen.add(key);
  }
  return api;
}

/**
 * Every `*.md` file in `dir`, parsed as files of `technology`, in file-name order. A folder that
 * does not exist yet holds no implementations, so it reads as nothing implemented.
 *
 * @param {string} dir
 * @param {Technology} technology
 * @returns {Implementation[]}
 */
export function loadImplementations(dir, technology) {
  let names;
  try {
    names = readdirSync(dir);
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
  return names
    .filter((name) => name.endsWith(".md"))
    .sort()
    .map((name) =>
      parseImplementation(
        readFileSync(join(dir, name), "utf8"),
        `implementation/${name}`,
        technology,
      ),
    );
}

/**
 * Check an implementation against the component record it implements, so a broken mapping fails
 * instead of serving incomplete guidance. The record must be a component, the file must be named
 * after it, every parameter and event needs a row, and every row must name a parameter, value, or
 * event the record has. The same holds for each part and item, and every record part and item
 * needs an entry.
 *
 * @param {Implementation} implementation
 * @param {Record<string, any> | undefined} record The record `implementation.component` names.
 * @throws {ImplementationError}
 */
export function checkImplementation(implementation, record) {
  const { file } = implementation;
  if (record?.type !== "component") {
    throw new ImplementationError(
      file,
      `component "${implementation.component}" is not a component record in the spec.`,
    );
  }
  const slug = implementationSlug(implementation);
  const expected = record.id.slice("component.".length);
  if (slug !== expected) {
    throw new ImplementationError(
      file,
      `the file name says "${slug}", but it implements ${record.id}. Name the file ${expected}.md.`,
    );
  }
  checkApi(file, implementation.api, record, record.id);
  for (const [field, noun, hint] of [
    ["parts", "part", "Add its api rows."],
    ["items", "item", "Add its element and api rows."],
  ]) {
    const recordOwners = record[field] ?? {};
    for (const [part, owner] of Object.entries(implementation[field])) {
      if (!(part in recordOwners)) {
        throw new ImplementationError(
          file,
          `${field}.${part} implements ${article(noun)} ${record.id} does not have. Its ${field}: ${Object.keys(recordOwners).join(", ") || "none"}.`,
        );
      }
      checkApi(file, owner.api, recordOwners[part], `${record.id} ${noun} "${part}"`);
    }
    const missing = Object.keys(recordOwners).filter((part) => !(part in implementation[field]));
    if (missing.length > 0) {
      throw new ImplementationError(
        file,
        `${field} does not cover ${record.id} ${noun}${missing.length === 1 ? "" : "s"} ${missing.map((part) => `"${part}"`).join(", ")}. ${hint}`,
      );
    }
  }
}

/**
 * Check API rows against the parameters and events they implement: a component's, or one part's or
 * item's.
 *
 * @param {string} file
 * @param {ImplementationApiRow[]} api
 * @param {{ parameters?: Record<string, any>, events?: Record<string, string> }} owner
 * @param {string} name The owner in messages, such as `component.accordion item "section"`.
 */
function checkApi(file, api, owner, name) {
  const parameters = owner.parameters ?? {};
  const events = owner.events ?? {};
  for (const row of api) {
    const where = `api row "${row.name}"`;
    if (row.event && !(row.event in events)) {
      throw new ImplementationError(
        file,
        `${where} implements the event "${row.event}", but ${name} has no such event. Its events: ${Object.keys(events).join(", ") || "none"}.`,
      );
    }
    if (!row.parameter) continue;
    const parameter = parameters[row.parameter];
    if (!parameter) {
      throw new ImplementationError(
        file,
        `${where} implements the parameter "${row.parameter}", but ${name} has no such parameter. Its parameters: ${Object.keys(parameters).join(", ") || "none"}.`,
      );
    }
    for (const from of Object.keys(row.values ?? {})) {
      if (!parameter.values || !(from in parameter.values)) {
        throw new ImplementationError(
          file,
          `${where} renames the value "${from}", but ${name} parameter "${row.parameter}" has no such value.`,
        );
      }
    }
  }
  const coveredParameters = new Set(api.map((row) => row.parameter));
  const coveredEvents = new Set(api.map((row) => row.event));
  const missing = [
    ...Object.keys(parameters)
      .filter((key) => !coveredParameters.has(key))
      .map((key) => `parameter "${key}"`),
    ...Object.keys(events)
      .filter((key) => !coveredEvents.has(key))
      .map((key) => `event "${key}"`),
  ];
  if (missing.length > 0) {
    throw new ImplementationError(
      file,
      `the api table does not cover ${name} ${missing.join(", ")}. Add a row with "parameter" or "event" for each.`,
    );
  }
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
const article = (word) => `${/^[aeiou]/.test(word) ? "an" : "a"} ${word}`;

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
 * Render an implementation as a Markdown section to follow its record: package, what to import,
 * usage, an API table that names the record parameter or event each row implements, and the
 * guidance body with its headings one level down.
 *
 * @param {Record<string, any>} record The component record the implementation realizes.
 * @param {Implementation} implementation
 * @param {string} name The implementation set name, such as `web`.
 */
export function renderImplementation(record, implementation, name) {
  const profile = TECHNOLOGIES[implementation.technology];
  const table = (owner, api, ownerName) => apiTable(owner, api, profile.eventKind, ownerName);
  const parts = Object.entries(implementation.parts).map(
    ([part, owner]) =>
      `### ${profile.partHeading(part, owner, implementation)}\n\n${table(record.parts?.[part] ?? {}, owner.api, part)}`,
  );
  const items = Object.entries(implementation.items).map(
    ([part, item]) =>
      `### ${profile.itemHeading(part, item)}\n\n${table(record.items?.[part] ?? {}, item.api, part)}`,
  );
  const blocks = [
    `## ${capitalize(name)} implementation`,
    [`- Package: ${code(implementation.package)}`, profile.identity(implementation)].join("\n"),
    `### Import\n\n${profile.importCode(implementation)}`,
    implementation.usage &&
      `### Usage\n\n\`\`\`${profile.language}\n${implementation.usage}\n\`\`\``,
    implementation.api.length > 0 && `### API\n\n${table(record, implementation.api)}`,
    ...parts,
    ...items,
    implementation.body.replace(/^(#{2,5}) /gm, "#$1 "),
  ];
  return `${blocks.filter(Boolean).join("\n\n")}\n`;
}

/**
 * The API table for rows that implement a component's, or one part's or item's, parameters and
 * events. A part's or item's cells name it, so its `value` reads apart from the component's.
 *
 * @param {{ parameters?: Record<string, any>, events?: Record<string, string> }} owner
 * @param {ImplementationApiRow[]} api
 * @param {string} eventKind The row kind that implements an event, which has no values.
 * @param {string} [ownerName] The part or item the rows belong to; none for the component.
 */
function apiTable(owner, api, eventKind, ownerName) {
  const of = ownerName ? `${ownerName} ` : "";
  const rows = api.map((row) => {
    const parameter = row.parameter ? owner.parameters?.[row.parameter] : undefined;
    const implementsCell = row.parameter
      ? `${of}parameter ${code(row.parameter)}`
      : row.event
        ? `${of}event ${code(row.event)}`
        : "";
    const description =
      row.description ??
      parameter?.description ??
      (row.event ? owner.events?.[row.event] : undefined) ??
      "";
    return [
      code(row.name),
      row.kind,
      implementsCell,
      row.kind === eventKind ? "" : valuesCell(row, parameter),
      description,
    ];
  });
  const own = api.some((row) => !row.parameter && !row.event)
    ? "\n\nA row with no Implements entry is specific to this implementation, not part of the spec."
    : "";
  return table(["Name", "Kind", "Implements", "Values", "Description"], rows) + own;
}
