import { defineProject } from "vitest/config";

export default defineProject({
  test: {
    name: "documentation",
    environment: "node",
    include: ["test/**/*.test.ts"],
    setupFiles: ["./test/setup-workspace-builds.ts"],
  },
});
