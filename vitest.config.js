import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      "packages/*",
      "apps/*",
      // The eval graders' tests. The evals themselves call a model and never run in tests.
      { test: { name: "evals", include: ["evals/**/test/**/*.test.js"] } },
    ],
  },
});
