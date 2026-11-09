import { resolveConfig } from "./config.js";
import { checkImplementation } from "./implementation.js";
import { SpecError, check } from "./index.js";
import { readDtcgTokenNames } from "./tokens-dtcg.js";

/**
 * Build a snapshot from the source files. Unlike the CLI, it stops at any issue, so a hosted deploy
 * cannot serve a broken record or mapping.
 *
 * @param {{ cwd?: string, contentDir?: string, configPath?: string, implementations?: string[] }} [options]
 *   `implementations` names the ones to include, in config order. By default, all of them.
 * @returns {Promise<import("./snapshot.js").Snapshot>}
 */
export async function buildSnapshot({ implementations: names, ...options } = {}) {
  const config = resolveConfig(options);
  const { issues, records } = await check({ contentDir: config.contentDir });
  if (issues.length > 0) throw new SpecError(issues);
  const dataById = new Map(records.map(({ data }) => [data.id, data]));

  for (const name of names ?? []) {
    if (!config.implementations[name]) throw new Error(`No implementation named "${name}".`);
  }
  const implementations = {};
  for (const [name, { technology, load, setup }] of Object.entries(config.implementations)) {
    if (names && !names.includes(name)) continue;
    const items = load();
    for (const item of items) checkImplementation(item, dataById.get(item.component));
    const text = setup();
    implementations[name] = { technology, items, ...(text === undefined ? {} : { setup: text }) };
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
