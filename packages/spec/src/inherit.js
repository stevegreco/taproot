/**
 * The rules a component carries once it inherits from the patterns and guidelines it follows.
 *
 * A pattern or guideline may declare `rules`. A component inherits the rules of each record in its
 * `links.follows`. Its own `rules` may narrow an inherited rule (`extends`, same `id`) or set it
 * aside with a reason (`waived`). Every other own rule is the component's alone.
 *
 * @typedef {import("./spec.js").Level} Level
 *
 * @typedef {object} EffectiveRule
 * @property {string} id
 * @property {string} address Where the rule is written: `<record id>#<rule id>`.
 * @property {string} recordId The record the rule is written in.
 * @property {Level} level
 * @property {import("./spec.js").Topic} topic
 * @property {string} statement
 * @property {string} [extends] The inherited rule this one narrows, by address.
 * @property {string} [appliesTo] For an inherited rule, the component that inherits it.
 *
 * @typedef {object} WaivedRule
 * @property {string} id
 * @property {string} address The inherited rule set aside, by address.
 * @property {string} waived Why it does not apply.
 *
 * @typedef {object} RuleProblem
 * @property {string} path JSON pointer into the component record.
 * @property {string} message
 */

const LEVEL_RANK = { must: 0, should: 1, may: 2 };

/**
 * @param {Record<string, any>} record
 * @param {(id: string) => Record<string, any> | undefined} getRecord
 * @returns {{ rules: EffectiveRule[], waived: WaivedRule[], problems: RuleProblem[] }}
 */
export function resolveRules(record, getRecord) {
  /** @type {RuleProblem[]} */
  const problems = [];
  const own = Array.isArray(record.rules) ? record.rules : [];
  if (record.type !== "component") {
    return {
      rules: own.map((rule) => ({
        ...rule,
        address: `${record.id}#${rule.id}`,
        recordId: record.id,
      })),
      waived: [],
      problems,
    };
  }

  // Inherited rules by address, in `follows` order, then in the order each record lists them.
  /** @type {Map<string, { source: string, rule: Record<string, any> }>} */
  const inherited = new Map();
  for (const source of record.links?.follows ?? []) {
    const followed = getRecord(source);
    for (const rule of Array.isArray(followed?.rules) ? followed.rules : []) {
      inherited.set(`${source}#${rule.id}`, { source, rule });
    }
  }
  const byId = (id) => [...inherited].filter(([, entry]) => entry.rule.id === id);

  /** @type {EffectiveRule[]} */
  const rules = [];
  /** @type {WaivedRule[]} */
  const waived = [];
  const settled = new Set();

  own.forEach((rule, index) => {
    const pointer = `/rules/${index}`;
    if (rule.waived !== undefined || rule.extends !== undefined) {
      const found = findInherited(rule, inherited, byId, record, pointer, problems);
      if (!found) return;
      const [address, entry] = found;
      if (settled.has(address)) {
        problems.push({
          path: `${pointer}/id`,
          message: `${address} is already narrowed or waived by another rule`,
        });
        return;
      }
      settled.add(address);
      if (rule.waived !== undefined) {
        waived.push({ id: rule.id, address, waived: rule.waived });
        return;
      }
      const base = entry.rule;
      if (rule.level && LEVEL_RANK[rule.level] > LEVEL_RANK[base.level]) {
        problems.push({
          path: `${pointer}/level`,
          message: `\`${rule.level}\` is weaker than the \`${base.level}\` of ${address}; a rule that extends another may raise its level, never lower it`,
        });
      }
      // The statement is rewritten, so examples, rationale, and references written for the base
      // statement do not carry over. When the rule applies does, unless the component restates it.
      rules.push({
        ...(base.applicability === undefined ? {} : { applicability: base.applicability }),
        ...rule,
        level: rule.level ?? base.level,
        topic: base.topic,
        address: `${record.id}#${rule.id}`,
        recordId: record.id,
        extends: address,
      });
      return;
    }
    const clash = byId(rule.id);
    if (clash.length > 0) {
      problems.push({
        path: `${pointer}/id`,
        message: `rule id \`${rule.id}\` is already inherited from ${clash[0][0]}; add \`extends: ${clash[0][0]}\` to narrow it, or \`waived\` to set it aside`,
      });
    }
    rules.push({ ...rule, address: `${record.id}#${rule.id}`, recordId: record.id });
  });

  for (const [address, { source, rule }] of inherited) {
    if (settled.has(address)) continue;
    rules.push({ ...rule, address, recordId: source, appliesTo: record.id });
  }
  return { rules, waived, problems };
}

/** The inherited rule a narrowing or waived rule names, by `extends` or else by its `id`. */
function findInherited(rule, inherited, byId, record, pointer, problems) {
  if (rule.extends !== undefined) {
    const entry = inherited.get(rule.extends);
    if (!entry) {
      problems.push({
        path: `${pointer}/extends`,
        message: `\`${rule.extends}\` is not a rule of a pattern or guideline that ${record.id} follows`,
      });
      return undefined;
    }
    if (entry.rule.id !== rule.id) {
      problems.push({
        path: `${pointer}/id`,
        message: `a rule that extends ${rule.extends} keeps its id: use \`${entry.rule.id}\``,
      });
      return undefined;
    }
    return [rule.extends, entry];
  }
  const matches = byId(rule.id);
  if (matches.length === 1) return matches[0];
  problems.push({
    path: `${pointer}/id`,
    message:
      matches.length === 0
        ? `\`${rule.id}\` is waived, but no pattern or guideline that ${record.id} follows has a rule with that id`
        : `\`${rule.id}\` is inherited from ${matches.map(([address]) => address).join(" and ")}; add \`extends\` to say which one is waived`,
  });
  return undefined;
}
