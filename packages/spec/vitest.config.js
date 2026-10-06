import { defineProject } from "vitest/config";

export default defineProject({
  test: {
    name: "spec",
    environment: "node",
    include: ["test/**/*.test.js"],
  },
});
