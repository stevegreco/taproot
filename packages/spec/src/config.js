import fs from "node:fs";
import path from "node:path";
import { loadSpec, validateSpec } from "./index.js";
import { TECHNOLOGY_NAMES } from "./implementation.js";
import { loadImplementations, readSetup } from "./implementation-files.js";
import { createDtcgResolver, readDtcgTokenNames } from "./tokens-dtcg.js";

export const CONFIG_FILE = "spec.config.json";

const NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

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
  if (typeof config !== "object" || config === null || Array.isArray(config)) {
    fail("expected an object");
  }
  for (const key of Object.keys(config)) {
    if (!["content", "tokens", "implementations", "constants", "vocabulary"].includes(key)) {
      fail(`unknown field "${key}"`);
    }
  }
  const { constants } = config;
  if (constants !== undefined) {
    if (typeof constants !== "object" || constants === null || Array.isArray(constants)) {
      fail('"constants" must be an object of name to token reference');
    }
    for (const [name, token] of Object.entries(constants)) {
      if (!NAME.test(name)) fail(`"constants.${name}" must be a lowercase, hyphenated name`);
      if (typeof token !== "string" || !token) {
        fail(`"constants.${name}" must be a non-empty token reference`);
      }
    }
  }
  validateVocabulary(config.vocabulary, fail);
  if (config.content !== undefined && (typeof config.content !== "string" || !config.content)) {
    fail('"content" must be a non-empty string path');
  }
  const { implementations } = config;
  if (implementations !== undefined) {
    if (
      typeof implementations !== "object" ||
      implementations === null ||
      Array.isArray(implementations)
    ) {
      fail('"implementations" must be an object of name to { folder, technology }');
    }
    for (const [name, entry] of Object.entries(implementations)) {
      if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
        fail(`"implementations.${name}" must be an object with "folder" and "technology"`);
      }
      for (const key of Object.keys(entry)) {
        if (!["folder", "technology"].includes(key)) {
          fail(`"implementations.${name}" has an unknown field "${key}"`);
        }
      }
      if (typeof entry.folder !== "string" || !entry.folder) {
        fail(`"implementations.${name}.folder" must be a non-empty string path`);
      }
      if (!TECHNOLOGY_NAMES.includes(entry.technology)) {
        fail(`"implementations.${name}.technology" must be one of ${TECHNOLOGY_NAMES.join(", ")}`);
      }
    }
  }
  if (config.tokens === undefined) return;
  const { tokens } = config;
  if (typeof tokens !== "object" || tokens === null || Array.isArray(tokens)) {
    fail('"tokens" must be an object');
  }
  if (tokens.format !== "dtcg") fail('"tokens.format" must be "dtcg"');
  if (typeof tokens.sets !== "object" || tokens.sets === null || Array.isArray(tokens.sets)) {
    fail('"tokens.sets" must be an object of set name to file list');
  }
  for (const [name, files] of Object.entries(tokens.sets)) {
    if (!Array.isArray(files) || files.some((f) => typeof f !== "string")) {
      fail(`"tokens.sets.${name}" must be an array of file paths`);
    }
  }
}

function validateVocabulary(vocabulary, fail) {
  if (vocabulary === undefined) return;
  const isObject = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
  const isWord = (value) => typeof value === "string" && value !== "";
  if (!isObject(vocabulary)) fail('"vocabulary" must be an object of concept name to term');
  for (const [name, term] of Object.entries(vocabulary)) {
    const at = `"vocabulary.${name}"`;
    if (!NAME.test(name)) fail(`${at} must be a lowercase, hyphenated name`);
    if (!isObject(term)) fail(`${at} must be an object with "values"`);
    for (const key of Object.keys(term)) {
      if (!["values", "parameter", "aliases"].includes(key)) {
        fail(`${at} has an unknown field "${key}"`);
      }
    }
    const { values, parameter, aliases } = term;
    if (!Array.isArray(values) || values.length === 0 || !values.every(isWord)) {
      fail(`${at}.values must be a non-empty array of words`);
    }
    if (new Set(values).size !== values.length) fail(`${at}.values lists a word twice`);
    if (parameter !== undefined && !isWord(parameter)) {
      fail(`${at}.parameter must be a parameter name`);
    }
    if (aliases === undefined) continue;
    if (!isObject(aliases)) fail(`${at}.aliases must be an object of word to word in values`);
    for (const [alias, word] of Object.entries(aliases)) {
      if (values.includes(alias)) fail(`${at}.aliases.${alias} is also in values`);
      if (!values.includes(word)) {
        fail(`${at}.aliases.${alias} must name a word in values, not ${JSON.stringify(word)}`);
      }
    }
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
 * component's enum values must keep to it.
 *
 * @param {{ cwd?: string, contentDir?: string, configPath?: string }} [options]
 */
export async function validateFromConfig(options = {}) {
  const { contentDir, tokenSets, constants, vocabulary, configPath } = resolveConfig(options);
  const tokenNames = tokenSets ? readDtcgTokenNames(tokenSets) : undefined;
  const result = await validateSpec({ contentDir, tokenNames, vocabulary });
  if (!tokenNames) return result;
  const file = path.relative(options.cwd ?? process.cwd(), configPath);
  const issues = Object.entries(constants).flatMap(([name, token]) => {
    const missing = [...tokenNames].filter(([, names]) => !names.has(token)).map(([set]) => set);
    return missing.length
      ? [
          {
            file,
            path: `/constants/${name}`,
            message:
              missing.length === tokenNames.size
                ? `\`${token}\` is not a token`
                : `\`${token}\` is not a token in the ${missing.join(", ")} set${missing.length === 1 ? "" : "s"}`,
          },
        ]
      : [];
  });
  return { ...result, issues: [...result.issues, ...issues] };
}
