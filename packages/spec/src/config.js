import fs from "node:fs";
import path from "node:path";
import { loadSpec, validateSpec } from "./index.js";
import { createDtcgResolver, readDtcgTokenNames } from "./tokens-dtcg.js";

export const CONFIG_FILE = "spec.config.json";

/**
 * @typedef {object} SpecConfig
 * @property {string} [content] Content folder, relative to the config file.
 * @property {{ format: "dtcg", sets: Record<string, string[]> }} [tokens]
 *   Token sets; each set lists DTCG files, relative to the config file.
 * @property {Record<string, string>} [implementations]
 *   Implementation folders by name, such as `web`, relative to the config file. Each folder holds
 *   one `<slug>.md` implementation file per component.
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
    if (!["content", "tokens", "implementations"].includes(key)) fail(`unknown field "${key}"`);
  }
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
      fail('"implementations" must be an object of name to folder path');
    }
    for (const [name, dir] of Object.entries(implementations)) {
      if (typeof dir !== "string" || !dir) {
        fail(`"implementations.${name}" must be a non-empty string path`);
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

/**
 * Work out the content folder and token resolver from flags and config.
 * Precedence for the content folder: `contentDir` > config `content` > library default.
 *
 * @param {{ cwd?: string, contentDir?: string, configPath?: string }} [options]
 * @returns {{ contentDir?: string, resolveToken?: (ref: string) => Record<string, string> | undefined, tokenSets?: Record<string, string[]>, implementations: Record<string, string>, configPath?: string }}
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
    Object.entries(found?.config.implementations ?? {}).map(([name, folder]) => [
      name,
      path.resolve(base, folder),
    ]),
  );
  return {
    contentDir: dir,
    resolveToken,
    tokenSets: sets,
    implementations,
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
 * reference must name a token in every set.
 *
 * @param {{ cwd?: string, contentDir?: string, configPath?: string }} [options]
 */
export async function validateFromConfig(options = {}) {
  const { contentDir, tokenSets } = resolveConfig(options);
  return validateSpec({
    contentDir,
    tokenNames: tokenSets ? readDtcgTokenNames(tokenSets) : undefined,
  });
}
