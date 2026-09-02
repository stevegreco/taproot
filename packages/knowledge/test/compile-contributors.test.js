import assert from "node:assert/strict";
import { join } from "node:path";
import { test } from "node:test";
import { PROBLEM, buildCorpus } from "../src/compile/corpus.js";
import {
  codes,
  createFsReader,
  createMemoryReader,
  portableContract,
  recordMarkdown,
  repoRoot,
} from "./helpers/workspace.js";

const publicContent = {
  root: join(repoRoot, "packages/knowledge/content"),
  visibility: "public",
};

test("Button composes authored contract, tokens, and ADR 0003 into disjoint namespaces", async () => {
  const corpus = await buildCorpus(createFsReader(repoRoot), [publicContent], {
    workspaceRoot: repoRoot,
  });
  const button = corpus.records.get("component.button");
  const binding = corpus.records.get("binding.button.web-component");

  assert.ok(button);
  assert.ok(binding);
  assert.equal(corpus.records.has("spec.button"), false);
  assert.equal(
    corpus.problems.filter((item) => item.severity === "error").length,
    0,
    JSON.stringify(corpus.problems, null, 2),
  );

  assert.ok(button.contract.parameters.variant.values.primary);
  assert.equal(button.contract.description, "Triggers an action or submits or resets a form.");
  assert.equal(button.contract.parameters.action.default, "activate");
  assert.equal(Object.hasOwn(button.contract, "tagName"), false);
  assert.notEqual(button.summary, button.contract.description);
  assert.equal(button.title, "Button");
  assert.equal(button.status, "draft");
  assert.equal(binding.host.defaultTagName, "ds-button");
  assert.equal(binding.host.parameters.action.values.activate, "button");
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
    false,
  );
  assert.equal(button.sources[0].kind, "authored");
  assert.equal(button.sources[0].path, "packages/knowledge/content/components/button.md");
  assert.equal(Object.hasOwn(button.sources[0], "contributes"), false);
  assert.equal(Object.hasOwn(button, "backlinks"), false);
});

test("a component with no tokenRef and no token-source composes contract only", async () => {
  const componentPath = "content/components/no-tokens.md";
  const reader = createMemoryReader({
    [componentPath]: recordMarkdown({
      id: "component.no-tokens",
      sources: [{ kind: "authored", path: componentPath }],
      contract: portableContract({
        description: "Component without a tokenRef.",
        parameters: { disabled: { kind: "boolean", default: false } },
      }),
    }),
  });

  const corpus = await buildCorpus(reader, [{ root: "content", visibility: "public" }]);
  const record = corpus.records.get("component.no-tokens");

  assert.ok(record);
  assert.equal(record.contract.description, "Component without a tokenRef.");
  assert.equal(Object.hasOwn(record.contract, "tagName"), false);
  assert.equal(Object.hasOwn(record, "tokens"), false);
  assert.equal(
    corpus.problems.some((item) => item.code === PROBLEM.SOURCE_CONFLICT),
    false,
  );
});

test("Badge composes authored contract and ADR 0003 without a token contract", async () => {
  const corpus = await buildCorpus(createFsReader(repoRoot), [publicContent], {
    workspaceRoot: repoRoot,
  });
  const badge = corpus.records.get("component.badge");
  const binding = corpus.records.get("binding.badge.web-component");

  assert.ok(badge);
  assert.equal(
    corpus.problems.filter((item) => item.severity === "error").length,
    0,
    JSON.stringify(corpus.problems, null, 2),
  );
  assert.equal(Object.hasOwn(badge.contract, "tagName"), false);
  assert.equal(badge.contract.parameters.variant.default, "default");
  assert.equal(
    badge.sources.some((source) => source.path === "packages/knowledge/content/components/badge.md"),
    true,
  );
  assert.equal(binding.host.defaultTagName, "ds-badge");
  assert.equal(Object.hasOwn(badge, "tokens"), false);
  assert.equal(badge.decisions.length, 1);
  assert.match(badge.decisions[0].title, /ADR 0003/);
  assert.match(badge.decisions[0].title, /Token tier consumption/);
  assert.equal(
    corpus.problems.some((item) => item.code === PROBLEM.SOURCE_CONFLICT),
    false,
  );
});

test("SIZE_BRIDGE rejects an unknown contract size", async () => {
  const componentPath = "content/size.md";
  const reader = createMemoryReader({
    [componentPath]: recordMarkdown({
      id: "component.size-unknown",
      sources: [
        { kind: "authored", path: componentPath },
        { kind: "token-source", path: "packages/tokens/size.json" },
      ],
      contract: portableContract({
        description: "Unknown contract size.",
        parameters: {
          variant: { kind: "enum", values: { primary: "Primary." } },
          size: { kind: "enum", values: { lg: "Large." } },
        },
      }),
      tokenRef: {
        tier: "component",
        namespace: "component.size",
        description: "Size tokens.",
      },
    }),
    "packages/tokens/size.json": JSON.stringify({
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
  const componentPath = "content/token-size.md";
  const reader = createMemoryReader({
    [componentPath]: recordMarkdown({
      id: "component.token-size",
      sources: [
        { kind: "authored", path: componentPath },
        { kind: "token-source", path: "packages/tokens/token-size.json" },
      ],
      contract: portableContract({
        description: "Unknown token size key.",
        parameters: {
          variant: { kind: "enum", values: { primary: "Primary." } },
          size: { kind: "enum", values: { sm: "Small.", md: "Medium." } },
        },
      }),
      tokenRef: {
        tier: "component",
        namespace: "component.token-size",
        description: "Size tokens.",
      },
    }),
    "packages/tokens/token-size.json": JSON.stringify({
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
  assert.match(body, /```md\n\[leave me\]\(target.md\)\n```/);
});
