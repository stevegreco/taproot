import assert from "node:assert/strict";
import { globSync } from "node:fs";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { compile } from "../src/compile/index.js";
import { repoRoot } from "./helpers/workspace.js";

const contentRoot = join(dirname(fileURLToPath(import.meta.url)), "../content");

test("the authored slice compiles with contracts, ghost tokens, rewritten links, and assets", async () => {
  const authoredCount = globSync("**/*.md", { cwd: contentRoot }).length;
  const outDir = await mkdtemp(join(tmpdir(), "knowledge-slice-"));
  const result = await compile({
    workspaceRoot: repoRoot,
    outDir,
    buildTime: new Date(0),
    revision: "slice",
  });

  assert.equal(result.warnings.filter((item) => item.severity === "error").length, 0);

  const records = JSON.parse(await readFile(join(outDir, "public/records.json"), "utf8"));
  const manifest = JSON.parse(await readFile(join(outDir, "public/manifest.json"), "utf8"));
  assert.equal(manifest.content.recordCount, authoredCount);
  assert.equal(manifest.content.visibility, "public");
  assert.ok(manifest.content.files.some((entry) => entry.path === "schema/portable-contract.json"));
  assert.ok(manifest.content.files.some((entry) => entry.path === "schema/host-binding.json"));
  assert.equal(records.length, authoredCount);

  const button = records.find((record) => record.id === "component.button");
  assert.ok(button.contract.parameters.variant.values.primary);
  assert.equal(Object.hasOwn(button.contract, "tagName"), false);
  const ghost = button.tokens.entries.filter((entry) => entry.group === "ghost");
  assert.ok(ghost.length > 0);

  const badge = records.find((record) => record.id === "component.badge");
  assert.equal(Object.hasOwn(badge.contract, "tagName"), false);
  assert.equal(badge.contract.parameters.variant.default, "default");
  assert.equal(Object.hasOwn(badge, "tokens"), false);
  assert.equal(badge.decisions.length, 1);
  assert.match(badge.decisions[0].title, /ADR 0003/);

  const binding = records.find((record) => record.id === "binding.button.web-component");
  assert.equal(binding.host.defaultTagName, "ds-button");

  const buttonMarkdown = await readFile(join(outDir, "public/markdown/component.button.md"), "utf8");
  assert.match(buttonMarkdown, /markdown\/pattern\.action-hierarchy\.md/);
  assert.doesNotMatch(buttonMarkdown, /\.\.\/patterns\/action-hierarchy\.md/);
  assert.doesNotMatch(buttonMarkdown, /^contract:/m);
  assert.doesNotMatch(buttonMarkdown, /^host:/m);
  assert.doesNotMatch(buttonMarkdown, /^checks:/m);

  const bindingMarkdown = await readFile(
    join(outDir, "public/markdown/binding.button.web-component.md"),
    "utf8",
  );
  assert.doesNotMatch(bindingMarkdown, /^host:/m);
  assert.doesNotMatch(bindingMarkdown, /^contract:/m);

  const reviewMarkdown = await readFile(
    join(outDir, "public/markdown/guideline.button-review.md"),
    "utf8",
  );
  assert.doesNotMatch(reviewMarkdown, /^checks:/m);

  const example = records.find((record) => record.id === "example.action-hierarchy.settings");
  const assetPath = example.assets[0].bundlePath;
  const svg = await readFile(join(outDir, "public", assetPath), "utf8");
  assert.match(svg, /<svg/);
  assert.match(example.body, new RegExp(assetPath.replaceAll(".", "\\.")));
});
