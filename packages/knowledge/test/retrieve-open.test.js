import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { test } from "node:test";
import { writeBundle } from "../src/compile/bundle.js";
import { sha256Hex } from "../src/compile/digest.js";
import { openCatalog, KnowledgeBundleError } from "../src/retrieve/index.js";
import { authored, projectFiles, stubIndex, stubManifest, stubRecord } from "./helpers/catalog.js";

const publicDir = join(dirname(fileURLToPath(import.meta.url)), "../dist/public");

test("importing retrieval does not load Ajv", () => {
  execFileSync(process.execPath, [
    "--input-type=module",
    "-e",
    `
    import assert from "node:assert/strict";
    import { createRequire } from "node:module";
    await import(${JSON.stringify(new URL("../src/retrieve/index.js", import.meta.url).href)});
    const require = createRequire(import.meta.url);
    assert.equal(Object.keys(require.cache).some(path => path.includes("/ajv/")), false);
  `,
  ]);
});

for (const field of ["schemaVersion", "compiledSchemaVersion"]) {
  test(`manifest ${field} takes precedence over record validation`, async () => {
    const record = stubRecord("fixture.future", { [field]: 99 });
    const manifest = stubManifest(1);
    manifest.content[field] = 99;
    await assert.rejects(
      () => openCatalog({ records: [record], searchIndex: stubIndex([record]), manifest }),
      {
        name: "KnowledgeBundleError",
        code: "unsupported-schema-version",
      },
    );
  });
}

for (const value of [() => 1, Symbol("invalid")]) {
  test(`non-cloneable ${typeof value} is a bundle-invalid error`, async () => {
    const record = stubRecord("fixture.invalid", { extra: value });
    await assert.rejects(
      () =>
        openCatalog({
          records: [record],
          searchIndex: stubIndex([record]),
          manifest: stubManifest(1),
        }),
      {
        name: "KnowledgeBundleError",
        code: "bundle-invalid",
      },
    );
  });
}

test("openCatalog accepts default, path, URL, and in-memory sources", async () => {
  const fromDefault = await openCatalog();
  const fromPath = await openCatalog(publicDir);
  const fromUrl = await openCatalog(pathToFileURL(publicDir));
  const fromMemory = await openCatalog({
    records: JSON.parse(await readFile(join(publicDir, "records.json"), "utf8")),
    searchIndex: JSON.parse(await readFile(join(publicDir, "search-index.json"), "utf8")),
    manifest: JSON.parse(await readFile(join(publicDir, "manifest.json"), "utf8")),
  });

  assert.equal(fromDefault.info.digest, fromPath.info.digest);
  assert.equal(fromDefault.info.digest, fromUrl.info.digest);
  assert.equal(fromDefault.info.digest, fromMemory.info.digest);
  assert.equal(fromDefault.info.visibility, "public");
  assert.equal(fromDefault.info.compiledSchemaVersion, 3);
  assert.equal(fromDefault.info.recordCount, 8);
});

test("openCatalog does not export tokenize, createCatalog, or openDefaultCatalog", async () => {
  const retrieve = await import("../src/retrieve/index.js");
  assert.equal("tokenize" in retrieve, false);
  assert.equal("createCatalog" in retrieve, false);
  assert.equal("openDefaultCatalog" in retrieve, false);
});

test("missing directory is bundle-missing", async () => {
  await assert.rejects(
    () => openCatalog(join(tmpdir(), "knowledge-missing-bundle")),
    (error) => {
      assert.equal(error instanceof KnowledgeBundleError, true);
      assert.equal(error.code, "bundle-missing");
      return true;
    },
  );
});

test("unsupported search index version is rejected", async () => {
  const records = [stubRecord("fixture.alpha")];
  await assert.rejects(
    () =>
      openCatalog({
        records,
        searchIndex: { version: 2, records: ["fixture.alpha"], terms: {} },
        manifest: stubManifest(1),
      }),
    (error) => {
      assert.equal(error.code, "unsupported-index-version");
      return true;
    },
  );
});

test("search index naming an id not in records is bundle-inconsistent", async () => {
  const records = [stubRecord("fixture.alpha")];
  await assert.rejects(
    () =>
      openCatalog({
        records,
        searchIndex: { version: 1, records: ["fixture.alpha", "fixture.ghost"], terms: {} },
        manifest: stubManifest(1),
      }),
    (error) => {
      assert.equal(error.code, "bundle-inconsistent");
      return true;
    },
  );
});

test("search index omitting a record is bundle-inconsistent", async () => {
  const records = [stubRecord("fixture.alpha"), stubRecord("fixture.beta")];
  await assert.rejects(
    () =>
      openCatalog({
        records,
        searchIndex: { version: 1, records: ["fixture.alpha"], terms: {} },
        manifest: stubManifest(2),
      }),
    (error) => {
      assert.equal(error instanceof KnowledgeBundleError, true);
      assert.equal(error.code, "bundle-inconsistent");
      assert.match(error.message, /fixture\.beta/);
      return true;
    },
  );
});

test("search index repeating a record is bundle-inconsistent", async () => {
  const records = [stubRecord("fixture.alpha"), stubRecord("fixture.beta")];
  await assert.rejects(
    () =>
      openCatalog({
        records,
        searchIndex: {
          version: 1,
          records: ["fixture.alpha", "fixture.beta", "fixture.alpha"],
          terms: {},
        },
        manifest: stubManifest(2),
      }),
    (error) => {
      assert.equal(error instanceof KnowledgeBundleError, true);
      assert.equal(error.code, "bundle-inconsistent");
      assert.match(error.message, /fixture\.alpha/);
      return true;
    },
  );
});

test("search index may list records in a different order", async () => {
  const alpha = stubRecord("fixture.alpha");
  const beta = stubRecord("fixture.beta");
  const catalog = await openCatalog({
    records: [alpha, beta],
    searchIndex: { version: 1, records: ["fixture.beta", "fixture.alpha"], terms: {} },
    manifest: stubManifest(2),
  });
  assert.deepEqual(
    catalog.list().map((record) => record.id),
    ["fixture.alpha", "fixture.beta"],
  );
});

test("dangling relation is bundle-inconsistent", async () => {
  const records = [stubRecord("fixture.alpha", { relations: { uses: ["fixture.missing"] } })];
  await assert.rejects(
    () =>
      openCatalog({
        records,
        searchIndex: stubIndex(records),
        manifest: stubManifest(1),
      }),
    (error) => {
      assert.equal(error.code, "bundle-inconsistent");
      assert.match(error.message, /fixture.missing/);
      return true;
    },
  );
});

test("expectVisibility internal accepts a declared internal bundle of public records", async () => {
  const bundle = await projectFiles(
    {
      "content/alpha.md": authored("content/alpha.md", { id: "component.alpha" }),
    },
    "internal",
  );

  assert.equal(bundle.manifest.content.visibility, "internal");
  assert.ok(bundle.records.every((record) => record.visibility === "public"));

  const catalog = await openCatalog(
    { records: bundle.records, searchIndex: bundle.searchIndex, manifest: bundle.manifest },
    { expectVisibility: "internal" },
  );
  assert.equal(catalog.info.visibility, "internal");
});

test("expectVisibility public rejects a declared internal bundle of public records", async () => {
  const bundle = await projectFiles(
    {
      "content/alpha.md": authored("content/alpha.md", { id: "component.alpha" }),
    },
    "internal",
  );

  await assert.rejects(
    () =>
      openCatalog(
        { records: bundle.records, searchIndex: bundle.searchIndex, manifest: bundle.manifest },
        { expectVisibility: "public" },
      ),
    (error) => {
      assert.equal(error.code, "projection-mismatch");
      assert.match(error.message, /declared internal/);
      return true;
    },
  );
});

test("missing manifest visibility is bundle-invalid", async () => {
  const records = [stubRecord("fixture.alpha")];
  const manifest = stubManifest(1);
  delete manifest.content.visibility;

  await assert.rejects(
    () =>
      openCatalog({
        records,
        searchIndex: stubIndex(records),
        manifest,
      }),
    (error) => {
      assert.equal(error.code, "bundle-invalid");
      assert.match(error.message, /visibility/);
      return true;
    },
  );
});

test("expectVisibility public rejects an internal fixture", async () => {
  const bundle = await projectFiles(
    {
      "content/alpha.md": authored("content/alpha.md", { id: "component.alpha" }),
      "internal/secret.md": authored("internal/secret.md", {
        id: "internal.secret",
        visibility: "internal",
        type: "guideline",
        relations: { uses: ["component.alpha"] },
      }),
    },
    "internal",
  );

  await assert.rejects(
    () =>
      openCatalog(
        { records: bundle.records, searchIndex: bundle.searchIndex, manifest: bundle.manifest },
        { expectVisibility: "public" },
      ),
    (error) => {
      assert.equal(error.code, "projection-mismatch");
      assert.match(error.message, /internal.secret/);
      return true;
    },
  );
});

test("returned records are deep-frozen", async () => {
  const catalog = await openCatalog();
  const record = catalog.get("component.button");
  assert.equal(Object.isFrozen(record), true);
  assert.equal(Object.isFrozen(record.tags), true);
  assert.equal(Object.isFrozen(record.relations), true);
  assert.throws(() => {
    record.tags.push("mutated");
  }, TypeError);
});

test("in-memory catalog owns its frozen records without freezing caller data", async () => {
  const original = stubRecord("fixture.alpha");
  const catalog = await openCatalog({
    records: [original],
    searchIndex: stubIndex([original]),
    manifest: stubManifest(1),
  });
  const record = catalog.get(original.id);
  assert.notEqual(record, original);
  assert.equal(Object.isFrozen(original), false);
  assert.equal(Object.isFrozen(original.tags), false);
  assert.equal(Object.isFrozen(record.tags), true);
  original.tags.push("changed");
  original.title = "Changed title";
  assert.deepEqual(record.tags, ["fixture"]);
  assert.equal(record.title, "Title");
});

for (const [field, value] of [
  ["jobs", ["unknown"]],
  ["tags", [42]],
  ["title", 42],
  ["visibility", "unknown"],
  ["schemaVersion", 99],
  ["compiledSchemaVersion", 99],
  ["sources", []],
  ["relations", { uses: "fixture.alpha" }],
  ["unexpected", true],
]) {
  test(`retrieval validates compiled record shape: ${field}`, async () => {
    const record = stubRecord("fixture.alpha", { [field]: value });
    await assert.rejects(
      () =>
        openCatalog({
          records: [record],
          searchIndex: stubIndex([record]),
          manifest: stubManifest(1),
        }),
      (error) => {
        assert.equal(error instanceof KnowledgeBundleError, true);
        assert.equal(error.code, "bundle-invalid");
        assert.match(error.message, /fixture\.alpha/);
        return true;
      },
    );
  });
}

test("in-memory records must include compiled provenance", async () => {
  const record = stubRecord("fixture.alpha");
  delete record.sources;
  await assert.rejects(
    () =>
      openCatalog({
        records: [record],
        searchIndex: stubIndex([record]),
        manifest: stubManifest(1),
      }),
    { code: "bundle-invalid" },
  );
});

test("directory hash mismatch is rejected; in-memory open skips the check", async () => {
  const bundle = await projectFiles({
    "content/alpha.md": authored("content/alpha.md", { id: "component.alpha" }),
  });
  const dir = await mkdtemp(join(tmpdir(), "knowledge-hash-"));
  await writeBundle(dir, bundle);

  const tampered = JSON.parse(JSON.stringify(bundle.records));
  tampered[0] = { ...tampered[0], title: `${tampered[0].title} tampered` };
  await writeFile(join(dir, "records.json"), `${JSON.stringify(tampered, null, 2)}\n`);

  await assert.rejects(
    () => openCatalog(dir),
    (error) => {
      assert.equal(error.code, "bundle-inconsistent");
      assert.match(error.message, /sha256/);
      return true;
    },
  );

  const catalog = await openCatalog({
    records: tampered,
    searchIndex: bundle.searchIndex,
    manifest: bundle.manifest,
  });
  assert.equal(catalog.get("component.alpha").title.endsWith("tampered"), true);
});

test("matching directory hashes do not bypass record validation", async () => {
  const bundle = await projectFiles({
    "content/alpha.md": authored("content/alpha.md", { id: "component.alpha" }),
  });
  const dir = await mkdtemp(join(tmpdir(), "knowledge-invalid-record-"));
  await writeBundle(dir, bundle);
  const records = structuredClone(bundle.records);
  records[0].jobs = ["unknown"];
  const bytes = Buffer.from(JSON.stringify(records));
  const manifest = structuredClone(bundle.manifest);
  const entry = manifest.content.files.find((file) => file.path === "records.json");
  entry.sha256 = sha256Hex(bytes);
  entry.bytes = bytes.byteLength;
  await writeFile(join(dir, "records.json"), bytes);
  await writeFile(join(dir, "manifest.json"), JSON.stringify(manifest));
  await assert.rejects(() => openCatalog(dir), { code: "bundle-invalid" });
});

test("authored helper keeps caller-supplied sources", () => {
  const markdown = authored("content/a.md", {
    id: "component.a",
    sources: [
      { kind: "authored", path: "content/a.md" },
      { kind: "adr", path: "docs/adr/0001.md" },
    ],
  });
  assert.match(markdown, /kind: adr/);
  assert.match(markdown, /docs\/adr\/0001\.md/);
});

test("in-memory record missing jobs is bundle-invalid", async () => {
  const record = stubRecord("fixture.alpha");
  delete record.jobs;

  await assert.rejects(
    () =>
      openCatalog({
        records: [record],
        searchIndex: stubIndex([record]),
        manifest: stubManifest(1),
      }),
    (error) => {
      assert.equal(error instanceof KnowledgeBundleError, true);
      assert.equal(error.code, "bundle-invalid");
      assert.match(error.message, /fixture\.alpha/);
      return true;
    },
  );
});

test("in-memory record missing tags is bundle-invalid", async () => {
  const record = stubRecord("fixture.alpha");
  delete record.tags;

  await assert.rejects(
    () =>
      openCatalog({
        records: [record],
        searchIndex: stubIndex([record]),
        manifest: stubManifest(1),
      }),
    (error) => {
      assert.equal(error instanceof KnowledgeBundleError, true);
      assert.equal(error.code, "bundle-invalid");
      assert.match(error.message, /fixture\.alpha/);
      return true;
    },
  );
});
