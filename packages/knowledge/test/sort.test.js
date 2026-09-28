import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

import { byCodeUnit } from "../src/sort.js";

const SRC = new URL("../src/", import.meta.url).pathname;

async function sourceFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) return sourceFiles(path);
      return entry.name.endsWith(".js") ? [path] : [];
    }),
  );
  return nested.flat();
}

describe("sorting", () => {
  test("orders by code unit, not locale", () => {
    // Danish collation sorts "aa" after "z"; code units do not.
    expect(["z", "aa", "B", "a"].sort(byCodeUnit)).toEqual(["B", "a", "aa", "z"]);
  });

  test("no source file sorts with localeCompare", async () => {
    const offenders = [];
    for (const path of await sourceFiles(SRC)) {
      if ((await readFile(path, "utf8")).includes("localeCompare")) offenders.push(path);
    }
    expect(offenders).toEqual([]);
  });
});
