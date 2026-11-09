import { checkFromConfig } from "./config.js";
import { SpecError } from "./index.js";
import { readDtcgTokenNames } from "./tokens-dtcg.js";

/**
 * Build a snapshot from the source files. It runs the same checks as `taproot validate`, including
 * token references, vocabulary, constants, and the included implementation files, and stops at any
 * issue, so a hosted deploy cannot serve a broken record, token, or mapping.
 *
 * @param {{ cwd?: string, contentDir?: string, configPath?: string, implementations?: string[] }} [options]
 *   `implementations` names the ones to include, in config order. By default, all of them.
 * @returns {Promise<import("./snapshot.js").Snapshot>}
 */
export async function buildSnapshot(options = {}) {
  const { config, issues, records, implementations } = await checkFromConfig(options);
  for (const name of options.implementations ?? []) {
    if (!config.implementations[name]) throw new Error(`No implementation named "${name}".`);
  }
  if (issues.length > 0) throw new SpecError(issues);
  // Each implementation's shared setup, its folder's README.md, travels with its files.
  for (const [name, implementation] of Object.entries(implementations)) {
    const text = config.implementations[name].setup();
    if (text !== undefined) implementation.setup = text;
  }

  const tokens = {};
  if (config.tokenSets) {
    const refs = [...readDtcgTokenNames(config.tokenSets).values()].flatMap((set) => [...set]);
    for (const ref of [...new Set(refs)].sort()) tokens[ref] = config.resolveToken(ref);
  }

  return {
    records: records.map(({ source, data, sections }) => ({
      file: source.file,
      data,
      body: source.body,
      sections: [...sections],
    })),
    implementations,
    constants: config.constants,
    tokens,
  };
}
