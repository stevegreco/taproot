/**
 * Census: every `must` rule in a component's behavior and accessibility
 * requirements has a test in test/<name>.test.js whose title carries the rule ID
 * in brackets, for example `test("[inline-underline] …")`, or a written reason in
 * test/unautomated-rules.js. `should` and `may` rules are reported, not enforced.
 */
import { readFileSync } from "node:fs";
import { openCatalog } from "@stevegreco/design-system-knowledge/retrieve";
import { describe, expect, test } from "vitest";

import { unautomatedRules } from "./unautomated-rules.js";

const catalog = await openCatalog();
const components = catalog.list({ type: "component" }).map((summary) => catalog.get(summary.id));

const TITLE = /\btest(?:\.\w+)*\(\s*(["'`])((?:\\.|(?!\1).)*)\1/g;
const TAG = /\[([a-z0-9-]+)\]/g;

function rulesOf(record) {
  const { contract } = record;
  return [...(contract.behavior ?? []), ...(contract.accessibility?.requirements ?? [])];
}

function slugOf(id) {
  return id.slice("component.".length);
}

/** Rule IDs tagged in the titles of test/<name>.test.js. */
function taggedRules(slug) {
  const source = readFileSync(new URL(`./${slug}.test.js`, import.meta.url), "utf8");
  const tags = new Set();
  for (const [, , title] of source.matchAll(TITLE)) {
    for (const [, id] of title.matchAll(TAG)) tags.add(id);
  }
  return tags;
}

const census = components.map((record) => {
  const rules = rulesOf(record);
  return {
    id: record.id,
    slug: slugOf(record.id),
    rules,
    tagged: taggedRules(slugOf(record.id)),
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
      const stale = [...entry.tagged].filter((tag) => !known.has(tag));
      expect(stale, `test/${entry.slug}.test.js tags rules ${id} no longer has`).toEqual([]);
    },
  );

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
