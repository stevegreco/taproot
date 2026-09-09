import assert from "node:assert/strict";
import { access, cp, mkdtemp, readFile, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fromMarkdown } from "mdast-util-from-markdown";
import { visit } from "unist-util-visit";
import { compile } from "../src/compile/index.js";
import { markdownDestinations } from "../src/compile/narrative.js";
import { repoRoot } from "./helpers/workspace.js";

test("copied public Markdown files resolve record, asset, and fragment destinations", async () => {
  const outDir = await mkdtemp(join(tmpdir(), "knowledge-links-"));
  await compile({
    workspaceRoot: repoRoot,
    outDir,
    buildTime: new Date(0),
    revision: "markdown-links",
  });

  const copied = await mkdtemp(join(tmpdir(), "knowledge-copied-public-"));
  await cp(join(outDir, "public"), copied, { recursive: true });

  const records = JSON.parse(await readFile(join(copied, "records.json"), "utf8"));
  const button = records.find((record) => record.id === "component.button");
  const example = records.find((record) => record.id === "example.action-hierarchy.settings");
  assert.match(button.body, /markdown\/pattern\.action-hierarchy\.md#assign-emphasis/);
  assert.match(example.body, /\]\(assets\//);

  const files = await markdownFiles(join(copied, "markdown"));
  const seen = { record: 0, asset: 0, fragment: 0 };

  for (const file of files) {
    const markdown = await readFile(file, "utf8");
    const body = stripFrontmatter(markdown);
    for (const url of markdownDestinations(body)) {
      const classified = classifyDestination(url);
      if (classified.kind === "leave") continue;
      const resolved = resolveFromFile(file, url);
      await assert.doesNotReject(
        () => access(resolved.path),
        `${file} destination ${url} -> ${resolved.path} is missing`,
      );
      if (resolved.hash) {
        const target = await readFile(resolved.path, "utf8");
        assert.equal(
          targetHasFragment(target, resolved.hash),
          true,
          `${file} destination ${url} fragment #${resolved.hash} is missing in ${resolved.path}`,
        );
        seen.fragment += 1;
      }
      seen[classified.kind] += 1;
    }
  }

  assert.ok(seen.record > 0, "copied bundle must include a record link");
  assert.ok(seen.asset > 0, "copied bundle must include an asset link");
  assert.ok(seen.fragment > 0, "copied bundle must include a fragment");
});

async function markdownFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  return entries.filter((entry) => entry.isFile() && entry.name.endsWith(".md")).map((entry) => join(dir, entry.name));
}

function stripFrontmatter(markdown) {
  const match = markdown.match(/^---\n[\s\S]*?\n---\n\n/);
  return match ? markdown.slice(match[0].length) : markdown;
}

function classifyDestination(url) {
  if (!url || url.startsWith("#")) return { kind: "leave" };
  if (/^[a-z][a-z0-9+.-]*:/i.test(url) || url.startsWith("//") || url.startsWith("/")) {
    return { kind: "leave" };
  }
  const pathPart = url.split("#")[0];
  if (pathPart.startsWith("../assets/") || pathPart.startsWith("assets/")) return { kind: "asset" };
  return { kind: "record" };
}

function resolveFromFile(file, url) {
  const hashIndex = url.indexOf("#");
  const pathPart = hashIndex === -1 ? url : url.slice(0, hashIndex);
  const hash = hashIndex === -1 ? "" : url.slice(hashIndex + 1);
  return { path: join(dirname(file), pathPart), hash };
}

function targetHasFragment(markdown, hash) {
  if (new RegExp(`\\bid=["']${escapeRegExp(hash)}["']`, "i").test(markdown)) return true;
  const body = stripFrontmatter(markdown);
  const slugs = new Set();
  visit(fromMarkdown(body), "heading", (node) => {
    slugs.add(headingSlug(plainText(node)));
  });
  return slugs.has(hash.toLowerCase());
}

function plainText(node) {
  const parts = [];
  visit(node, "text", (child) => {
    parts.push(child.value);
  });
  return parts.join("");
}

function headingSlug(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-");
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
