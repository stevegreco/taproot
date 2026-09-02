import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { test } from "node:test";
import { writeBundle } from "../src/compile/bundle.js";
import { openCatalog, KnowledgeBundleError } from "../src/retrieve/index.js";
import { authored, projectFiles, stubIndex, stubManifest, stubRecord } from "./helpers/catalog.js";

const publicDir = join(dirname(fileURLToPath(import.meta.url)), "../dist/public");

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
  assert.equal(fromDefault.info.recordCount > 0, true);
});

test("openCatalog does not export tokenize, createCatalog, or openDefaultCatalog", async () => {
  const retrieve = await import("../src/retrieve/index.js");
  assert.equal("tokenize" in retrieve, false);
  assert.equal("createCatalog" in retrieve, false);
  assert.equal("openDefaultCatalog" in retrieve, false);
});

test("missing directory is bundle-missing", async () => {
  await assert.rejects(() => openCatalog(join(tmpdir(), "knowledge-missing-bundle")), (error) => {
    assert.equal(error instanceof KnowledgeBundleError, true);
    assert.equal(error.code, "bundle-missing");
    return true;
  });
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

test("expectVisibility public rejects an internal fixture", async () => {
  const bundle = await projectFiles({
    "content/alpha.md": authored("content/alpha.md", { id: "component.alpha" }),
    "internal/secret.md": authored("internal/secret.md", {
      id: "internal.secret",
      visibility: "internal",
      type: "guideline",
      relations: { uses: ["component.alpha"] },
    }),
  }, "internal");

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

test("directory hash mismatch is rejected; in-memory open skips the check", async () => {
  const bundle = await projectFiles({
    "content/alpha.md": authored("content/alpha.md", { id: "component.alpha" }),
  });
  const dir = await mkdtemp(join(tmpdir(), "knowledge-hash-"));
  await writeBundle(dir, bundle);

  const tampered = JSON.parse(JSON.stringify(bundle.records));
  tampered[0] = { ...tampered[0], title: `${tampered[0].title} tampered` };
  await writeFile(join(dir, "records.json"), `${JSON.stringify(tampered, null, 2)}\n`);

  await assert.rejects(() => openCatalog(dir), (error) => {
    assert.equal(error.code, "bundle-inconsistent");
    assert.match(error.message, /sha256/);
    return true;
  });

  const catalog = await openCatalog({
    records: tampered,
    searchIndex: bundle.searchIndex,
    manifest: bundle.manifest,
  });
  assert.equal(catalog.get("component.alpha").title.endsWith("tampered"), true);
});
