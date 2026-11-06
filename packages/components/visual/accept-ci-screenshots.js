/**
 * Make the screenshots from a failed CI run the new references. CI runs on
 * Linux, so its screenshots can't be produced on another operating system.
 *
 *   node visual/accept-ci-screenshots.js [run-id]
 *
 * Without a run id, this uses the latest CI run on the current branch. Review
 * the diff images in the run's artifact first.
 */
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const gh = (...args) => execFileSync("gh", args, { encoding: "utf8" }).trim();

const branch = execFileSync("git", ["branch", "--show-current"], { encoding: "utf8" }).trim();
const runId =
  process.argv[2] ??
  gh(
    ..."run list --workflow CI --limit 1 --json databaseId --jq .[0].databaseId".split(" "),
    "--branch",
    branch,
  );

const download = mkdtempSync(join(tmpdir(), "visual-screenshots-"));
const references = join(dirname(fileURLToPath(import.meta.url)), "__screenshots__/gallery.test.js");
mkdirSync(references, { recursive: true });

try {
  gh("run", "download", runId, "--name", "visual-screenshots", "--dir", download);
  const files = readdirSync(download, { recursive: true }).filter((file) => file.endsWith(".png"));

  // A missing reference arrives as -reference. A mismatch arrives as -actual,
  // beside the old -reference, so -actual is copied last and wins.
  for (const kind of ["reference", "actual"]) {
    for (const file of files.filter((name) => name.includes(`-${kind}-`))) {
      const name = file.split("/").at(-1).replace(`-${kind}-`, "-");
      copyFileSync(join(download, file), join(references, name));
    }
  }
  console.log(`Accepted screenshots from run ${runId}. Review them, then commit ${references}.`);
} finally {
  rmSync(download, { recursive: true, force: true });
}
