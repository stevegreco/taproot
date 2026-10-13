import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { DEFAULT_CONTENT_DIR, loadSpec, schema, validateSpec } from "../src/index.js";

/**
 * The `id` of every record file under the content folder, read with a plain
 * line match so the test does not reuse the loader it checks: each
 * `*.spec.yaml`, and each `*.md` whose front matter has an `id`.
 */
async function idsOnDisk() {
  const ids = [];
  for (const file of await readdir(DEFAULT_CONTENT_DIR, { recursive: true })) {
    if (!file.endsWith(".spec.yaml") && !file.endsWith(".md")) continue;
    const text = await readFile(path.join(DEFAULT_CONTENT_DIR, file), "utf8");
    const header = file.endsWith(".md")
      ? (/^---\r?\n([\s\S]*?)\r?\n---/.exec(text)?.[1] ?? "")
      : text;
    const id = /^id:\s*(\S+)\s*$/m.exec(header)?.[1];
    if (id) ids.push(id);
  }
  return ids.sort();
}

describe("shipped content", () => {
  it("loads every record file with zero issues", async () => {
    const result = await validateSpec();
    expect(result.issues).toEqual([]);
    expect(result.recordCount).toBe((await idsOnDisk()).length);
  });

  it("finds every record on disk by its id, once", async () => {
    const spec = await loadSpec({ contentDir: DEFAULT_CONTENT_DIR });
    const ids = spec.list().map((record) => record.id);
    expect(ids.length).toBeGreaterThan(0);
    expect(new Set(ids).size).toBe(ids.length);
    expect([...ids].sort()).toEqual(await idsOnDisk());
    for (const id of ids) expect(spec.get(id)?.id).toBe(id);
  });

  it("exposes the parsed schema", () => {
    expect(schema.$id).toBe("urn:design-system-spec:record:1");
  });
});
