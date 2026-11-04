import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { fileURLToPath } from "node:url";
import { resolveConfig, validateFromConfig } from "../src/config.js";
import { checkImplementation } from "../src/implementation.js";
import { loadImplementations } from "../src/implementation-files.js";
import { DEFAULT_CONTENT_DIR, loadSpec, schema, validateSpec } from "../src/index.js";
import { TOKEN_KEYWORDS, TOKEN_PROPERTIES } from "../src/validate.js";

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

  it("names only tokens that exist in every configured set", async () => {
    const cwd = fileURLToPath(new URL("../../..", import.meta.url));
    const { issues } = await validateFromConfig({ cwd });
    expect(issues).toEqual([]);
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

  it("takes colors, radii, and borders from the semantic tier (tokens ADR 0003)", async () => {
    const spec = await loadSpec({ contentDir: DEFAULT_CONTENT_DIR });
    const primitives = spec
      .list({ type: "component" })
      .flatMap(({ id }) => spec.tokens(id).map((binding) => `${id}: ${binding.token}`))
      .filter((entry) => /: primitives\.(?:color|radius|border)\./.test(entry));
    expect(primitives).toEqual([]);
  });
});

describe("shipped implementations", () => {
  const cwd = fileURLToPath(new URL("../../..", import.meta.url));
  const implementations = () =>
    Object.entries(resolveConfig({ cwd }).implementations).map(
      ([name, { folder, technology }]) => ({
        name,
        folder,
        items: loadImplementations(folder, technology),
      }),
    );
  const slug = (id) => id.slice("component.".length);

  it("covers every parameter, value, and event of its record", async () => {
    const spec = await loadSpec();
    for (const { items } of implementations()) {
      for (const item of items) {
        const record = spec.get(item.component);
        expect(record, `${item.file}: ${item.component} is a record`).toBeDefined();
        checkImplementation(item, record);
      }
    }
  });

  it("exists for every built component, and for no draft", async () => {
    const spec = await loadSpec();
    const components = spec.list({ type: "component" });
    const sets = implementations().map(({ name, folder, items }) => ({
      name,
      folder,
      slugs: items.map((item) => slug(item.component)),
    }));

    for (const { id, status } of components) {
      if (status === "draft") {
        for (const { name, folder, slugs } of sets) {
          expect(
            slugs,
            `${id} has a ${name} implementation in ${folder}, so remove status: draft from its spec`,
          ).not.toContain(slug(id));
        }
      } else {
        expect(
          sets.some(({ slugs }) => slugs.includes(slug(id))),
          `${id} is not a draft, so it needs an implementation file in ${sets.map(({ folder }) => folder).join(" or ")}`,
        ).toBe(true);
      }
    }
  });
});

describe("SPEC.md", () => {
  it("lists the token properties the format command serves", async () => {
    const text = await readFile(fileURLToPath(new URL("../SPEC.md", import.meta.url)), "utf8");
    const bullet =
      /- A \*\*property\*\* is a neutral visual name\. Use these where they fit: ([\s\S]*?)\. Other/.exec(
        text,
      )?.[1];
    expect(bullet).toBeDefined();
    expect([...bullet.matchAll(/`([a-z-]+)`/g)].map((match) => match[1])).toEqual(TOKEN_PROPERTIES);
    for (const keyword of TOKEN_KEYWORDS) expect(text).toContain(`\`${keyword}\``);
  });
});
