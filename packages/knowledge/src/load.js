import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { parseYamlMapping } from "./yaml.js";
import { byCodeUnit } from "./util.js";

const FRONT_MATTER = /^﻿?---[ \t]*\r?\n(?:([\s\S]*?)\r?\n)?---[ \t]*(?:\r?\n|$)/;

/**
 * One authored file that holds a record.
 *
 * @typedef {object} SourceFile
 * @property {string} file Path relative to the content folder, with `/` separators.
 * @property {string} absolute
 * @property {"yaml" | "markdown"} format
 * @property {Record<string, any> | undefined} data The parsed record, when the file parsed.
 * @property {string | undefined} body Markdown body, for Markdown records.
 * @property {import("./yaml.js").RawIssue[]} issues Parse failures.
 * @property {(pointer: string) => number | undefined} locate
 */

/**
 * Find and parse every record file under a content folder: each `*.spec.yaml`, and each `*.md`
 * whose front matter has an `id`.
 *
 * @param {string} contentDir Absolute path.
 * @returns {Promise<SourceFile[]>}
 */
export async function readSourceFiles(contentDir) {
  const files = [];
  for (const absolute of await listFiles(contentDir)) {
    const file = path.relative(contentDir, absolute).split(path.sep).join("/");
    if (file.endsWith(".spec.yaml")) {
      files.push(parseYamlFile(file, absolute, await readFile(absolute, "utf8")));
    } else if (file.endsWith(".md")) {
      const source = parseMarkdownFile(file, absolute, await readFile(absolute, "utf8"));
      if (source) files.push(source);
    }
  }
  return files;
}

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  entries.sort((left, right) => byCodeUnit(left.name, right.name));
  const files = [];
  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await listFiles(absolute)));
    else if (entry.isFile()) files.push(absolute);
  }
  return files;
}

function parseYamlFile(file, absolute, text) {
  const { data, issues, locate } = parseYamlMapping(text);
  return { file, absolute, format: "yaml", data, body: undefined, issues, locate };
}

/** Returns undefined when the file is not a record: no front matter, or front matter without `id`. */
function parseMarkdownFile(file, absolute, text) {
  const match = FRONT_MATTER.exec(text);
  if (!match) return undefined;
  const matter = match[1] ?? "";
  // A leading newline stands in for the opening `---`, so YAML lines match file lines.
  const { data, issues, locate } = parseYamlMapping(`\n${matter}`);
  if (data ? !Object.hasOwn(data, "id") : !/^id\s*:/m.test(matter)) return undefined;
  const body = text.slice(match[0].length).trim();
  return { file, absolute, format: "markdown", data, body, issues, locate };
}
