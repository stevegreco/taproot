import assert from "node:assert/strict";
import { test } from "vitest";
import { PROBLEM } from "../src/compile/tables.js";
import { buildCorpus, shortRevision } from "../src/compile/corpus.js";
import {
  codes,
  createMemoryReader,
  portableContract,
  recordMarkdown,
  recordYaml,
  tinySvg,
} from "./helpers/workspace.js";

const publicRoot = { root: "content", visibility: "public" };
const internalRoot = { root: "internal", visibility: "internal" };

function authored(path, fields, body) {
  return recordMarkdown({ sources: [{ kind: "authored", path }], ...fields }, body);
}

test("RECORD_INVALID fires once per parseRecord issue", async () => {
  const path = "content/invalid.md";
  const reader = createMemoryReader({
    [path]: authored(path, { id: "component.invalid" }).replace("\ntitle: Fixture\n", "\n"),
  });

  const corpus = await buildCorpus(reader, [publicRoot]);
  const problems = codes(corpus, PROBLEM.RECORD_INVALID);

  assert.ok(problems.length >= 1);
  assert.equal(problems[0].path, "content/invalid.md:2 /title");
  assert.equal(corpus.records.size, 0);
});

test("references to a record that failed validation are not reported again", async () => {
  const invalid = "content/invalid.md";
  const pattern = "content/uses-invalid.md";
  const reader = createMemoryReader({
    [invalid]: authored(invalid, { id: "component.invalid" }).replace("\ntitle: Fixture\n", "\n"),
    [pattern]: authored(pattern, {
      id: "pattern.uses-invalid",
      type: "pattern",
      relations: { uses: ["component.invalid"], related: ["component.missing"] },
    }),
  });

  const corpus = await buildCorpus(reader, [publicRoot]);

  assert.deepEqual(
    corpus.problems.map((item) => item.code),
    [PROBLEM.RECORD_INVALID, PROBLEM.CORPUS_UNRESOLVED_RELATION],
  );
  assert.match(corpus.problems[1].message, /component\.missing/);
});

test("RECORD_SCHEMA_UNSUPPORTED fires when schemaVersion is not 1", async () => {
  const path = "content/unsupported.md";
  const reader = createMemoryReader({
    [path]: authored(path, { id: "component.unsupported", schemaVersion: 2 }),
  });

  const corpus = await buildCorpus(reader, [publicRoot]);
  const problems = codes(corpus, PROBLEM.RECORD_SCHEMA_UNSUPPORTED);

  assert.equal(problems.length, 1);
  assert.equal(problems[0].path, "content/unsupported.md:2 /schemaVersion");
  assert.equal(codes(corpus, PROBLEM.RECORD_INVALID).length, 0);
});

test("RECORD_INVALID fires when schemaVersion has the wrong type", async () => {
  const path = "content/typed.md";
  const reader = createMemoryReader({
    [path]: authored(path, { id: "component.typed", schemaVersion: "1" }),
  });

  const corpus = await buildCorpus(reader, [publicRoot]);
  const problems = codes(corpus, PROBLEM.RECORD_INVALID);

  assert.equal(problems.length, 1);
  assert.equal(problems[0].path, "content/typed.md:2 /schemaVersion");
  assert.equal(codes(corpus, PROBLEM.RECORD_SCHEMA_UNSUPPORTED).length, 0);
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

test("RECORD_INVALID fires when a record declares two authored sources", async () => {
  const path = "content/two.md";
  const reader = createMemoryReader({
    [path]: recordMarkdown({
      id: "component.two",
      sources: [
        { kind: "authored", path },
        { kind: "authored", path: "content/ghost.md" },
      ],
    }),
  });

  const corpus = await buildCorpus(reader, [publicRoot]);
  const problems = codes(corpus, PROBLEM.RECORD_INVALID);

  assert.ok(problems.some((item) => /^content\/two.md:\d+ \/sources$/.test(item.path)));
  assert.match(problems[0].message, /exactly one authored source/);
  assert.equal(corpus.records.size, 0);
});

test("SOURCE_MISSING fires when the authored source path does not exist", async () => {
  const path = "content/mismatch.md";
  const reader = createMemoryReader({
    [path]: authored("content/other.md", { id: "component.mismatch" }),
  });

  const corpus = await buildCorpus(reader, [publicRoot]);
  const problems = codes(corpus, PROBLEM.SOURCE_MISSING);

  assert.equal(problems.length, 1);
  assert.equal(problems[0].path, "content/other.md");
  assert.equal(
    corpus.records
      .get("component.mismatch")
      .sources.some((source) => source.path === "content/other.md"),
    false,
  );
});

test("authored source revision digests the bytes at the declared path", async () => {
  const path = "content/rev.md";
  const other = "content/other.txt";
  const otherText = "bytes at the declared authored path\n";
  const reader = createMemoryReader({
    [path]: authored(other, { id: "component.rev" }),
    [other]: otherText,
  });

  const corpus = await buildCorpus(reader, [publicRoot]);
  const authoredSource = corpus.records
    .get("component.rev")
    .sources.find((source) => source.kind === "authored");

  assert.equal(codes(corpus, PROBLEM.RECORD_PATH_MISMATCH).length, 1);
  assert.equal(codes(corpus, PROBLEM.SOURCE_MISSING).length, 0);
  assert.equal(authoredSource.path, other);
  assert.equal(authoredSource.revision, shortRevision(otherText));
});

test("matching authored source revision digests the record file", async () => {
  const path = "content/rev.md";
  const text = authored(path, { id: "component.rev" });
  const reader = createMemoryReader({ [path]: text });

  const corpus = await buildCorpus(reader, [publicRoot]);
  const record = corpus.records.get("component.rev");

  assert.equal(corpus.problems.filter((item) => item.severity === "error").length, 0);
  assert.equal(record.sources.length, 1);
  assert.equal(record.sources[0].path, path);
  assert.equal(record.sources[0].revision, shortRevision(text));
});

test("omitted compiler-known fields compile like an explicit public record", async () => {
  const path = "content/omitted.md";
  const reader = createMemoryReader({
    [path]: `---
id: component.omitted
type: component
title: Omitted
summary: A fixture record.
status: draft
jobs:
  - design
tags:
  - fixture
---

Body text.
`,
  });

  const corpus = await buildCorpus(reader, [publicRoot]);
  assert.equal(corpus.problems.filter((item) => item.severity === "error").length, 0);
  const record = corpus.records.get("component.omitted");
  assert.equal(record.schemaVersion, 1);
  assert.equal(record.visibility, "public");
  assert.deepEqual(record.relations, {});
  assert.equal(record.jobs[0], "design");
  assert.equal(
    record.sources.some((source) => source.kind === "authored" && source.path === path),
    true,
  );
});

test("an internal root fills omitted visibility as internal", async () => {
  const path = "internal/quiet.md";
  const reader = createMemoryReader({
    [path]: `---
id: component.quiet
type: component
title: Quiet
summary: An internal fixture.
status: draft
jobs:
  - design
tags:
  - fixture
---

Body text.
`,
  });

  const corpus = await buildCorpus(reader, [internalRoot]);
  assert.equal(corpus.problems.filter((item) => item.severity === "error").length, 0);
  assert.equal(corpus.records.get("component.quiet").visibility, "internal");
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

test("CORPUS_DUPLICATE_ASSET_ID keeps the first bytes and names both records", async () => {
  const first = "content/one.md";
  const second = "content/two.md";
  const otherSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10"><rect width="10" height="10"/></svg>\n`;
  const reader = createMemoryReader({
    [first]: authored(first, {
      id: "example.one",
      type: "example",
      assets: [
        {
          id: "ds.shared-asset",
          path: "content/one.svg",
          mediaType: "image/svg+xml",
          width: 10,
          height: 10,
          alt: "First.",
        },
      ],
      annotations: [{ id: "note", label: "Note", description: "First image." }],
    }),
    [second]: authored(second, {
      id: "example.two",
      type: "example",
      assets: [
        {
          id: "ds.shared-asset",
          path: "content/two.svg",
          mediaType: "image/svg+xml",
          width: 10,
          height: 10,
          alt: "Second.",
        },
      ],
      annotations: [{ id: "note", label: "Note", description: "Second image." }],
    }),
    "content/one.svg": tinySvg,
    "content/two.svg": otherSvg,
  });

  const corpus = await buildCorpus(reader, [publicRoot]);
  const problems = codes(corpus, PROBLEM.CORPUS_DUPLICATE_ASSET_ID);

  assert.equal(problems.length, 1);
  assert.match(problems[0].message, /example\.one/);
  assert.match(problems[0].message, /example\.two/);
  assert.equal(problems[0].recordId, "example.two");

  const shared = "assets/ds.shared-asset.svg";
  assert.equal(corpus.assetBytes.size, 1);
  assert.deepEqual(corpus.assetBytes.get(shared), new TextEncoder().encode(tinySvg));
  assert.equal(corpus.records.get("example.one").assets[0].bundlePath, shared);
  assert.equal(corpus.records.get("example.two").assets, undefined);
});

test("CORPUS_ROOT_UNREADABLE fires when listRecords fails", async () => {
  const reader = {
    async listRecords() {
      const error = new Error("missing");
      error.code = "ENOENT";
      error.path = "content";
      throw error;
    },
    async readText() {
      return null;
    },
    async readBytes() {
      return null;
    },
  };

  const corpus = await buildCorpus(reader, [publicRoot]);
  const problems = codes(corpus, PROBLEM.CORPUS_ROOT_UNREADABLE);

  assert.equal(problems.length, 1);
  assert.equal(problems[0].path, "content");
  assert.match(problems[0].message, /ENOENT/);
  assert.equal(corpus.records.size, 0);
});

test("RECORD_UNREADABLE fires when a listed record cannot be read", async () => {
  const reader = {
    async listRecords() {
      return ["content/gone.md"];
    },
    async readText() {
      return null;
    },
    async readBytes() {
      return null;
    },
  };

  const corpus = await buildCorpus(reader, [publicRoot]);
  const problems = codes(corpus, PROBLEM.RECORD_UNREADABLE);

  assert.equal(problems.length, 1);
  assert.equal(problems[0].path, "content/gone.md");
  assert.match(problems[0].message, /ENOENT/);
  assert.equal(corpus.records.size, 0);
});

test("RECORD_UNREADABLE preserves a thrown filesystem code", async () => {
  const reader = {
    async listRecords() {
      return ["content/denied.md"];
    },
    async readText() {
      const error = new Error("denied");
      error.code = "EACCES";
      throw error;
    },
    async readBytes() {
      return null;
    },
  };

  const corpus = await buildCorpus(reader, [publicRoot]);
  const problems = codes(corpus, PROBLEM.RECORD_UNREADABLE);

  assert.equal(problems.length, 1);
  assert.equal(problems[0].path, "content/denied.md");
  assert.match(problems[0].message, /EACCES/);
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

test("SOURCE_CONFLICT fires when the contract namespace is missing from the token file", async () => {
  const path = "content/namespace.md";
  const reader = createMemoryReader({
    [path]: recordMarkdown({
      id: "component.namespace",
      sources: [
        { kind: "authored", path },
        { kind: "token-source", path: "packages/tokens/other.json" },
      ],
      contract: portableContract({
        description: "Has a namespace the token file does not define.",
        parameters: {
          variant: { kind: "enum", values: { primary: "Primary." } },
          size: { kind: "enum", values: { sm: "Small.", md: "Medium." } },
        },
      }),
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

test("SOURCE_CONFLICT fires when a web parameter is not a bijection", async () => {
  const reader = createMemoryReader({
    "content/bound.spec.yaml": recordYaml({
      id: "component.bound",
      path: "content/bound.spec.yaml",
      contract: portableContract({
        description: "Needs a matching web parameter.",
        anatomy: [{ name: "control", role: "interactive-surface", description: "Control." }],
        parameters: { disabled: { kind: "boolean", default: false } },
        events: { activate: { description: "Activate." } },
      }),
      web: {
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

function defaultedComponent(web) {
  return createMemoryReader({
    "content/defaulted.spec.yaml": recordYaml({
      id: "component.defaulted",
      path: "content/defaulted.spec.yaml",
      contract: portableContract({
        description: "Maps by default.",
        anatomy: [
          { name: "control", role: "interactive-surface", description: "Control." },
          { name: "hint", role: "label", description: "Hint." },
        ],
        parameters: {
          disabled: { kind: "boolean", default: false },
          fullWidth: { kind: "boolean", default: false },
          accessibleName: { kind: "string" },
        },
        events: {},
      }),
      web: {
        package: "@stevegreco/design-system-components",
        export: "DsDefaulted",
        defaultTagName: "ds-defaulted",
        registration: { export: "defineDefaulted", supportsAliases: true },
        anatomy: {
          control: { element: "button", part: "button" },
          hint: { element: "p", part: "hint" },
        },
        events: {},
        ...web,
      },
    }),
  });
}

test("web parameters default to kebab-case attributes and same-name properties", async () => {
  const corpus = await buildCorpus(
    defaultedComponent({ parameters: { accessibleName: { attribute: "aria-label" } } }),
    [publicRoot],
  );
  assert.deepEqual(
    corpus.problems.filter((item) => item.severity === "error"),
    [],
  );
  const { web } = corpus.records.get("component.defaulted");
  assert.deepEqual(web.parameters, {
    disabled: { attribute: "disabled", property: "disabled" },
    fullWidth: { attribute: "full-width", property: "fullWidth" },
    accessibleName: { attribute: "aria-label" },
  });
  assert.deepEqual(Object.keys(web), [
    "package",
    "export",
    "defaultTagName",
    "registration",
    "anatomy",
    "parameters",
    "events",
    "parts",
  ]);
});

test("web parts default to the anatomy description unless overridden", async () => {
  const corpus = await buildCorpus(
    defaultedComponent({ parts: { hint: { description: "Hint. Hidden when empty." } } }),
    [publicRoot],
  );
  assert.deepEqual(
    corpus.problems.filter((item) => item.severity === "error"),
    [],
  );
  assert.deepEqual(corpus.records.get("component.defaulted").web.parts, {
    button: { description: "Control." },
    hint: { description: "Hint. Hidden when empty." },
  });
});

test("SOURCE_CONFLICT fires when a web section overrides a part it does not render", async () => {
  const corpus = await buildCorpus(
    defaultedComponent({ parts: { missing: { description: "Nowhere." } } }),
    [publicRoot],
  );
  assert.ok(
    codes(corpus, PROBLEM.SOURCE_CONFLICT).some((item) =>
      /web parts has unknown missing/.test(item.message),
    ),
  );
});

test("RECORD_INVALID fires for contradictory contracts and empty web mappings", async () => {
  const reader = createMemoryReader({
    "content/enum.spec.yaml": recordYaml({
      id: "component.enum-default",
      path: "content/enum.spec.yaml",
      contract: portableContract({
        anatomy: [
          { name: "control", role: "interactive-surface", description: "Control." },
          { name: "control", role: "label", description: "Duplicate." },
        ],
        parameters: {
          variant: { kind: "enum", values: { primary: "Primary." }, default: "ghost" },
        },
      }),
      web: {
        package: "@stevegreco/design-system-components",
        export: "DsEmpty",
        defaultTagName: "ds-empty",
        registration: { export: "defineEmpty", supportsAliases: false },
        anatomy: { control: { element: "button" } },
        parameters: { variant: {} },
        events: {},
      },
    }),
  });

  const corpus = await buildCorpus(reader, [publicRoot]);
  const invalid = codes(corpus, PROBLEM.RECORD_INVALID);
  assert.ok(invalid.some((item) => /\/contract\/anatomy\/1\/name/.test(item.path)));
  assert.ok(invalid.some((item) => /\/contract\/parameters\/variant\/default/.test(item.path)));
  assert.ok(invalid.some((item) => /\/web\/parameters\/variant/.test(item.path)));
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

test("BODY_UNRESOLVED_LINK fires for reference-style Markdown links", async () => {
  const path = "content/a.md";
  const target = "content/b.md";
  const reader = createMemoryReader({
    [path]: authored(
      path,
      { id: "component.a" },
      [
        "Inline [ok](b.md).",
        "",
        "Ref style [see][b] and ![img][pic].",
        "",
        "[b]: ./b.md",
        "[pic]: ./missing.svg",
      ].join("\n"),
    ),
    [target]: authored(target, { id: "component.b" }),
  });

  const corpus = await buildCorpus(reader, [publicRoot]);
  const problems = codes(corpus, PROBLEM.BODY_UNRESOLVED_LINK);

  assert.ok(problems.length >= 1);
  assert.equal(problems[0].recordId, "component.a");
  assert.ok(problems.some((item) => /reference-style/.test(item.message)));
  assert.equal(corpus.records.get("component.a").body.includes("[b]: ./b.md"), true);
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
