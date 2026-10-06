import { stat } from "node:fs/promises";
import path from "node:path";
import { createSpecAjv } from "./schema/ajv.js";
import { COMMON_FIELDS, RECORD_ID, schema, typeFields } from "./schema/info.js";
import { buildSections } from "./sections.js";
import { byCodeUnit, pointerSegment, recordIdOf } from "./util.js";

const validateSchema = createSpecAjv().compile(schema);
const RECORD_TYPES = schema.properties.type.enum;

/**
 * @typedef {object} Issue
 * @property {string} file Path relative to the content folder.
 * @property {number} [line] 1-based, when known.
 * @property {string} path JSON pointer into the record; empty for the record itself.
 * @property {string} message
 */

/**
 * A record that passed its schema, ready for the cross-record checks and the index.
 *
 * @typedef {object} CheckedRecord
 * @property {import("./load.js").SourceFile} source
 * @property {Record<string, any>} data
 * @property {Map<string, import("./sections.js").SectionEntry>} sections
 */

/**
 * Check every source file against the schema and against the rest of the corpus.
 *
 * @param {import("./load.js").SourceFile[]} sources
 * @returns {Promise<{ issues: Issue[], records: CheckedRecord[] }>}
 */
export async function checkSources(sources) {
  /** @type {Issue[]} */
  const issues = [];
  const report = (source, raw) => {
    const line = raw.line ?? (raw.path ? source.locate(raw.path) : undefined);
    issues.push({
      file: source.file,
      ...(line ? { line } : {}),
      path: raw.path,
      message: raw.message,
    });
  };

  /** @type {Map<string, CheckedRecord>} */
  const byId = new Map();
  /** @type {CheckedRecord[]} */
  const records = [];
  for (const source of sources) {
    if (!source.data) {
      for (const raw of source.issues) report(source, raw);
      continue;
    }
    const failures = findSchemaIssues(source.data);
    for (const raw of failures) report(source, raw);
    const valid = failures.length === 0;
    const record = {
      source,
      data: source.data,
      sections: valid ? buildSections(source.data, source.body) : new Map(),
    };
    checkId(source, record, byId, report);
    if (valid) records.push(record);
  }

  const validById = new Map(records.map((record) => [record.data.id, record]));
  for (const record of records) {
    const report_ = (raw) => report(record.source, raw);
    checkReferences(record, byId, validById, report_);
    if (record.data.type === "component") {
      checkRules(record.data, report_);
      checkParameters(record.data, report_);
      checkTokens(record.data, report_);
    }
    if (record.data.type === "example") {
      checkAnnotations(record, report_);
      await checkAssets(record, report_);
    }
  }

  issues.sort(compareIssues);
  return { issues, records };
}

function compareIssues(left, right) {
  return (
    byCodeUnit(left.file, right.file) ||
    (left.line ?? 0) - (right.line ?? 0) ||
    byCodeUnit(left.path, right.path) ||
    byCodeUnit(left.message, right.message)
  );
}

// --- Schema ---

/** @returns {import("./yaml.js").RawIssue[]} */
function findSchemaIssues(data) {
  if (validateSchema(data)) return [];
  const known = new Set([...COMMON_FIELDS, ...typeFields(data.type)]);
  const knownType = RECORD_TYPES.includes(data.type);
  const seen = new Set();
  const issues = [];
  for (const error of validateSchema.errors ?? []) {
    // A failed `then` branch reports its own errors.
    if (error.keyword === "if" || error.keyword === "propertyNames") continue;
    if (error.keyword === "unevaluatedProperties") {
      // A failed branch leaves its fields unevaluated. Only unknown fields are real mistakes.
      const name = error.params.unevaluatedProperty;
      if (error.instancePath === "" && (!knownType || known.has(name))) continue;
    }
    const pointer = issuePointer(error);
    const issue = { path: pointer, message: `${describeField(pointer)} ${issueMessage(error)}` };
    const key = `${issue.path}\n${issue.message}`;
    if (!seen.has(key)) {
      seen.add(key);
      issues.push(issue);
    }
  }
  return issues;
}

function issuePointer(error) {
  const { instancePath, params } = error;
  const join = (name) => `${instancePath}/${pointerSegment(name)}`;
  if (error.propertyName !== undefined) return join(error.propertyName);
  switch (error.keyword) {
    case "required":
      return join(params.missingProperty);
    case "additionalProperties":
      return join(params.additionalProperty);
    case "unevaluatedProperties":
      return join(params.unevaluatedProperty);
    default:
      return instancePath;
  }
}

function describeField(pointer) {
  if (pointer === "") return "record";
  const last = pointer.split("/").at(-1).replaceAll("~1", "/").replaceAll("~0", "~");
  return /^\d+$/.test(last) ? `item ${last}` : `\`${last}\``;
}

function issueMessage(error) {
  const { params } = error;
  if (error.propertyName !== undefined) return "is not a valid name";
  switch (error.keyword) {
    case "enum":
      return `must be one of ${params.allowedValues.map((value) => JSON.stringify(value)).join(", ")}`;
    case "const":
      return `must be ${JSON.stringify(params.allowedValue)}`;
    case "required":
      return "is required";
    case "additionalProperties":
    case "unevaluatedProperties":
      return "is not an allowed field";
    case "false schema":
      return "is not allowed here";
    case "minLength":
      return "must not be empty";
    case "minItems":
      return `must have at least ${params.limit} item${params.limit === 1 ? "" : "s"}`;
    case "minProperties":
      return `must have at least ${params.limit} entr${params.limit === 1 ? "y" : "ies"}`;
    case "minimum":
      return `must be at least ${params.limit}`;
    case "uniqueItems":
      return "must not repeat an item";
    case "type":
      return `must be ${[params.type].flat().join(" or ")}`;
    case "pattern":
      return `must match ${params.pattern}`;
    default:
      return error.message ?? "is invalid";
  }
}

// --- Identity ---

function checkId(source, record, byId, report) {
  const { id, type } = record.data;
  if (typeof id !== "string") return;
  if (typeof type === "string" && RECORD_ID.test(id) && id.split(".")[0] !== type) {
    report(source, {
      path: "/id",
      message: `\`id\` prefix \`${id.split(".")[0]}\` must equal the record type \`${type}\``,
    });
  }
  const first = byId.get(id);
  if (first) {
    report(source, {
      path: "/id",
      message: `\`id\` ${id} is already used by ${first.source.file}`,
    });
  } else {
    byId.set(id, record);
  }
}

// --- Links, references, and sections ---

function* targets(data) {
  for (const [kind, list] of Object.entries(data.links ?? {})) {
    for (const [index, target] of list.entries()) yield [`/links/${kind}/${index}`, target];
  }
  for (const [index, item] of (data.usage?.avoid ?? []).entries()) {
    if (typeof item.instead === "string" && RECORD_ID.test(item.instead)) {
      yield [`/usage/avoid/${index}/instead`, item.instead];
    }
  }
  for (const [index, rule] of (data.rules ?? []).entries()) {
    for (const [at, target] of (rule.references ?? []).entries()) {
      yield [`/rules/${index}/references/${at}`, target];
    }
  }
  for (const [name, parameter] of Object.entries(data.parameters ?? {})) {
    for (const [value, target] of Object.entries(parameter.guidance ?? {})) {
      yield [`/parameters/${pointerSegment(name)}/guidance/${pointerSegment(value)}`, target];
    }
  }
  for (const [index, annotation] of (data.annotations ?? []).entries()) {
    for (const [at, target] of (annotation.references ?? []).entries()) {
      yield [`/annotations/${index}/references/${at}`, target];
    }
  }
}

/**
 * Resolve each link target against the records that passed their schema. A target that exists but
 * is invalid is reported here too, because its sections are unknown.
 */
function checkReferences(record, byId, validById, report) {
  for (const [pointer, target] of targets(record.data)) {
    const id = recordIdOf(target);
    const found = validById.get(id);
    if (!found) {
      report({
        path: pointer,
        message: byId.has(id)
          ? `\`${target}\` points at ${id}, which is not a valid record`
          : `\`${target}\` does not match any record`,
      });
      continue;
    }
    const section = target.slice(id.length + 1);
    if (target.includes("#") && !found.sections.has(section)) {
      report({ path: pointer, message: `${id} has no section \`${section}\`` });
    }
  }
}

// --- Component checks ---

function checkRules(data, report) {
  const reserved = new Set([...COMMON_FIELDS, ...typeFields("component")]);
  const seen = new Map();
  for (const [index, rule] of (data.rules ?? []).entries()) {
    const pointer = `/rules/${index}/id`;
    if (seen.has(rule.id)) {
      report({
        path: pointer,
        message: `rule id \`${rule.id}\` is already used by /rules/${seen.get(rule.id)}`,
      });
    } else {
      seen.set(rule.id, index);
      if (reserved.has(rule.id)) {
        report({ path: pointer, message: `rule id \`${rule.id}\` is also a top-level field name` });
      }
    }
  }
}

function checkParameters(data, report) {
  for (const [name, parameter] of Object.entries(data.parameters ?? {})) {
    if (parameter.kind !== "enum") continue;
    const values = parameter.values ?? {};
    if (typeof parameter.default === "string" && !Object.hasOwn(values, parameter.default)) {
      report({
        path: `/parameters/${pointerSegment(name)}/default`,
        message: `\`default\` ${parameter.default} is not one of the values of \`${name}\``,
      });
    }
    for (const field of ["examples", "guidance"]) {
      for (const key of Object.keys(parameter[field] ?? {})) {
        if (!Object.hasOwn(values, key)) {
          report({
            path: `/parameters/${pointerSegment(name)}/${field}/${pointerSegment(key)}`,
            message: `${field === "examples" ? "example" : "guidance"} \`${key}\` is not one of the values of \`${name}\``,
          });
        }
      }
    }
  }
}

function checkTokens(data, report) {
  const states = new Set(data.states ?? []);
  for (const [part, conditions] of Object.entries(data.tokens ?? {})) {
    if (!Object.hasOwn(data.anatomy, part)) {
      report({
        path: `/tokens/${pointerSegment(part)}`,
        message: `token part \`${part}\` is not an anatomy part`,
      });
      continue;
    }
    for (const condition of Object.keys(conditions)) {
      for (const term of condition.split(" + ")) {
        const problem = conditionProblem(term, data, states);
        if (problem) {
          report({
            path: `/tokens/${pointerSegment(part)}/${pointerSegment(condition)}`,
            message: `condition \`${condition}\`: ${problem}`,
          });
        }
      }
    }
  }
}

function conditionProblem(term, data, states) {
  if (term === "base") return undefined;
  const dot = term.indexOf(".");
  if (dot === -1) {
    return states.has(term) ? undefined : `\`${term}\` is not \`base\` or a declared state`;
  }
  const name = term.slice(0, dot);
  const value = term.slice(dot + 1);
  const parameter = data.parameters?.[name];
  if (parameter) {
    if (parameter.kind === "enum") {
      return Object.hasOwn(parameter.values, value)
        ? undefined
        : `\`${value}\` is not a value of parameter \`${name}\``;
    }
    if (parameter.kind === "boolean") {
      return value === "true" || value === "false"
        ? undefined
        : `boolean parameter \`${name}\` takes \`true\` or \`false\``;
    }
    return `parameter \`${name}\` has no enumerable values`;
  }
  const preference = data.preferences?.[name];
  if (preference) {
    return preference.includes(value)
      ? undefined
      : `\`${value}\` is not a value of preference \`${name}\``;
  }
  return `\`${name}\` is not a declared parameter or preference`;
}

// --- Examples ---

/**
 * An annotation's id is its section address, so it must not repeat another annotation's id or a
 * heading's slug. Either collision would hide one of them from retrieval.
 */
function checkAnnotations(record, report) {
  const first = new Map();
  for (const [index, annotation] of (record.data.annotations ?? []).entries()) {
    const pointer = `/annotations/${index}/id`;
    if (first.has(annotation.id)) {
      report({
        path: pointer,
        message: `annotation id \`${annotation.id}\` is already used by /annotations/${first.get(annotation.id)}`,
      });
      continue;
    }
    first.set(annotation.id, index);
    const entry = record.sections.get(annotation.id);
    if (entry?.kind === "heading") {
      report({
        path: pointer,
        message: `annotation id \`${annotation.id}\` is also the address of the heading "${entry.title}"`,
      });
    }
  }
}

async function checkAssets(record, report) {
  const directory = path.dirname(record.source.absolute);
  for (const [index, asset] of (record.data.assets ?? []).entries()) {
    const resolved = path.resolve(directory, asset.path);
    const escapes =
      path.isAbsolute(asset.path) ||
      asset.path.split(/[\\/]/).includes("..") ||
      path.relative(directory, resolved).startsWith("..");
    if (escapes) {
      report({
        path: `/assets/${index}/path`,
        message: `asset path \`${asset.path}\` must be relative and stay inside the record's folder`,
      });
      continue;
    }
    const info = await stat(resolved).catch(() => undefined);
    if (!info?.isFile()) {
      report({
        path: `/assets/${index}/path`,
        message: `asset file \`${asset.path}\` does not exist`,
      });
    }
  }
}
