import assert from "node:assert/strict";
import { join } from "node:path";
import { test } from "node:test";
import { PROBLEM, buildCorpus } from "../src/compile/corpus.js";
import { codes, createFsReader, createMemoryReader, recordMarkdown, repoRoot } from "./helpers/workspace.js";

const publicContent = {
  root: join(repoRoot, "packages/knowledge/content"),
  visibility: "public",
};

test("Button composes spec, tokens, and ADR 0003 into disjoint namespaces", async () => {
  const corpus = await buildCorpus(createFsReader(repoRoot), [publicContent]);
  const button = corpus.records.get("component.button");

  assert.ok(button);
  assert.equal(
    corpus.problems.filter((item) => item.severity === "error").length,
    0,
    JSON.stringify(corpus.problems, null, 2),
  );

  assert.ok(button.contract.api.attributes.variant.values.primary);
  assert.equal(button.contract.description, "Triggers an action or submits or resets a form.");
  assert.notEqual(button.summary, button.contract.description);
  assert.equal(button.title, "Button");
  assert.equal(button.status, "draft");
  assert.equal(
    corpus.problems.some((item) => item.code === PROBLEM.SOURCE_CONFLICT),
    false,
  );

  const ghost = button.tokens.entries.filter((entry) => entry.group === "ghost");
  assert.ok(ghost.length > 0);
  assert.equal(
    ghost.some((entry) => entry.name.endsWith(".background.default")),
    false,
  );

  const sizeKeys = new Set(
    button.tokens.entries
      .filter((entry) => entry.name.startsWith("component.button.size."))
      .map((entry) => entry.name.split(".")[3]),
  );
  assert.deepEqual([...sizeKeys].sort(), ["medium", "small"]);

  assert.equal(button.decisions.length, 1);
  assert.equal(button.decisions[0].status, "Accepted");
  assert.notEqual(button.status, button.decisions[0].status);
  assert.match(button.decisions[0].title, /ADR 0003/);
  assert.match(button.decisions[0].title, /Token tier consumption/);

  assert.equal(
    button.sources.some((source) => source.kind === "component-spec"),
    true,
  );
  assert.equal(Object.hasOwn(button.sources[0], "contributes"), false);
  assert.equal(Object.hasOwn(button, "backlinks"), false);
});

test("SIZE_BRIDGE rejects an unknown spec size", async () => {
  const path = "content/size.md";
  const reader = createMemoryReader({
    [path]: recordMarkdown({
      id: "component.size-unknown",
      sources: [
        { kind: "authored", path },
        { kind: "component-spec", path: "specs/size.yaml" },
        { kind: "token-source", path: "tokens/size.json" },
      ],
    }),
    "specs/size.yaml": `specVersion: 1
name: Size
tagName: ds-size
description: Unknown spec size.
usage: { do: [], avoid: [] }
anatomy: []
api:
  attributes:
    variant:
      type: enum
      values: { primary: Primary. }
    size:
      type: enum
      values: { lg: Large. }
states: []
behavior: []
accessibility: {}
tokens:
  tier: component
  namespace: component.size
  description: Size tokens.
decisions: []
`,
    "tokens/size.json": JSON.stringify({
      component: {
        size: {
          primary: {
            background: { default: { $value: "#000", $type: "color" } },
          },
        },
      },
    }),
  });

  const corpus = await buildCorpus(reader, [{ root: "content", visibility: "public" }]);
  assert.ok(codes(corpus, PROBLEM.SOURCE_CONFLICT).some((item) => /lg/.test(item.message)));
});

test("SIZE_BRIDGE rejects an unknown token size key", async () => {
  const path = "content/token-size.md";
  const reader = createMemoryReader({
    [path]: recordMarkdown({
      id: "component.token-size",
      sources: [
        { kind: "authored", path },
        { kind: "component-spec", path: "specs/token-size.yaml" },
        { kind: "token-source", path: "tokens/token-size.json" },
      ],
    }),
    "specs/token-size.yaml": `specVersion: 1
name: Token size
tagName: ds-token-size
description: Unknown token size key.
usage: { do: [], avoid: [] }
anatomy: []
api:
  attributes:
    variant:
      type: enum
      values: { primary: Primary. }
    size:
      type: enum
      values: { sm: Small., md: Medium. }
states: []
behavior: []
accessibility: {}
tokens:
  tier: component
  namespace: component.token-size
  description: Size tokens.
decisions: []
`,
    "tokens/token-size.json": JSON.stringify({
      component: {
        "token-size": {
          primary: {
            background: { default: { $value: "#000", $type: "color" } },
          },
          size: {
            tiny: { padding: { $value: "1px", $type: "dimension" } },
          },
        },
      },
    }),
  });

  const corpus = await buildCorpus(reader, [{ root: "content", visibility: "public" }]);
  assert.ok(codes(corpus, PROBLEM.SOURCE_CONFLICT).some((item) => /tiny/.test(item.message)));
});

test("link rewriting leaves fenced code alone and rewrites Markdown links", async () => {
  const path = "content/with-link.md";
  const target = "content/target.md";
  const reader = createMemoryReader({
    [path]: recordMarkdown(
      {
        id: "component.with-link",
        sources: [{ kind: "authored", path }],
      },
      [
        "See [target](target.md).",
        "",
        "```md",
        "[leave me](target.md)",
        "```",
        "",
        "`also (target.md)` is code.",
      ].join("\n"),
    ),
    [target]: recordMarkdown({
      id: "component.target",
      sources: [{ kind: "authored", path: target }],
    }),
  });

  const corpus = await buildCorpus(reader, [{ root: "content", visibility: "public" }]);
  const body = corpus.records.get("component.with-link").body;

  assert.match(body, /\[target\]\(markdown\/component\.target\.md\)/);
  assert.match(body, /```md\n\[leave me\]\(target\.md\)\n```/);
});
