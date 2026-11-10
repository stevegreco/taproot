import fs from "node:fs";
import path from "node:path";
import { check, loadSpec } from "./index.js";
import { findImplementationProblems } from "./implementation.js";
import {
  loadImplementations,
  readImplementationFolder,
  readSetup,
} from "./implementation-files.js";
import { createSpecAjv } from "./schema/ajv.js";
import configSchema from "./schema/spec-config.schema.json" with { type: "json" };
import { createDtcgResolver, readDtcgTokenNames } from "./tokens-dtcg.js";

export const CONFIG_FILE = "spec.config.json";

/** Checks a config file against `schema/spec-config.schema.json`, which editors can use too. */
const validateConfigSchema = createSpecAjv().compile(configSchema);

/**
 * @typedef {object} SpecConfig
 * @property {string} [content] Content folder, relative to the config file.
 * @property {{ format: "dtcg", sets: Record<string, string[]> }} [tokens]
 *   Token sets; each set lists DTCG files, relative to the config file.
 * @property {Record<string, ImplementationConfig>} [implementations]
 *   Implementations by name, such as `web`. Each folder holds one `<slug>.md` implementation file
 *   per component, checked against the fields of its technology, and may hold a `README.md` with
 *   the setup every component shares (`taproot setup`).
 * @property {Record<string, string>} [constants] System-wide constants, such as border width, by
 *   name, each with the token that holds it. Every component uses them, so component records do
 *   not bind them. With token sets configured, each token must exist in every set.
 * @property {Record<string, VocabularyTerm>} [vocabulary] Concepts that keep one set of words
 *   across components, such as size or status, by name. `validate` checks each component's enum
 *   values against them.
 */

/**
 * @typedef {object} VocabularyTerm
 * @property {string[]} values The words for the concept.
 * @property {string} [parameter] An enum parameter with this name may use only `values`.
 * @property {Record<string, string>} [aliases] Words no enum value may use, each with the word in
 *   `values` to use instead.
 */

/**
 * @typedef {object} ImplementationConfig
 * @property {string} folder Relative to the config file; resolved to an absolute path on load.
 * @property {import("./implementation.js").Technology} technology
 */

/**
 * Walk up from `startDir` looking for `spec.config.json`.
 *
 * @param {string} startDir
 * @returns {{ path: string, config: SpecConfig } | undefined}
 */
export function findConfig(startDir) {
  let dir = path.resolve(startDir);
  for (;;) {
    const candidate = path.join(dir, CONFIG_FILE);
    if (fs.existsSync(candidate)) return readConfig(candidate);
    const parent = path.dirname(dir);
    if (parent === dir) return undefined;
    dir = parent;
  }
}

/**
 * Read and validate a config file.
 *
 * @param {string} file
 * @returns {{ path: string, config: SpecConfig }}
 */
export function readConfig(file) {
  const absolute = path.resolve(file);
  let raw;
  try {
    raw = fs.readFileSync(absolute, "utf8");
  } catch (error) {
    throw new Error(`Cannot read config ${absolute}: ${error.message}`);
  }
  let config;
  try {
    config = JSON.parse(raw);
  } catch (error) {
    throw new Error(`Invalid config ${absolute}: not valid JSON (${error.message})`);
  }
  validateConfig(config, absolute);
  return { path: absolute, config };
}

function validateConfig(config, file) {
  const fail = (message) => {
    throw new Error(`Invalid config ${file}: ${message}`);
  };
  if (!validateConfigSchema(config)) {
    const messages = (validateConfigSchema.errors ?? [])
      // A name that fails its pattern is reported once, with the name.
      .filter((error) => error.keyword !== "propertyNames")
      .map(configMessage);
    fail([...new Set(messages)].join("; "));
  }
  // What the schema cannot say: each alias names a word in values, and is not one.
  for (const [name, term] of Object.entries(config.vocabulary ?? {})) {
    for (const [alias, word] of Object.entries(term.aliases ?? {})) {
      const at = `"vocabulary.${name}.aliases.${alias}"`;
      if (term.values.includes(alias)) fail(`${at} is also in values`);
      if (!term.values.includes(word)) {
        fail(`${at} must name a word in values, not ${JSON.stringify(word)}`);
      }
    }
  }
}

/** One schema error as a sentence that names the field, such as `"tokens.format" must be "dtcg"`. */
function configMessage(error) {
  const at = error.instancePath
    .split("/")
    .slice(1)
    .map((segment) => segment.replaceAll("~1", "/").replaceAll("~0", "~"))
    .join(".");
  const field = at ? `"${at}"` : "the config";
  const { params } = error;
  if (error.propertyName !== undefined) {
    return `"${at ? `${at}.` : ""}${error.propertyName}" must be a lowercase, hyphenated name`;
  }
  switch (error.keyword) {
    case "additionalProperties":
      return `${field} has an unknown field "${params.additionalProperty}"`;
    case "required":
      return `${field} needs "${params.missingProperty}"`;
    case "type":
      return `${field} must be ${/^[aeiou]/.test(params.type) ? "an" : "a"} ${params.type}`;
    case "const":
      return `${field} must be ${JSON.stringify(params.allowedValue)}`;
    case "enum":
      return `${field} must be one of ${params.allowedValues.join(", ")}`;
    case "minLength":
    case "minItems":
      return `${field} must not be empty`;
    case "uniqueItems":
      return `${field} lists a word twice`;
    default:
      return `${field} ${error.message}`;
  }
}

/**
 * Work out the content folder and token resolver from flags and config.
 * Precedence for the content folder: `contentDir` > config `content` > library default.
 *
 * @param {{ cwd?: string, contentDir?: string, configPath?: string }} [options]
 * @returns {{ contentDir?: string, resolveToken?: (ref: string) => Record<string, string> | undefined, tokenSets?: Record<string, string[]>, implementations: Record<string, ImplementationConfig & import("./operations.js").ImplementationSource>, constants: Record<string, string>, vocabulary: Record<string, VocabularyTerm>, configPath?: string }}
 */
export function resolveConfig({ cwd = process.cwd(), contentDir, configPath } = {}) {
  const found = configPath ? readConfig(path.resolve(cwd, configPath)) : findConfig(cwd);
  const base = found ? path.dirname(found.path) : undefined;
  let dir;
  if (contentDir) dir = path.resolve(cwd, contentDir);
  else if (found?.config.content) dir = path.resolve(base, found.config.content);
  let resolveToken;
  let sets;
  if (found?.config.tokens) {
    sets = Object.fromEntries(
      Object.entries(found.config.tokens.sets).map(([name, files]) => [
        name,
        files.map((file) => path.resolve(base, file)),
      ]),
    );
    resolveToken = createDtcgResolver(sets);
  }
  const implementations = Object.fromEntries(
    Object.entries(found?.config.implementations ?? {}).map(([name, { folder, technology }]) => [
      name,
      {
        folder: path.resolve(base, folder),
        technology,
        load: () => loadImplementations(path.resolve(base, folder), technology),
        setup: () => readSetup(path.resolve(base, folder)),
      },
    ]),
  );
  return {
    contentDir: dir,
    resolveToken,
    tokenSets: sets,
    implementations,
    constants: { ...found?.config.constants },
    vocabulary: { ...found?.config.vocabulary },
    configPath: found?.path,
  };
}

/**
 * Load the spec using flags and the nearest config. Pass `resolveTokens: false` to skip the token
 * resolver, so token files are never read, and `skipInvalid: true` to leave out invalid records
 * instead of throwing.
 *
 * @param {{ cwd?: string, contentDir?: string, configPath?: string, resolveTokens?: boolean, skipInvalid?: boolean }} [options]
 */
export async function loadFromConfig({ resolveTokens = true, skipInvalid, ...options } = {}) {
  const { contentDir, resolveToken } = resolveConfig(options);
  return loadSpec({
    contentDir,
    resolveToken: resolveTokens ? resolveToken : undefined,
    skipInvalid,
  });
}

/**
 * Validate the spec using flags and the nearest config. With token sets configured, every token
 * reference, and every constant's token, must name a token in every set. With a vocabulary, each
 * component's enum values must keep to it. Every implementation file must parse and match its
 * record.
 *
 * @param {{ cwd?: string, contentDir?: string, configPath?: string }} [options]
 */
export async function validateFromConfig(options = {}) {
  const { issues, recordCount } = await checkFromConfig(options);
  return { issues, recordCount };
}

/**
 * Every check, in one place, so `validate` and a snapshot build agree on what is valid: the records
 * against the schema and each other, token references and vocabulary, the constants' tokens, and
 * each implementation file against its record. Issues in record files are relative to the content
 * folder; issues in the config and implementation files are relative to `cwd`. Implementation files
 * are checked only when the content is the folder the config names.
 *
 * @param {{ cwd?: string, contentDir?: string, configPath?: string, implementations?: string[] }} [options]
 *   `implementations` limits the implementation checks to these names. By default, all of them.
 */
export async function checkFromConfig({ implementations: names, ...options } = {}) {
  const cwd = options.cwd ?? process.cwd();
  const config = resolveConfig(options);
  const tokenNames = config.tokenSets ? readDtcgTokenNames(config.tokenSets) : undefined;
  const result = await check({
    contentDir: config.contentDir,
    tokenNames,
    vocabulary: config.vocabulary,
  });
  const issues = [...result.issues];

  if (tokenNames) {
    const file = path.relative(cwd, config.configPath);
    for (const [name, token] of Object.entries(config.constants)) {
      const missing = [...tokenNames].filter(([, set]) => !set.has(token)).map(([set]) => set);
      if (missing.length === 0) continue;
      issues.push({
        file,
        path: `/constants/${name}`,
        message:
          missing.length === tokenNames.size
            ? `\`${token}\` is not a token`
            : `\`${token}\` is not a token in the ${missing.join(", ")} set${missing.length === 1 ? "" : "s"}`,
      });
    }
  }

  // Implementation files describe the configured content. Content named with `contentDir` instead
  // is other records, so the files are not checked against it.
  const configured = options.contentDir
    ? resolveConfig({ ...options, contentDir: undefined }).contentDir
    : config.contentDir;
  const checksImplementations = configured === config.contentDir;
  const dataById = new Map(result.records.map(({ data }) => [data.id, data]));
  /** @type {Record<string, { technology: import("./implementation.js").Technology, items: import("./implementation.js").Implementation[] }>} */
  const loaded = {};
  for (const [name, { folder, technology }] of Object.entries(config.implementations)) {
    if ((names && !names.includes(name)) || !checksImplementations) continue;
    const folderResult = readImplementationFolder(folder, technology);
    const at = (absolute) => path.relative(cwd, absolute);
    for (const issue of folderResult.issues) {
      issues.push({ file: at(issue.path), path: "", message: issue.message });
    }
    for (const { implementation, path: absolute } of folderResult.items) {
      for (const message of findImplementationProblems(
        implementation,
        dataById.get(implementation.component),
      )) {
        issues.push({ file: at(absolute), path: "", message });
      }
    }
    loaded[name] = {
      technology,
      items: folderResult.items.map((item) => item.implementation),
    };
  }

  return {
    config,
    issues,
    recordCount: result.sources.length,
    records: result.records,
    implementations: loaded,
  };
}
