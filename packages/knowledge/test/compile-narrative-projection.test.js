import assert from "node:assert/strict";
import { join } from "node:path";
import { test } from "vitest";
import yaml from "js-yaml";
import { parseRecord } from "../src/index.js";
import { projectBundle } from "../src/compile/bundle.js";
import { buildCorpus } from "../src/compile/corpus.js";
import { NARRATIVE_FRONTMATTER_KEYS } from "../src/compile/tables.js";
import { recordOnlyCompiledFields } from "./helpers/catalog.js";
import { createFsReader, repoRoot } from "./helpers/workspace.js";

const meta = {
  knowledgeVersion: "0.0.1",
  designSystemVersion: "0.0.5",
  buildTime: new Date(0),
  revision: "test",
};

test("emitted Markdown frontmatter is the exporter's identity keys only", async () => {
  const bundle = await publicBundle();
  for (const record of bundle.records) {
    const text = bundle.markdown.get(`markdown/${record.id}.md`);
    const { data } = splitCompiledMarkdown(text);
    assert.deepEqual(Object.keys(data).sort(), [...NARRATIVE_FRONTMATTER_KEYS], record.id);
    for (const field of recordOnlyCompiledFields()) {
      assert.equal(Object.hasOwn(data, field), false, `${record.id} emitted ${field}`);
    }
  }
});

test("parseRecord accepts emitted markdown and omits contract and web", async () => {
  const bundle = await publicBundle();

  const button = parseRecord(bundle.markdown.get("markdown/component.button.md"), {
    sourcePath: "markdown/component.button.md",
  });
  assert.equal(button.id, "component.button");
  assert.equal(Object.hasOwn(button, "contract"), false);
  assert.equal(Object.hasOwn(button, "host"), false);

  const guideline = parseRecord(
    bundle.markdown.get("markdown/guideline.button-implementation.md"),
    {
      sourcePath: "markdown/guideline.button-implementation.md",
    },
  );
  assert.equal(guideline.id, "guideline.button-implementation");

  assert.equal(Object.hasOwn(button, "web"), false);
});

test("parseRecord does not treat markdown/<id>.md as a special format", async () => {
  const bundle = await publicBundle();
  const markdown = bundle.markdown.get("markdown/component.button.md");
  assert.equal(typeof markdown, "string");

  const compiledPath = "markdown/component.button.md";
  const fromCompiledPath = parseRecord(markdown, { sourcePath: compiledPath });
  assert.equal(fromCompiledPath.id, "component.button");
  assert.equal(fromCompiledPath.visibility, "public");
  assert.equal(Object.hasOwn(fromCompiledPath, "contract"), false);
  assert.deepEqual(fromCompiledPath.sources, [{ kind: "authored", path: compiledPath }]);

  const authoredPath = "packages/knowledge/content/components/button/button.spec.yaml";
  const parsed = parseRecord(markdown, { sourcePath: authoredPath });
  assert.equal(parsed.id, "component.button");
  assert.equal(parsed.visibility, "public");
  assert.equal(Object.hasOwn(parsed, "contract"), false);
  assert.deepEqual(parsed.sources, [{ kind: "authored", path: authoredPath }]);
});

async function publicBundle() {
  const corpus = await buildCorpus(
    createFsReader(repoRoot),
    [{ root: join(repoRoot, "packages/knowledge/content"), visibility: "public" }],
    { workspaceRoot: repoRoot },
  );
  return projectBundle(corpus, "public", meta);
}

function splitCompiledMarkdown(markdown) {
  assert.match(markdown, /^---\n/);
  const end = markdown.indexOf("\n---\n", 4);
  assert.notEqual(end, -1);
  const yamlText = markdown.slice(4, end);
  return { yamlText, data: yaml.load(yamlText) };
}
