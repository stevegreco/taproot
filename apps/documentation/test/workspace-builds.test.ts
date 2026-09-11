import assert from "node:assert/strict";
import { test } from "vitest";
import {
  MissingWorkspaceBuildError,
  assertSpecifier,
  assertWorkspaceBuilds,
} from "../lib/workspace-builds";

test("a missing specifier names the package and the turbo build command", () => {
  assert.throws(
    () => assertSpecifier("@stevegreco/design-system/does-not-exist", "@stevegreco/design-system"),
    (error: unknown) => {
      assert.equal(error instanceof MissingWorkspaceBuildError, true);
      const missing = error as MissingWorkspaceBuildError;
      assert.equal(missing.packageName, "@stevegreco/design-system");
      assert.equal(missing.specifier, "@stevegreco/design-system/does-not-exist");
      assert.match(missing.message, /@stevegreco\/design-system has not been built/);
      assert.match(missing.message, /pnpm exec turbo run build --filter=documentation/);
      return true;
    },
  );
});

test("assertWorkspaceBuilds succeeds when workspace packages are built", () => {
  assert.doesNotThrow(() => assertWorkspaceBuilds());
});
