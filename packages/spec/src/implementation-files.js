import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { ImplementationError, parseImplementation } from "./implementation.js";

export * from "./implementation.js";

/** @typedef {import("./implementation.js").Technology} Technology */
/** @typedef {import("./implementation.js").Implementation} Implementation */

/** The file in an implementation folder that holds setup shared by every component. */
export const SETUP_FILE = "README.md";

/**
 * The setup shared by every component of an implementation: the Markdown of `README.md` in its
 * folder, or undefined when there is none.
 *
 * @param {string} dir
 * @returns {string | undefined}
 */
export function readSetup(dir) {
  const file = join(dir, SETUP_FILE);
  return existsSync(file) ? readFileSync(file, "utf8") : undefined;
}

/**
 * Every `*.md` file in `dir` but the setup file, parsed as files of `technology`, in file-name
 * order. A folder that does not exist yet holds no implementations, so it reads as nothing
 * implemented. Throws on the first file that does not parse; `readImplementationFolder` reports
 * each one.
 *
 * @param {string} dir
 * @param {Technology} technology
 * @returns {Implementation[]}
 */
export function loadImplementations(dir, technology) {
  return implementationFiles(dir).map((name) => parseFile(dir, name, technology));
}

/**
 * Like `loadImplementations`, but a file that does not parse is reported instead of thrown, so a
 * check can list every broken file.
 *
 * @param {string} dir
 * @param {Technology} technology
 * @returns {{ items: { implementation: Implementation, path: string }[], issues: { path: string, message: string }[] }}
 *   Each `path` is the file's absolute path.
 */
export function readImplementationFolder(dir, technology) {
  const items = [];
  const issues = [];
  for (const name of implementationFiles(dir)) {
    const absolute = join(dir, name);
    try {
      items.push({ implementation: parseFile(dir, name, technology), path: absolute });
    } catch (error) {
      if (!(error instanceof ImplementationError)) throw error;
      issues.push({ path: absolute, message: error.detail });
    }
  }
  return { items, issues };
}

function implementationFiles(dir) {
  let names;
  try {
    names = readdirSync(dir);
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
  return names.filter((name) => name.endsWith(".md") && name !== SETUP_FILE).sort();
}

function parseFile(dir, name, technology) {
  return parseImplementation(
    readFileSync(join(dir, name), "utf8"),
    `implementation/${name}`,
    technology,
  );
}
