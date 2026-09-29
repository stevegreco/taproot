import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, readdir, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "vitest";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const packageRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

test("package files allowlist publishes dist/public and src, never dist/internal", async () => {
  const pkg = JSON.parse(await readFile(join(packageRoot, "package.json"), "utf8"));
  assert.deepEqual(pkg.files, ["dist/public", "src"]);
  assert.equal(pkg.files.includes("dist/internal"), false);
  assert.equal(pkg.files.includes("content"), false);
});

test("pnpm pack does not include dist/internal", async () => {
  const destination = await mkdtemp(join(tmpdir(), "knowledge-pack-"));
  await execFileAsync("pnpm", ["pack", "--pack-destination", destination], {
    cwd: packageRoot,
  });
  const tarball = (await readdir(destination)).find((name) => name.endsWith(".tgz"));
  assert.ok(tarball, "expected a packed tarball");
  const { stdout } = await execFileAsync("tar", ["-tzf", join(destination, tarball)]);
  const packed = stdout
    .split("\n")
    .map((entry) => entry.replace(/^package\//, ""))
    .filter(Boolean);
  assert.equal(
    packed.some((path) => path === "dist/internal" || path.startsWith("dist/internal/")),
    false,
    packed.filter((path) => path.startsWith("dist/")).join("\n"),
  );
  assert.ok(packed.some((path) => path === "src/index.js" || path.startsWith("src/")));
  assert.ok(packed.some((path) => path.startsWith("dist/public/")));
  assert.ok(packed.includes("dist/public/schema/knowledge-record.json"));
  assert.ok(packed.includes("dist/public/schema/compiled-knowledge-record.json"));
});
