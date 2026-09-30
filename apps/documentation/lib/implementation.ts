/**
 * Implementation files: the web-component half of a component page.
 *
 * The knowledge record says what a component is. `implementation/<slug>.md`
 * says how the web component realizes it: package, tag name, registration
 * function, usage markup, the API table's rows, and optional Markdown guidance.
 * Front matter is validated on load, and every error names the file.
 */
import { readFileSync, readdirSync } from "node:fs";
import { basename, join } from "node:path";
import { parse } from "yaml";

export type ApiMemberKind = "attribute" | "property" | "event";

/** One row of the API table. Spec-backed rows take their text from the knowledge record. */
export interface ImplementationApiRow {
  /** The name on the web: an attribute, property, or event name. */
  readonly name: string;
  readonly kind: ApiMemberKind;
  /** The knowledge parameter this attribute or property implements. */
  readonly parameter?: string;
  /** Spec value name -> web value name, for parameters whose values differ on the web. */
  readonly values?: Readonly<Record<string, string>>;
  /** The knowledge event this event implements. */
  readonly event?: string;
  /** The type shown, when the row is not derived from a parameter. */
  readonly type?: string;
  readonly description?: string;
}

export interface Implementation {
  /** Knowledge record id, such as `component.button`. */
  readonly component: string;
  readonly package: string;
  readonly tagName: string;
  readonly defineExport: string;
  readonly usage: string;
  readonly api: readonly ImplementationApiRow[];
  /** Markdown guidance; each `##` section renders on the page. */
  readonly body: string;
  /** File name, for error messages. */
  readonly file: string;
}

export class ImplementationError extends Error {
  constructor(file: string, message: string) {
    super(`${file}: ${message}`);
    this.name = "ImplementationError";
  }
}

const COMPONENT_ID = /^component\.[a-z][a-z0-9]*(-[a-z0-9]+)*$/;
const TAG_NAME = /^[a-z][a-z0-9]*(-[a-z0-9]+)+$/;
const IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/;
const FRONT_MATTER = /^---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/;
const TOP_KEYS = ["component", "package", "tagName", "defineExport", "usage", "api"] as const;
const ROW_KEYS = ["name", "kind", "parameter", "values", "event", "type", "description"] as const;
const KINDS: readonly ApiMemberKind[] = ["attribute", "property", "event"];

function isObject(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

function stringField(
  file: string,
  where: string,
  source: Record<string, unknown>,
  key: string,
  pattern?: { regex: RegExp; hint: string },
): string {
  const value = source[key];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ImplementationError(file, `${where}${key} must be a non-empty string.`);
  }
  if (pattern && !pattern.regex.test(value)) {
    throw new ImplementationError(file, `${where}${key} "${value}" must be ${pattern.hint}.`);
  }
  return value;
}

function optionalString(
  file: string,
  where: string,
  source: Record<string, unknown>,
  key: string,
): string | undefined {
  if (source[key] === undefined) return undefined;
  return stringField(file, where, source, key);
}

function rejectUnknownKeys(
  file: string,
  where: string,
  source: Record<string, unknown>,
  allowed: readonly string[],
): void {
  for (const key of Object.keys(source)) {
    if (!allowed.includes(key)) {
      throw new ImplementationError(
        file,
        `${where}has an unknown field "${key}". Allowed fields: ${allowed.join(", ")}.`,
      );
    }
  }
}

function parseRow(file: string, raw: unknown, index: number): ImplementationApiRow {
  const where = `api[${index}] `;
  if (!isObject(raw)) throw new ImplementationError(file, `${where}must be a mapping.`);
  rejectUnknownKeys(file, where, raw, ROW_KEYS);
  const name = stringField(file, where, raw, "name");
  const kind = raw.kind;
  if (typeof kind !== "string" || !(KINDS as readonly string[]).includes(kind)) {
    throw new ImplementationError(
      file,
      `${where}(${name}) kind must be one of ${KINDS.join(", ")}.`,
    );
  }
  const row: { -readonly [K in keyof ImplementationApiRow]: ImplementationApiRow[K] } = {
    name,
    kind: kind as ApiMemberKind,
  };
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
    row.values = raw.values as Record<string, string>;
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

/** Parse and validate one implementation file. `file` is used in error messages. */
export function parseImplementation(source: string, file: string): Implementation {
  const match = source.match(FRONT_MATTER);
  if (!match) {
    throw new ImplementationError(file, "must start with YAML front matter between --- lines.");
  }
  let data: unknown;
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
  const seen = new Set<string>();
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

/** Every `*.md` file in `dir`, parsed, in file-name order. */
export function loadImplementations(dir: string): Implementation[] {
  return readdirSync(dir)
    .filter((name) => name.endsWith(".md"))
    .sort()
    .map((name) =>
      parseImplementation(readFileSync(join(dir, name), "utf8"), `implementation/${name}`),
    );
}

/** `implementation/button.md` -> `button`. */
export function implementationSlug(implementation: Implementation): string {
  return basename(implementation.file, ".md");
}
