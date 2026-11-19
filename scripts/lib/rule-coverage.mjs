/**
 * Which MUST rules a component's tests prove. A test proves a rule when its name, or the name of
 * the `describe` block around it, cites the rule in one of two forms:
 *
 * - a tag at the start of a test name: `[rule-id] …`, or several: `[a] [b] …`
 * - the rule's address: `component.slider#keyboard-steps`, or an inherited rule's own address,
 *   such as `pattern.form-field#error-blocks-submit`
 *
 * Content rules say what authors write, which a component test can't check, so they are left out.
 * `pnpm component:status` and packages/components/test/node/rule-coverage.test.js both use this.
 */

/**
 * The test files whose names count toward a component's rule coverage, by implementation
 * technology, relative to the implementation's package. The web host checks run every component
 * through the same tests, so their tags count for each one.
 */
export const RULE_TEST_FILES = {
  "web-component": (slug) => [`test/${slug}.test.js`, "test/host-checks.test.js"],
  react: (slug) => [`test/${slug}.test.tsx`],
};

/** Rule ids a test source cites, by tag or by address. */
export function citedRuleIds(source) {
  const ids = new Set();
  for (const [, tags] of source.matchAll(/["'`]((?:\[[a-z0-9-]+\] ?)+) /g)) {
    for (const [, id] of tags.matchAll(/\[([a-z0-9-]+)\]/g)) ids.add(id);
  }
  for (const [, id] of source.matchAll(/\b[a-z]+\.[a-z0-9-]+#([a-z0-9-]+)\b/g)) ids.add(id);
  return ids;
}

/** The MUST rules a component's tests have to prove: every one except content rules. */
export const testableMustRules = (rules) =>
  rules.filter((rule) => rule.level === "must" && rule.topic !== "content");

/** The testable MUST rules that no test in `source` cites. */
export function untestedRules(rules, source) {
  const cited = citedRuleIds(source);
  return testableMustRules(rules).filter((rule) => !cited.has(rule.id));
}
