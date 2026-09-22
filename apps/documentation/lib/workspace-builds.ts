import { existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const WORKSPACE_BUILD_COMMAND = "pnpm exec turbo run build --filter=documentation";

export class MissingWorkspaceBuildError extends Error {
  readonly packageName: string;
  readonly specifier: string;

  constructor(packageName: string, specifier: string) {
    super(
      `${packageName} has not been built (${specifier} is missing). From the repo root run:\n  ${WORKSPACE_BUILD_COMMAND}`,
    );
    this.name = "MissingWorkspaceBuildError";
    this.packageName = packageName;
    this.specifier = specifier;
  }
}

export function assertSpecifier(specifier: string, packageName: string): string {
  try {
    const resolved = fileURLToPath(import.meta.resolve(specifier));
    if (!existsSync(resolved)) {
      throw new MissingWorkspaceBuildError(packageName, specifier);
    }
    return resolved;
  } catch (error) {
    if (error instanceof MissingWorkspaceBuildError) throw error;
    throw new MissingWorkspaceBuildError(packageName, specifier);
  }
}

/** Every `src/*.css` must have the `dist/*.styles.js` that build-styles.js emits for it. */
function assertComponentStyles(): void {
  const indexSrc = assertSpecifier(
    "@stevegreco/design-system-components",
    "@stevegreco/design-system-components",
  );
  const src = dirname(indexSrc);
  const dist = join(src, "../dist");
  for (const file of readdirSync(src).filter((name) => name.endsWith(".css"))) {
    const styles = file.replace(/\.css$/, ".styles.js");
    if (!existsSync(join(dist, styles))) {
      throw new MissingWorkspaceBuildError(
        "@stevegreco/design-system-components",
        `dist/${styles}`,
      );
    }
  }
}

/** Fail with a turbo command instead of a raw missing-module path. */
export function assertWorkspaceBuilds(): void {
  assertSpecifier("@stevegreco/design-system/tokens/primitives", "@stevegreco/design-system");
  assertSpecifier("@stevegreco/design-system/tokens/semantic-light", "@stevegreco/design-system");
  assertSpecifier("@stevegreco/design-system/flatten", "@stevegreco/design-system");
  assertSpecifier(
    "@stevegreco/design-system-knowledge/manifest",
    "@stevegreco/design-system-knowledge",
  );
  assertComponentStyles();
}
