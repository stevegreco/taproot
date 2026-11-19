/**
 * Every testable MUST rule of a built component has a test that cites it, in each implementation
 * that builds the component (scripts/lib/rule-coverage.mjs says how a test cites a rule).
 *
 * untested-rules.json lists the gaps that existed when this check was added. It may only shrink:
 * a new gap fails until a test cites the rule, and a listed gap that a test now cites fails until
 * it is removed from the list. Adding to the list hides a gap; a reviewer should question it.
 *
 * It checks the React package's tests too, because those run only in the browser and this reads
 * files. One check in one place.
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { loadSpec } from "@taproot-ds/spec";
import { resolveConfig } from "@taproot-ds/spec/config";
import { RULE_TEST_FILES, untestedRules } from "../../../../scripts/lib/rule-coverage.mjs";
import knownGaps from "./untested-rules.json" with { type: "json" };

const root = fileURLToPath(new URL("../../../..", import.meta.url));
const config = resolveConfig({ cwd: root });
const spec = await loadSpec();

/** `web/checkbox` → its testable MUST rule ids that no test cites. */
const gaps = {};
for (const [name, impl] of Object.entries(config.implementations)) {
  const testFile = RULE_TEST_FILES[impl.technology];
  if (!testFile) continue;
  const pkg = path.dirname(impl.folder);
  for (const file of readdirSync(impl.folder)) {
    if (!file.endsWith(".md") || file === "README.md") continue;
    const slug = file.slice(0, -".md".length);
    const source = testFile(slug)
      .map((testPath) => path.join(pkg, testPath))
      .filter((testPath) => existsSync(testPath))
      .map((testPath) => readFileSync(testPath, "utf8"))
      .join("\n");
    const ids = untestedRules(spec.rules({ id: `component.${slug}` }), source).map(
      (rule) => rule.id,
    );
    if (ids.length) gaps[`${name}/${slug}`] = ids.sort();
  }
}

const flatten = (map) =>
  Object.entries(map).flatMap(([component, ids]) => ids.map((id) => `${component} [${id}]`));

describe("MUST rule coverage", () => {
  it("has a test citing every MUST rule that is not a known gap", () => {
    const listed = new Set(flatten(knownGaps));
    // Each entry needs a test whose name starts with the tag, or cites the rule's address.
    expect(flatten(gaps).filter((gap) => !listed.has(gap))).toEqual([]);
  });

  it("lists no gap that a test now covers", () => {
    const current = new Set(flatten(gaps));
    // Remove each entry from test/node/untested-rules.json.
    expect(flatten(knownGaps).filter((gap) => !current.has(gap))).toEqual([]);
  });
});
