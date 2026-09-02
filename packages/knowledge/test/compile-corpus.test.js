import assert from "node:assert/strict";
import { test } from "node:test";
import { PROBLEM } from "../src/compile/tables.js";
import { buildCorpus } from "../src/compile/corpus.js";
import { codes, createMemoryReader, portableContract, recordMarkdown, tinySvg } from "./helpers/workspace.js";

const publicRoot = { root: "content", visibility: "public" };
const internalRoot = { root: "internal", visibility: "internal" };

function authored(path, fields, body) {
  return recordMarkdown({ ...fields, sources: [{ kind: "authored", path }] }, body);
}

test("RECORD_INVALID fires once per parseRecord issue", async () => {
  const path = "content/invalid.md";
  const reader = createMemoryReader({
    [path]: authored(path, { id: "component.invalid" }).replace("\ntitle: Fixture\n", "\n"),
  });

  const corpus = await buildCorpus(reader, [publicRoot]);
  const problems = codes(corpus, PROBLEM.RECORD_INVALID);

  assert.ok(problems.length >= 1);
  assert.equal(problems[0].path, "/title");
  assert.equal(corpus.records.size, 0);
});

test("RECORD_SCHEMA_UNSUPPORTED fires when schemaVersion is not 1", async () => {
  const path = "content/unsupported.md";
  const reader = createMemoryReader({
    [path]: authored(path, { id: "component.unsupported", schemaVersion: 2 }),
  });

  const corpus = await buildCorpus(reader, [publicRoot]);
  const problems = codes(corpus, PROBLEM.RECORD_SCHEMA_UNSUPPORTED);

  assert.equal(problems.length, 1);
  assert.equal(problems[0].path, "/schemaVersion");
  assert.equal(codes(corpus, PROBLEM.RECORD_INVALID).length, 0);
});

test("RECORD_PATH_MISMATCH fires when the authored source path is not the file", async () => {
  const path = "content/mismatch.md";
  const reader = createMemoryReader({
    [path]: authored("content/other.md", { id: "component.mismatch" }),
  });

  const corpus = await buildCorpus(reader, [publicRoot]);
  const problems = codes(corpus, PROBLEM.RECORD_PATH_MISMATCH);

  assert.equal(problems.length, 1);
  assert.equal(problems[0].recordId, "component.mismatch");
});

test("CORPUS_DUPLICATE_ID keeps the first record and names both paths", async () => {
  const first = "content/a.md";
  const second = "content/b.md";
  const reader = createMemoryReader({
    [first]: authored(first, { id: "component.dup", title: "First" }),
    [second]: authored(second, { id: "component.dup", title: "Second" }),
  });

  const corpus = await buildCorpus(reader, [publicRoot]);
  const problems = codes(corpus, PROBLEM.CORPUS_DUPLICATE_ID);

  assert.equal(problems.length, 1);
  assert.match(problems[0].message, /content\/a\.md/);
  assert.match(problems[0].message, /content\/b\.md/);
  assert.equal(corpus.records.get("component.dup").title, "First");
});

test("CORPUS_UNRESOLVED_RELATION fires for a missing target", async () => {
  const path = "content/orphan.md";
  const reader = createMemoryReader({
    [path]: authored(path, {
      id: "component.orphan",
      relations: { uses: ["component.missing"] },
    }),
  });

  const corpus = await buildCorpus(reader, [publicRoot]);
  const problems = codes(corpus, PROBLEM.CORPUS_UNRESOLVED_RELATION);

  assert.equal(problems.length, 1);
  assert.equal(problems[0].recordId, "component.orphan");
  assert.equal(corpus.edges.length, 0);
});

test("CORPUS_UNRESOLVED_ANNOTATION fires for a missing relatesTo target", async () => {
  const path = "content/example.md";
  const reader = createMemoryReader({
    [path]: authored(path, {
      id: "example.orphan-annotation",
      type: "example",
      assets: [
        {
          id: "example.orphan-annotation.frame",
          path: "content/frame.svg",
          mediaType: "image/svg+xml",
          width: 10,
          height: 10,
          alt: "A tiny frame.",
        },
      ],
      annotations: [
        {
          id: "missing-target",
          label: "Missing",
          description: "Points at a record that does not exist.",
          relatesTo: ["component.missing"],
        },
      ],
    }),
    "content/frame.svg": tinySvg,
  });

  const corpus = await buildCorpus(reader, [publicRoot]);
  const problems = codes(corpus, PROBLEM.CORPUS_UNRESOLVED_ANNOTATION);

  assert.equal(problems.length, 1);
  assert.equal(problems[0].recordId, "example.orphan-annotation");
});

test("CORPUS_SELF_RELATION fires when a record targets itself", async () => {
  const path = "content/self.md";
  const reader = createMemoryReader({
    [path]: authored(path, {
      id: "component.self",
      relations: { related: ["component.self"] },
    }),
  });

  const corpus = await buildCorpus(reader, [publicRoot]);
  const problems = codes(corpus, PROBLEM.CORPUS_SELF_RELATION);

  assert.equal(problems.length, 1);
  assert.equal(problems[0].recordId, "component.self");
});

test("CORPUS_INCOMPLETE_EXAMPLE fires when an example has no assets or annotations", async () => {
  const path = "content/empty-example.md";
  const reader = createMemoryReader({
    [path]: authored(path, { id: "example.empty", type: "example" }),
  });

  const corpus = await buildCorpus(reader, [publicRoot]);
  const problems = codes(corpus, PROBLEM.CORPUS_INCOMPLETE_EXAMPLE);

  assert.equal(problems.length, 1);
  assert.equal(problems[0].recordId, "example.empty");
});

test("CORPUS_INCOMPLETE_CHECKS fires when a review guideline has no checks", async () => {
  const path = "content/review.md";
  const reader = createMemoryReader({
    [path]: authored(path, {
      id: "guideline.empty-review",
      type: "guideline",
      jobs: ["review"],
    }),
  });

  const corpus = await buildCorpus(reader, [publicRoot]);
  const problems = codes(corpus, PROBLEM.CORPUS_INCOMPLETE_CHECKS);

  assert.equal(problems.length, 1);
  assert.equal(problems[0].recordId, "guideline.empty-review");
});

test("SOURCE_MISSING fires when a declared source file is absent", async () => {
  const path = "content/missing-source.md";
  const reader = createMemoryReader({
    [path]: recordMarkdown({
      id: "component.missing-source",
      sources: [
        { kind: "authored", path },
        { kind: "token-source", path: "packages/tokens/absent.json" },
      ],
      tokenRef: {
        tier: "component",
        namespace: "component.missing-source",
        description: "Missing token file.",
      },
    }),
  });

  const corpus = await buildCorpus(reader, [publicRoot]);
  const problems = codes(corpus, PROBLEM.SOURCE_MISSING);

  assert.equal(problems.length, 1);
  assert.equal(problems[0].path, "packages/tokens/absent.json");
});

test("SOURCE_UNREADABLE fires when a token source is not JSON", async () => {
  const path = "content/bad-tokens.md";
  const reader = createMemoryReader({
    [path]: recordMarkdown({
      id: "component.bad-tokens",
      sources: [
        { kind: "authored", path },
        { kind: "token-source", path: "packages/tokens/bad.json" },
      ],
      tokenRef: {
        tier: "component",
        namespace: "component.bad-tokens",
        description: "Unreadable token file.",
      },
    }),
    "packages/tokens/bad.json": "{ not json",
  });

  const corpus = await buildCorpus(reader, [publicRoot]);
  const problems = codes(corpus, PROBLEM.SOURCE_UNREADABLE);

  assert.equal(problems.length, 1);
  assert.equal(problems[0].path, "packages/tokens/bad.json");
});

test("SOURCE_CONFLICT fires when the spec namespace is missing from the token file", async () => {
  const specPath = "content/specs/namespace.md";
  const path = "content/namespace.md";
  const reader = createMemoryReader({
    [specPath]: recordMarkdown({
      id: "spec.namespace",
      type: "spec",
      sources: [{ kind: "authored", path: specPath }],
      contract: portableContract({
        description: "Has a namespace the token file does not define.",
        parameters: {
          variant: { kind: "enum", values: { primary: "Primary." } },
          size: { kind: "enum", values: { sm: "Small.", md: "Medium." } },
        },
      }),
    }),
    [path]: recordMarkdown({
      id: "component.namespace",
      sources: [
        { kind: "authored", path },
        { kind: "token-source", path: "packages/tokens/other.json" },
      ],
      relations: { uses: ["spec.namespace"] },
      tokenRef: {
        tier: "component",
        namespace: "component.namespace",
        description: "Missing from the token file.",
      },
    }),
    "packages/tokens/other.json": JSON.stringify({
      component: { other: { radius: { $value: "4px", $type: "dimension" } } },
    }),
  });

  const corpus = await buildCorpus(reader, [publicRoot]);
  const problems = codes(corpus, PROBLEM.SOURCE_CONFLICT);

  assert.ok(problems.length >= 1);
  assert.ok(problems.some((problem) => /component\.namespace/.test(problem.message)));
});

test("SOURCE_CONFLICT fires when a component uses two specs", async () => {
  const reader = createMemoryReader({
    "content/specs/a.md": recordMarkdown({
      id: "spec.two-a",
      type: "spec",
      sources: [{ kind: "authored", path: "content/specs/a.md" }],
      contract: portableContract({ description: "First spec." }),
    }),
    "content/specs/b.md": recordMarkdown({
      id: "spec.two-b",
      type: "spec",
      sources: [{ kind: "authored", path: "content/specs/b.md" }],
      contract: portableContract({ description: "Second spec." }),
    }),
    "content/two.md": recordMarkdown({
      id: "component.two-specs",
      sources: [{ kind: "authored", path: "content/two.md" }],
      relations: { uses: ["spec.two-a", "spec.two-b"] },
    }),
  });

  const corpus = await buildCorpus(reader, [publicRoot]);
  assert.ok(
    codes(corpus, PROBLEM.SOURCE_CONFLICT).some((item) => /more than one spec/.test(item.message)),
  );
});

test("SOURCE_CONFLICT fires when a binding parameter is not a bijection", async () => {
  const reader = createMemoryReader({
    "content/specs/bound.md": recordMarkdown({
      id: "spec.bound",
      type: "spec",
      sources: [{ kind: "authored", path: "content/specs/bound.md" }],
      contract: portableContract({
        description: "Needs a matching host parameter.",
        anatomy: [{ name: "control", role: "interactive-surface", description: "Control." }],
        parameters: { disabled: { kind: "boolean", default: false } },
        events: { activate: { description: "Activate." } },
      }),
    }),
    "content/bound.md": recordMarkdown({
      id: "component.bound",
      sources: [{ kind: "authored", path: "content/bound.md" }],
      relations: { uses: ["spec.bound"] },
    }),
    "content/bindings/bound.md": recordMarkdown({
      id: "binding.bound.web-component",
      type: "binding",
      sources: [{ kind: "authored", path: "content/bindings/bound.md" }],
      relations: { implements: ["component.bound"] },
      host: {
        specVersion: 1,
        platform: "web-component",
        package: "@stevegreco/design-system-components",
        export: "DsBound",
        defaultTagName: "ds-bound",
        registration: { export: "defineBound", supportsAliases: false },
        anatomy: { control: { element: "button" } },
        parameters: { disabled: { attribute: "disabled" }, extra: { attribute: "extra" } },
        events: { activate: { event: "click" } },
      },
    }),
  });

  const corpus = await buildCorpus(reader, [publicRoot]);
  assert.ok(
    codes(corpus, PROBLEM.SOURCE_CONFLICT).some((item) => /unknown extra/.test(item.message)),
  );
});

test("ASSET_MISSING fires when a declared asset file is absent", async () => {
  const path = "content/missing-asset.md";
  const reader = createMemoryReader({
    [path]: authored(path, {
      id: "example.missing-asset",
      type: "example",
      assets: [
        {
          id: "example.missing-asset.frame",
          path: "content/absent.svg",
          mediaType: "image/svg+xml",
          width: 10,
          height: 10,
          alt: "Missing.",
        },
      ],
      annotations: [{ id: "note", label: "Note", description: "Needs the image." }],
    }),
  });

  const corpus = await buildCorpus(reader, [publicRoot]);
  const problems = codes(corpus, PROBLEM.ASSET_MISSING);

  assert.equal(problems.length, 1);
  assert.equal(problems[0].path, "content/absent.svg");
});

test("ASSET_DIMENSION_MISMATCH warns when SVG dimensions disagree with the record", async () => {
  const path = "content/dims.md";
  const reader = createMemoryReader({
    [path]: authored(path, {
      id: "example.dims",
      type: "example",
      assets: [
        {
          id: "example.dims.frame",
          path: "content/tiny.svg",
          mediaType: "image/svg+xml",
          width: 960,
          height: 640,
          alt: "Declared large, file is tiny.",
        },
      ],
      annotations: [{ id: "note", label: "Note", description: "Dimension mismatch." }],
    }),
    "content/tiny.svg": tinySvg,
  });

  const corpus = await buildCorpus(reader, [publicRoot]);
  const problems = codes(corpus, PROBLEM.ASSET_DIMENSION_MISMATCH);

  assert.equal(problems.length, 1);
  assert.equal(problems[0].severity, "warning");
});

test("BODY_UNRESOLVED_LINK fires for a relative Markdown link with no bundle target", async () => {
  const path = "content/links.md";
  const reader = createMemoryReader({
    [path]: authored(
      path,
      { id: "component.links" },
      "See the [missing pattern](../patterns/nope.md).",
    ),
  });

  const corpus = await buildCorpus(reader, [publicRoot]);
  const problems = codes(corpus, PROBLEM.BODY_UNRESOLVED_LINK);

  assert.equal(problems.length, 1);
  assert.equal(problems[0].recordId, "component.links");
});

test("PATH_OUTSIDE_ROOT fires when a public asset leaves allowed roots", async () => {
  const path = "content/escape.md";
  const reader = createMemoryReader({
    [path]: authored(path, {
      id: "example.escape",
      type: "example",
      assets: [
        {
          id: "example.escape.frame",
          path: "internal/secret.svg",
          mediaType: "image/svg+xml",
          width: 10,
          height: 10,
          alt: "Secret.",
        },
      ],
      annotations: [{ id: "note", label: "Note", description: "Must not publish." }],
    }),
    "internal/secret.svg": tinySvg,
  });

  const corpus = await buildCorpus(reader, [publicRoot, internalRoot]);
  const problems = codes(corpus, PROBLEM.PATH_OUTSIDE_ROOT);

  assert.equal(problems.length, 1);
  assert.equal(problems[0].recordId, "example.escape");
  assert.equal(problems[0].path, "internal/secret.svg");
  assert.equal(corpus.assetBytes.size, 0);
});

test("PATH_OUTSIDE_ROOT fires when a public source leaves allowed roots", async () => {
  const path = "content/escape-source.md";
  const reader = createMemoryReader({
    [path]: recordMarkdown({
      id: "component.escape-source",
      sources: [
        { kind: "authored", path },
        { kind: "token-source", path: "packages/other/secret.json" },
      ],
    }),
    "packages/other/secret.json": JSON.stringify({ component: {} }),
  });

  const corpus = await buildCorpus(reader, [publicRoot]);
  const problems = codes(corpus, PROBLEM.PATH_OUTSIDE_ROOT);

  assert.equal(problems.length, 1);
  assert.equal(problems[0].recordId, "component.escape-source");
  assert.equal(problems[0].path, "packages/other/secret.json");
});

test("internal records may read their private root", async () => {
  const path = "internal/owned.md";
  const reader = createMemoryReader({
    [path]: recordMarkdown({
      id: "example.owned",
      type: "example",
      visibility: "internal",
      sources: [{ kind: "authored", path }],
      assets: [
        {
          id: "example.owned.frame",
          path: "internal/owned.svg",
          mediaType: "image/svg+xml",
          width: 10,
          height: 10,
          alt: "Owned.",
        },
      ],
      annotations: [{ id: "note", label: "Note", description: "Private asset." }],
    }),
    "internal/owned.svg": tinySvg,
  });

  const corpus = await buildCorpus(reader, [internalRoot]);
  assert.equal(codes(corpus, PROBLEM.PATH_OUTSIDE_ROOT).length, 0);
  assert.equal(corpus.records.get("example.owned").assets[0].path, "internal/owned.svg");
});

test("internal records cannot read the public authored root", async () => {
  const path = "internal/borrow.md";
  const reader = createMemoryReader({
    [path]: recordMarkdown({
      id: "example.borrow",
      type: "example",
      visibility: "internal",
      sources: [{ kind: "authored", path }],
      assets: [
        {
          id: "example.borrow.frame",
          path: "content/public.svg",
          mediaType: "image/svg+xml",
          width: 10,
          height: 10,
          alt: "Borrowed.",
        },
      ],
      annotations: [{ id: "note", label: "Note", description: "Wrong root." }],
    }),
    "content/public.svg": tinySvg,
  });

  const corpus = await buildCorpus(reader, [publicRoot, internalRoot]);
  const problems = codes(corpus, PROBLEM.PATH_OUTSIDE_ROOT);
  assert.equal(problems.length, 1);
  assert.equal(problems[0].recordId, "example.borrow");
  assert.equal(problems[0].path, "content/public.svg");
});

test("VISIBILITY_INTERNAL_PUBLIC fires when an internal root declares a public record", async () => {
  const path = "internal/leaked.md";
  const reader = createMemoryReader({
    [path]: authored(path, { id: "component.leaked", visibility: "public" }),
  });

  const corpus = await buildCorpus(reader, [internalRoot]);
  const problems = codes(corpus, PROBLEM.VISIBILITY_INTERNAL_PUBLIC);

  assert.equal(problems.length, 1);
  assert.equal(problems[0].recordId, "component.leaked");
});
