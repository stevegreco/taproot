#!/usr/bin/env node
// Builds the throwaway project the agent works in: the packed packages installed the way
// packages/spec/README.md tells a consumer to, outside this repository so no agent can reach the
// source. Run from the repository root after `pnpm build`:
//   node evals/taproot-usage/setup-project.mjs [dir]

import { execFileSync } from "node:child_process";
import { cpSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const project = resolve(process.argv[2] ?? join(tmpdir(), "taproot-eval-project"));
const tarballs = join(project, ".tarballs");

rmSync(project, { recursive: true, force: true });
mkdirSync(tarballs, { recursive: true });

for (const name of ["@taproot-ds/tokens", "@taproot-ds/web-components", "@taproot-ds/spec"]) {
  execFileSync("pnpm", ["--filter", name, "pack", "--pack-destination", tarballs], {
    stdio: "ignore",
  });
}

writeFileSync(
  join(project, "package.json"),
  `${JSON.stringify({ name: "taproot-eval-project", private: true }, null, 2)}\n`,
);
execFileSync("pnpm", ["add", "-D", ...readdirSync(tarballs).map((file) => join(tarballs, file))], {
  cwd: project,
  stdio: "ignore",
});

// The React package is private and cannot be installed, so copy only its mapping files.
cpSync("packages/react/implementation", join(project, "react-implementation"), { recursive: true });

// The eval project's config is the repository's, with each path moved to where the project has that
// file, so the two cannot drift apart. A consumer reads the spec content from the installed
// package, so `content` is dropped. A path this map does not cover stops the setup.
const PATHS = {
  "packages/components/implementation": "node_modules/@taproot-ds/web-components/implementation",
  "packages/react/implementation": "react-implementation",
  "packages/tokens/": "node_modules/@taproot-ds/tokens/",
};
function projectPath(path) {
  const from = Object.keys(PATHS).find((prefix) => path.startsWith(prefix));
  if (!from)
    throw new Error(`setup-project.mjs: no eval project path for ${path} in spec.config.json`);
  return PATHS[from] + path.slice(from.length);
}
const config = JSON.parse(readFileSync("spec.config.json", "utf8"));
delete config.$schema;
delete config.content;
for (const implementation of Object.values(config.implementations ?? {}))
  implementation.folder = projectPath(implementation.folder);
for (const [theme, files] of Object.entries(config.tokens?.sets ?? {}))
  config.tokens.sets[theme] = files.map(projectPath);
writeFileSync(join(project, "spec.config.json"), `${JSON.stringify(config, null, 2)}\n`);

console.log(project);
