#!/usr/bin/env node
// Builds the throwaway project the agent works in: the packed packages installed the way
// packages/spec/README.md tells a consumer to, outside this repository so no agent can reach the
// source. Run from the repository root after `pnpm build`:
//   node evals/taproot-usage/setup-project.mjs [dir]

import { execFileSync } from "node:child_process";
import { cpSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
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

const tokenFile = (name) => `node_modules/@taproot-ds/tokens/src/tokens/${name}.tokens.json`;
const tokenSet = (theme) => [
  tokenFile("primitives"),
  tokenFile(`semantic/${theme}`),
  tokenFile("semantic/shape"),
  tokenFile("semantic/typography"),
];

writeFileSync(
  join(project, "spec.config.json"),
  `${JSON.stringify(
    {
      implementations: {
        web: {
          folder: "node_modules/@taproot-ds/web-components/implementation",
          technology: "web-component",
        },
        react: { folder: "react-implementation", technology: "react" },
      },
      constants: {
        "border-width": "semantic.border.width",
        "focus-ring-width": "semantic.focus.width",
        "focus-ring-offset": "semantic.focus.offset",
      },
      tokens: { format: "dtcg", sets: { light: tokenSet("light"), dark: tokenSet("dark") } },
    },
    null,
    2,
  )}\n`,
);

console.log(project);
