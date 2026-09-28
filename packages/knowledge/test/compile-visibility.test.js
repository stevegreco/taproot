import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "vitest";
import { compile } from "../src/compile/index.js";
import { buildCorpus } from "../src/compile/corpus.js";
import { projectBundle } from "../src/compile/bundle.js";
import { PROBLEM } from "../src/compile/tables.js";
import { createMemoryReader, recordMarkdown, repoRoot, tinySvg } from "./helpers/workspace.js";

const meta = {
  knowledgeVersion: "0.0.1",
  designSystemVersion: "0.0.5",
  buildTime: new Date(0),
  revision: "test",
};

for (const [label, body, expectedLeaks] of [
  ["record link", "See [secret](../internal/secret.md#details).", 1],
  ["HTML image", '<img src="assets/ds.secret.svg" alt="Private">', 1],
  ["HTML record link", '<a href="markdown/internal.secret.md#details">Private</a>', 1],
  ["HTML authored path", '<img src="../internal/secret.svg">', 1],
  ["HTML unquoted attribute", "<div><IMG SRC=assets/ds.secret.svg></div>", 1],
  ["HTML entity", '<img src="assets/ds&#46;secret.svg">', 1],
  ["HTML comment", '<!-- <img src="assets/ds.secret.svg"> -->', 0],
  ["HTML external URL", '<img src="https://example.com/assets/ds.secret.svg">', 0],
  ["HTML protocol-relative URL", '<img src="//example.com/assets/ds.secret.svg">', 0],
  ["HTML in inline code", '`<img src="assets/ds.secret.svg">`', 0],
  [
    "inline code",
    "Example: `[secret](../internal/secret.md)` and `markdown/internal.secret.md`.",
    0,
  ],
  [
    "code block",
    "```md\n[secret](../internal/secret.md)\nmarkdown/internal.secret.md\nassets/ds.secret.svg\n```",
    0,
  ],
  ["plain text", "The path markdown/internal.secret.md is an example.", 0],
  ["external link", "[Example](https://example.com/markdown/internal.secret.md)", 0],
]) {
  test(`narrative visibility uses parsed references: ${label}`, async () => {
    const corpus = await buildCorpus(
      createMemoryReader({
        "content/public.md": recordMarkdown(
          { id: "component.public", path: "content/public.md" },
          body,
        ),
        "internal/secret.md": recordMarkdown({
          id: "internal.secret",
          path: "internal/secret.md",
          visibility: "internal",
          type: "example",
          assets: [
            {
              id: "ds.secret",
              path: "internal/secret.svg",
              mediaType: "image/svg+xml",
              width: 10,
              height: 10,
              alt: "Private",
            },
          ],
          annotations: [{ id: "note", label: "Note", description: "Private" }],
        }),
        "internal/secret.svg": tinySvg,
      }),
      [
        { root: "content", visibility: "public" },
        { root: "internal", visibility: "internal" },
      ],
    );
    assert.deepEqual(corpus.problems, []);
    const bundle = projectBundle(corpus, "public", meta);
    assert.equal(
      bundle.problems.filter((item) => item.code === PROBLEM.VISIBILITY_LEAK).length,
      expectedLeaks,
    );
    assert.equal(Object.hasOwn(bundle.records[0], "narrativeReferences"), false);
  });
}

test("public bundle drops internal inbound edges", async () => {
  const outDir = await mkdtemp(join(tmpdir(), "knowledge-visibility-"));
  const result = await compile({
    workspaceRoot: repoRoot,
    outDir,
    internalContent: {
      root: join(repoRoot, "packages/knowledge/test/fixtures/internal-content"),
      visibility: "internal",
    },
    buildTime: new Date(0),
  });

  const publicRecords = JSON.parse(await readFile(join(outDir, "public/records.json"), "utf8"));
  const internalRecords = JSON.parse(await readFile(join(outDir, "internal/records.json"), "utf8"));

  assert.ok(publicRecords.every((record) => record.visibility === "public"));
  assert.equal(
    publicRecords.some((record) => JSON.stringify(record).includes("internal.uses-button")),
    false,
  );

  const publicButton = publicRecords.find((record) => record.id === "component.button");
  assert.equal((publicButton.backlinks.related ?? []).includes("internal.uses-button"), false);

  const internalButton = internalRecords.find((record) => record.id === "component.button");
  assert.ok((internalButton.backlinks.related ?? []).includes("internal.uses-button"));
  assert.ok(internalRecords.some((record) => record.id === "internal.uses-button"));
  assert.equal(result.bundles[0].visibility, "public");
  assert.ok(result.bundles[0].recordCount < result.bundles[1].recordCount);
});

test("VISIBILITY_LEAK fires when a public record references an internal record", async () => {
  const reader = createMemoryReader({
    "content/leaky.md": recordMarkdown({
      id: "component.leaky",
      related: ["internal.secret"],
      sources: [{ kind: "authored", path: "content/leaky.md" }],
    }),
    "internal/secret.md": recordMarkdown({
      id: "internal.secret",
      visibility: "internal",
      sources: [{ kind: "authored", path: "internal/secret.md" }],
    }),
  });

  const corpus = await buildCorpus(reader, [
    { root: "content", visibility: "public" },
    { root: "internal", visibility: "internal" },
  ]);
  const bundle = projectBundle(corpus, "public", meta);
  assert.ok(bundle.problems.some((item) => item.code === PROBLEM.VISIBILITY_LEAK));
});

test("VISIBILITY_LEAK fires when a public body references an internal-only asset", async () => {
  const reader = createMemoryReader({
    "content/leaky.md": recordMarkdown(
      {
        id: "component.leaky-asset",
        sources: [{ kind: "authored", path: "content/leaky.md" }],
      },
      "See ![shot](../internal/secret.svg) here.",
    ),
    "internal/secret.md": recordMarkdown({
      id: "example.secret-shot",
      type: "example",
      visibility: "internal",
      sources: [{ kind: "authored", path: "internal/secret.md" }],
      assets: [
        {
          id: "ds.secret-shot",
          path: "internal/secret.svg",
          mediaType: "image/svg+xml",
          width: 10,
          height: 10,
          alt: "Internal only.",
        },
      ],
      annotations: [{ id: "note", label: "Note", description: "Private frame." }],
    }),
    "internal/secret.svg": tinySvg,
  });

  const corpus = await buildCorpus(reader, [
    { root: "content", visibility: "public" },
    { root: "internal", visibility: "internal" },
  ]);
  assert.equal(
    corpus.problems.filter((item) => item.severity === "error").length,
    0,
    JSON.stringify(corpus.problems, null, 2),
  );
  assert.match(corpus.records.get("component.leaky-asset").body, /assets\/ds\.secret-shot\.svg/);

  const publicBundle = projectBundle(corpus, "public", meta);
  const leaks = publicBundle.problems.filter((item) => item.code === PROBLEM.VISIBILITY_LEAK);
  assert.equal(leaks.length, 1);
  assert.equal(leaks[0].recordId, "component.leaky-asset");
  assert.match(leaks[0].message, /assets\/ds\.secret-shot\.svg/);
  assert.equal(publicBundle.files.has("assets/ds.secret-shot.svg"), false);

  const internalBundle = projectBundle(corpus, "internal", meta);
  assert.equal(
    internalBundle.problems.filter((item) => item.code === PROBLEM.VISIBILITY_LEAK).length,
    0,
  );
  assert.equal(internalBundle.files.has("assets/ds.secret-shot.svg"), true);
});

test("public records may still reference a public asset from the body", async () => {
  const reader = createMemoryReader({
    "content/uses-shot.md": recordMarkdown(
      {
        id: "component.uses-shot",
        sources: [{ kind: "authored", path: "content/uses-shot.md" }],
      },
      "See ![shot](./public.svg).",
    ),
    "content/public-example.md": recordMarkdown({
      id: "example.public-shot",
      type: "example",
      sources: [{ kind: "authored", path: "content/public-example.md" }],
      assets: [
        {
          id: "ds.public-shot",
          path: "content/public.svg",
          mediaType: "image/svg+xml",
          width: 10,
          height: 10,
          alt: "Public frame.",
        },
      ],
      annotations: [{ id: "note", label: "Note", description: "Shared frame." }],
    }),
    "content/public.svg": tinySvg,
  });

  const corpus = await buildCorpus(reader, [{ root: "content", visibility: "public" }]);
  const bundle = projectBundle(corpus, "public", meta);
  assert.equal(bundle.problems.filter((item) => item.code === PROBLEM.VISIBILITY_LEAK).length, 0);
  assert.equal(bundle.files.has("assets/ds.public-shot.svg"), true);
});
