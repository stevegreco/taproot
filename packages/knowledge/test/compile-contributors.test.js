import assert from "node:assert/strict";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { PROBLEM, buildCorpus, shortRevision } from "../src/compile/corpus.js";
import { listTokenCatalogFiles } from "../src/compile/inputs.js";
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

  const ghostRestFill = button.contract.mappings.find(
    (row) =>
      row.configuration?.variant === "ghost" &&
      row.channel === "background" &&
      row.state === "default",
  );
  assert.equal(ghostRestFill.token.literal, "transparent");
  assert.equal(
    button.tokens.entries.some(
      (entry) => entry.name === "component.button.ghost.background.default",
    ),
    false,
  );

  const sizeKeys = new Set(
    button.tokens.entries
      .filter((entry) => entry.name.startsWith("component.button.size."))
      .map((entry) => entry.name.split(".")[3]),
  );
  assert.deepEqual([...sizeKeys].sort(), ["medium", "small"]);

  assert.equal(
    button.sources.some((source) => source.kind === "adr"),
    true,
  );
  const adr = button.sources.find((source) => source.kind === "adr");
  assert.equal(adr.path, "packages/tokens/docs/adr/0003-token-tier-consumption.md");
  assert.ok(adr.revision);
  assert.equal(Object.hasOwn(button, "decisions"), false);

  assert.equal(
    button.sources.some((source) => source.kind === "component-spec"),
    false,
  );
  const authoredSources = button.sources.filter((source) => source.kind === "authored");
  assert.equal(authoredSources.length, 1);
  assert.equal(authoredSources[0].path, "packages/knowledge/content/components/button.md");
  assert.equal(
    authoredSources[0].revision,
    shortRevision(readFileSync(join(repoRoot, authoredSources[0].path), "utf8")),
  );
  assert.ok(button.contract);
  assert.equal(Object.hasOwn(button, "contractSource"), false);
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
    badge.sources.some(
      (source) => source.path === "packages/knowledge/content/components/badge.md",
    ),
    true,
  );
  assert.equal(binding.host.defaultTagName, "ds-badge");
  assert.equal(Object.hasOwn(badge, "tokens"), false);
  assert.equal(Object.hasOwn(badge, "tokenRef"), false);
  assert.ok(
    badge.contract.mappings.some((row) => row.token.name === "semantic.color.background.muted"),
  );
  assert.equal(Object.hasOwn(badge, "decisions"), false);
  assert.equal(
    badge.sources.some((source) => source.kind === "adr"),
    true,
  );
  assert.equal(
    corpus.problems.some((item) => item.code === PROBLEM.SOURCE_CONFLICT),
    false,
  );
});

test("an extra contract size compiles without editing compiler constants", async () => {
  const componentPath = "content/size.md";
  const reader = createMemoryReader({
    [componentPath]: recordMarkdown({
      id: "component.size-extra",
      sources: [
        { kind: "authored", path: componentPath },
        { kind: "token-source", path: "packages/tokens/size.json" },
      ],
      contract: portableContract({
        description: "Extra contract size.",
        anatomy: [
          { name: "control", role: "interactive-surface", description: "Interactive control." },
        ],
        parameters: {
          variant: { kind: "enum", values: { primary: "Primary." } },
          size: { kind: "enum", values: { sm: "Small.", md: "Medium.", lg: "Large." } },
        },
        mappings: [
          {
            part: "control",
            channel: "padding-inline",
            configuration: { size: "lg" },
            token: { name: "component.size.size.large.paddingInline" },
          },
        ],
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
          size: {
            large: { paddingInline: { $value: "24px", $type: "dimension" } },
          },
        },
      },
    }),
  });

  const corpus = await buildCorpus(reader, [{ root: "content", visibility: "public" }]);
  assert.equal(
    corpus.problems.filter((item) => item.severity === "error").length,
    0,
    JSON.stringify(corpus.problems, null, 2),
  );
  const record = corpus.records.get("component.size-extra");
  assert.equal(record.contract.parameters.size.values.lg, "Large.");
  assert.equal(record.contract.mappings[0].token.name, "component.size.size.large.paddingInline");
});

test("a mapped token missing from the token package fails the build", async () => {
  const componentPath = "content/missing-token.md";
  const reader = createMemoryReader({
    [componentPath]: recordMarkdown({
      id: "component.missing-token",
      sources: [{ kind: "authored", path: componentPath }],
      contract: portableContract({
        description: "Missing mapped token.",
        anatomy: [{ name: "surface", role: "indicator", description: "Surface." }],
        mappings: [
          {
            part: "surface",
            channel: "background",
            token: { name: "semantic.color.does.not.exist" },
          },
        ],
      }),
    }),
  });

  const corpus = await buildCorpus(reader, [{ root: "content", visibility: "public" }], {
    workspaceRoot: repoRoot,
  });
  assert.ok(
    codes(corpus, PROBLEM.SOURCE_CONFLICT).some((item) =>
      /semantic\.color\.does\.not\.exist/.test(item.message),
    ),
  );
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

test("token catalog lists every tokens.json file under packages/tokens/src/tokens", async () => {
  const files = await listTokenCatalogFiles(repoRoot);
  assert.ok(files.includes("packages/tokens/src/tokens/primitives.tokens.json"));
  assert.ok(files.includes("packages/tokens/src/tokens/components/button.tokens.json"));
  assert.ok(files.includes("packages/tokens/src/tokens/semantic/light.tokens.json"));
  assert.equal(
    files.every(
      (path) => path.startsWith("packages/tokens/src/tokens/") && path.endsWith(".tokens.json"),
    ),
    true,
  );
});

test("a new tokens.json file is in the catalog without a compiler table", async () => {
  const workspace = await mkdtemp(join(tmpdir(), "knowledge-catalog-"));
  const componentPath = "packages/knowledge/content/extra.md";
  await mkdir(join(workspace, "packages/knowledge/content"), { recursive: true });
  await mkdir(join(workspace, "packages/tokens/src/tokens/components"), { recursive: true });
  await writeFile(
    join(workspace, componentPath),
    recordMarkdown({
      id: "component.extra",
      sources: [{ kind: "authored", path: componentPath }],
      contract: portableContract({
        anatomy: [{ name: "surface", role: "indicator", description: "Surface." }],
        mappings: [
          {
            part: "surface",
            channel: "background",
            token: { name: "component.extra.background" },
          },
        ],
      }),
    }),
  );
  await writeFile(
    join(workspace, "packages/tokens/src/tokens/components/extra.tokens.json"),
    JSON.stringify({
      component: { extra: { background: { $value: "#000", $type: "color" } } },
    }),
  );

  const corpus = await buildCorpus(
    createFsReader(workspace),
    [{ root: join(workspace, "packages/knowledge/content"), visibility: "public" }],
    { workspaceRoot: workspace },
  );
  assert.equal(
    corpus.problems.filter((item) => item.severity === "error").length,
    0,
    JSON.stringify(corpus.problems, null, 2),
  );
});

test("a malformed token catalog file fails with SOURCE_UNREADABLE", async () => {
  const workspace = await mkdtemp(join(tmpdir(), "knowledge-catalog-bad-"));
  const componentPath = "packages/knowledge/content/extra.md";
  await mkdir(join(workspace, "packages/knowledge/content"), { recursive: true });
  await mkdir(join(workspace, "packages/tokens/src/tokens"), { recursive: true });
  await writeFile(
    join(workspace, componentPath),
    recordMarkdown({
      id: "component.extra",
      sources: [{ kind: "authored", path: componentPath }],
    }),
  );
  await writeFile(join(workspace, "packages/tokens/src/tokens/broken.tokens.json"), "{");

  const corpus = await buildCorpus(
    createFsReader(workspace),
    [{ root: join(workspace, "packages/knowledge/content"), visibility: "public" }],
    { workspaceRoot: workspace },
  );
  assert.ok(
    codes(corpus, PROBLEM.SOURCE_UNREADABLE).some((item) =>
      /packages\/tokens\/src\/tokens\/broken\.tokens\.json/.test(item.path ?? ""),
    ),
  );
});
