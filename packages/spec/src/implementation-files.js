import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { parseImplementation } from "./implementation.js";

export * from "./implementation.js";

/** @typedef {import("./implementation.js").Technology} Technology */
/** @typedef {import("./implementation.js").Implementation} Implementation */

/**
 * Every `*.md` file in `dir`, parsed as files of `technology`, in file-name order. A folder that
 * does not exist yet holds no implementations, so it reads as nothing implemented.
 *
 * @param {string} dir
 * @param {Technology} technology
 * @returns {Implementation[]}
 */
export function loadImplementations(dir, technology) {
  let names;
  try {
    names = readdirSync(dir);
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
  return names
    .filter((name) => name.endsWith(".md"))
    .sort()
    .map((name) =>
      parseImplementation(
        readFileSync(join(dir, name), "utf8"),
        `implementation/${name}`,
        technology,
      ),
    );
}
