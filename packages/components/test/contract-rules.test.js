/**
 * Census: every `must` rule in a component's behavior and accessibility
 * requirements has a test in test/<name>.test.js whose title carries the rule ID
 * in brackets, for example `test("[inline-underline] …")`, or a written reason in
 * test/unautomated-rules.js. `should` and `may` rules are reported, not enforced.
 *
 * test/host-checks.test.js runs once per component. A tag in one of its titles
 * counts for every component whose contract has that rule.
 */
import { readFileSync } from "node:fs";
import { openCatalog } from "@stevegreco/design-system-knowledge/retrieve";
import { describe, expect, test } from "vitest";

import { unautomatedRules } from "./unautomated-rules.js";

const catalog = await openCatalog();
const components = catalog.list({ type: "component" }).map((summary) => catalog.get(summary.id));

const SHARED_TESTS = "host-checks.test.js";
/** A `test(`, `test.each(…)(`, or similar call, its modifiers, then its string title. */
const TITLE =
  /\btest((?:\.\w+(?:\([^()]*(?:\([^()]*\)[^()]*)*\))?)*)\(\s*(["'`])((?:\\.|(?!\2).)*)\2/g;
/** Modifiers whose test may not run, so its tags do not count. */
const NOT_RUN = /\.(?:skip|todo|fails|skipIf|runIf)\b/;
/** Block comments and whole-line comments, so commented-out tests do not count. */
const COMMENTS = /\/\*[\s\S]*?\*\/|^\s*\/\/.*$/gm;
const TAG = /\[([a-z0-9-]+)\]/g;

function rulesOf(record) {
  const { contract } = record;
  return [...(contract.behavior ?? []), ...(contract.accessibility?.requirements ?? [])];
}

function slugOf(id) {
  return id.slice("component.".length);
}

/** Rule IDs tagged in the test titles of a file in test/. */
function taggedRules(file) {
  const source = readFileSync(new URL(`./${file}`, import.meta.url), "utf8").replace(COMMENTS, "");
  const tags = new Set();
  for (const [, modifiers, , title] of source.matchAll(TITLE)) {
    if (NOT_RUN.test(modifiers)) continue;
    for (const [, id] of title.matchAll(TAG)) tags.add(id);
  }
  return tags;
}

const sharedTags = taggedRules(SHARED_TESTS);

const census = components.map((record) => {
  const rules = rulesOf(record);
  const known = new Set(rules.map((rule) => rule.id));
  const own = taggedRules(`${slugOf(record.id)}.test.js`);
  return {
    id: record.id,
    slug: slugOf(record.id),
    rules,
    own,
    tagged: new Set([...own, ...[...sharedTags].filter((tag) => known.has(tag))]),
    unautomated: unautomatedRules[record.id] ?? {},
  };
});

describe("contract rule census", () => {
  const mustRules = census.flatMap((entry) =>
    entry.rules.filter((rule) => rule.level === "must").map((rule) => [entry.id, rule.id, entry]),
  );

  test.each(mustRules)(
    "%s %s has a test or a reason it cannot be automated",
    (id, ruleId, entry) => {
      const tested = entry.tagged.has(ruleId);
      const reason = entry.unautomated[ruleId];
      expect(
        tested || Boolean(reason),
        `${id} ${ruleId}: tag a test in test/${entry.slug}.test.js with [${ruleId}], or add a reason to test/unautomated-rules.js`,
      ).toBe(true);
      expect(
        tested && Boolean(reason),
        `${id} ${ruleId} is tested; remove it from test/unautomated-rules.js`,
      ).toBe(false);
    },
  );

  test.each(census.map((entry) => [entry.id, entry]))(
    "%s test tags name rules in its contract",
    (id, entry) => {
      const known = new Set(entry.rules.map((rule) => rule.id));
      const stale = [...entry.own].filter((tag) => !known.has(tag));
      expect(stale, `test/${entry.slug}.test.js tags rules ${id} no longer has`).toEqual([]);
    },
  );

  test(`${SHARED_TESTS} tags name rules some contract has`, () => {
    const known = new Set(census.flatMap((entry) => entry.rules.map((rule) => rule.id)));
    expect([...sharedTags].filter((tag) => !known.has(tag))).toEqual([]);
    expect(sharedTags.size, `${SHARED_TESTS} titles carry rule tags`).toBeGreaterThan(0);
  });

  test("unautomated rules name must rules that exist", () => {
    const stale = [];
    for (const [id, reasons] of Object.entries(unautomatedRules)) {
      const entry = census.find((candidate) => candidate.id === id);
      for (const ruleId of Object.keys(reasons)) {
        const rule = entry?.rules.find((candidate) => candidate.id === ruleId);
        if (rule?.level !== "must") stale.push(`${id} ${ruleId}`);
      }
    }
    expect(stale).toEqual([]);
  });

  test("reports should and may rules without a test", () => {
    const untested = census.flatMap((entry) =>
      entry.rules
        .filter((rule) => rule.level !== "must" && !entry.tagged.has(rule.id))
        .map((rule) => `${entry.id} ${rule.id} (${rule.level})`),
    );
    if (untested.length > 0) {
      console.info(`Contract rules without a test (not enforced):\n  ${untested.join("\n  ")}`);
    }
  });
});
