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
  assert.equal(records.length, authoredCount);

  const button = records.find((record) => record.id === "component.button");
  assert.ok(button.contract.api.attributes.variant.values.primary);
  const ghost = button.tokens.entries.filter((entry) => entry.group === "ghost");
  assert.ok(ghost.length > 0);

  const badge = records.find((record) => record.id === "component.badge");
  assert.equal(badge.contract.tagName, "ds-badge");
  assert.equal(Object.hasOwn(badge, "tokens"), false);
  assert.equal(badge.decisions.length, 1);
  assert.match(badge.decisions[0].title, /ADR 0003/);

  const buttonMarkdown = await readFile(join(outDir, "public/markdown/component.button.md"), "utf8");
  assert.match(buttonMarkdown, /markdown\/pattern\.action-hierarchy\.md/);
  assert.doesNotMatch(buttonMarkdown, /\.\.\/patterns\/action-hierarchy\.md/);

  const example = records.find((record) => record.id === "example.action-hierarchy.settings");
  const assetPath = example.assets[0].bundlePath;
  const svg = await readFile(join(outDir, "public", assetPath), "utf8");
  assert.match(svg, /<svg/);
  assert.match(example.body, new RegExp(assetPath.replaceAll(".", "\\.")));
});
