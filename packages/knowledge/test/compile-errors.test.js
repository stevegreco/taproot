import assert from "node:assert/strict";
import { join } from "node:path";
import { test } from "vitest";
import { buildCorpus } from "../src/compile/corpus.js";
import { rewriteBodyLinks } from "../src/compile/narrative.js";
import { parseRecord } from "../src/index.js";
import { createFsReader, recordMarkdown, repoRoot } from "./helpers/workspace.js";

const BUTTON = "packages/knowledge/content/components/button/button.spec.yaml";
const PATTERN = "packages/knowledge/content/patterns/action-hierarchy.md";

/** Compile the real content with one file's text changed. */
async function errorsWith(path, edit) {
  const reader = createFsReader(repoRoot);
  const readText = reader.readText.bind(reader);
  reader.readText = async (repoPath) => {
    const text = await readText(repoPath);
    return repoPath === path ? edit(text) : text;
  };
  const corpus = await buildCorpus(
    reader,
    [{ root: join(repoRoot, "packages/knowledge/content"), visibility: "public" }],
    { workspaceRoot: repoRoot },
  );
  return corpus.problems.filter((item) => item.severity === "error");
}

test("a YAML syntax error in one spec is the only error", async () => {
  const errors = await errorsWith(BUTTON, (text) =>
    text.replace("sm: Small button.", "sm: Small button: tiny"),
  );
  assert.equal(errors.length, 1, errors.map((item) => item.message).join("\n"));
  assert.match(errors[0].path, /button\.spec\.yaml:\d+$/);
});

test("a schema error in one spec is the only error", async () => {
  const errors = await errorsWith(BUTTON, (text) => text.replace("title: Button", "title: 7"));
  assert.equal(errors.length, 1, errors.map((item) => item.message).join("\n"));
});

test("a Markdown frontmatter error is the only error", async () => {
  const errors = await errorsWith(PATTERN, (text) =>
    text.replace(/^title: .*$/m, (line) => `${line}\ntitle: Again`),
  );
  assert.equal(errors.length, 1, errors.map((item) => item.message).join("\n"));
  assert.match(errors[0].path, /action-hierarchy\.md:\d+$/);
});

test("a token typo names the spec file and line", async () => {
  const errors = await errorsWith(BUTTON, (text) =>
    text.replace(
      "component.button.primary.background.hover",
      "component.button.primary.background.hovr",
    ),
  );
  assert.equal(errors.length, 1);
  assert.match(
    errors[0].path,
    /^packages\/knowledge\/content\/components\/button\/button\.spec\.yaml:\d+ \//,
  );
});

test("a rule fragment without a matching heading fails once", async () => {
  const errors = await errorsWith(BUTTON, (text) =>
    text.replace("fragment: assign-emphasis", "fragment: no-such-heading"),
  );
  assert.equal(errors.length, 1, errors.map((item) => item.message).join("\n"));
  assert.match(errors[0].message, /#no-such-heading/);
});

test("Markdown frontmatter uses the strict YAML parser", () => {
  const markdown = recordMarkdown({ id: "guideline.dated", type: "guideline" }).replace(
    "summary: A fixture record.",
    "summary: 2026-01-01",
  );
  // Plain YAML 1.2 keeps a date-like scalar as a string, as in .spec.yaml files.
  assert.equal(parseRecord(markdown, { sourcePath: "content/dated.md" }).summary, "2026-01-01");
  assert.equal(
    parseRecord(`﻿${markdown}`, { sourcePath: "content/dated.md" }).id,
    "guideline.dated",
  );
});

const linkContext = {
  recordIdByPath: new Map([
    ["content/patterns/p.md", "pattern.p"],
    ["content/patterns/p-q.md", "pattern.p-q"],
  ]),
  assetPathToBundlePath: new Map([["content/examples/img/x.svg", "assets/x.svg"]]),
  authoredPath: "content/examples/e.md",
  recordId: "example.e",
};

test("a linked image rewrites both destinations", () => {
  const { body, problems } = rewriteBodyLinks("[![D](img/x.svg)](../patterns/p.md)", linkContext);
  assert.deepEqual(problems, []);
  assert.equal(body, "[![D](assets/x.svg)](markdown/pattern.p.md)");
});

test("an escaped link destination is rewritten", () => {
  const { body } = rewriteBodyLinks('[p](../patterns/p\\-q.md#a "T")', linkContext);
  assert.equal(body, '[p](markdown/pattern.p-q.md#a "T")');
});
