import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { test } from "vitest";
import { buildCorpus } from "../src/compile/corpus.js";
import { createFsReader, repoRoot } from "./helpers/workspace.js";

test("baseline Button contract projects onto the authored component and web-component binding", async () => {
  const baseline = JSON.parse(
    await readFile(
      join(repoRoot, "packages/knowledge/test/fixtures/baseline-button-contract.json"),
      "utf8",
    ),
  );
  const authoredContract = JSON.parse(
    await readFile(
      join(repoRoot, "packages/knowledge/test/fixtures/button-portable-contract.json"),
      "utf8",
    ),
  );
  const corpus = await buildCorpus(
    createFsReader(repoRoot),
    [{ root: join(repoRoot, "packages/knowledge/content"), visibility: "public" }],
    { workspaceRoot: repoRoot },
  );
  assert.equal(
    corpus.problems.filter((item) => item.severity === "error").length,
    0,
    JSON.stringify(corpus.problems, null, 2),
  );

  const button = corpus.records.get("component.button");
  const binding = corpus.records.get("binding.button.web-component");
  const portable = button.contract;
  const host = binding.host;
  const old = baseline.contract;

  assert.equal(corpus.records.has("spec.button"), false);
  assert.deepEqual(portable, authoredContract);
  assert.equal(
    button.sources.some(
      (source) => source.path === "packages/knowledge/content/components/button.md",
    ),
    true,
  );
  assert.equal(Object.hasOwn(portable, "tagName"), false);
  assert.equal(Object.hasOwn(portable, "api"), false);
  assert.equal(host.defaultTagName, old.tagName);
  assert.equal(portable.description, old.description);
  assert.notEqual(button.summary, portable.description);

  assert.deepEqual(
    portable.usage.do.map((item) => item.situation),
    old.usage.do.map((item) => item.situation),
  );
  assert.deepEqual(
    portable.usage.avoid.map((item) => item.situation),
    old.usage.avoid.map((item) => item.situation),
  );
  assert.deepEqual(portable.states, old.states);
  assert.deepEqual(
    portable.accessibility.keyboard.map((item) => item.key),
    old.accessibility.keyboard.map((item) => item.key),
  );

  assert.deepEqual(
    portable.anatomy.map((part) => part.name),
    old.anatomy.map((part) => part.name),
  );
  assert.equal(host.anatomy.control.element, "button");
  assert.equal(host.anatomy.control.part, "button");
  assert.equal(host.anatomy.content.slot, "default");

  assert.deepEqual(
    Object.keys(portable.parameters.variant.values),
    Object.keys(old.api.attributes.variant.values),
  );
  assert.deepEqual(
    Object.keys(portable.parameters.size.values),
    Object.keys(old.api.attributes.size.values),
  );
  assert.equal(portable.parameters.disabled.default, old.api.attributes.disabled.default);
  assert.deepEqual(Object.keys(portable.parameters.action.values).sort(), [
    "activate",
    "reset",
    "submit",
  ]);
  assert.equal(portable.parameters.action.default, "activate");
  assert.equal(host.parameters.action.attribute, "type");
  assert.equal(host.parameters.action.values.activate, "button");
  assert.equal(host.parameters.fullWidth.attribute, "full-width");
  assert.equal(host.parameters.accessibleName.attribute, "aria-label");

  assert.equal(portable.events.activate.description.includes("action"), true);
  assert.equal(host.events.activate.event, "click");
  assert.equal(host.properties.form.type, old.api.properties.form.type);
  assert.equal(host.formAssociation.mechanism, "FACE");
  assert.equal(host.focus.forwardsTo, "control");

  assert.equal(
    portable.rationale.some((item) => /component-token namespace/.test(item.decision)),
    true,
  );
  assert.equal(
    host.rationale.some((item) => /form-associated/.test(item.decision)),
    true,
  );

  assert.equal(button.tokenRef.namespace, baseline.tokenMeta.namespace);
  assert.equal(
    button.sources.some((source) => source.kind === "token-source"),
    true,
  );
  assert.equal(
    button.sources.some((source) => source.path === "packages/components/specs/button.spec.yaml"),
    false,
  );
});
