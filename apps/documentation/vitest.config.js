import { defineProject } from "vitest/config";

export default defineProject({
  test: {
    name: "documentation",
    environment: "node",
    include: ["test/**/*.test.ts"],
  },
});
