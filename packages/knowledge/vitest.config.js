import { defineProject } from "vitest/config";

export default defineProject({
  test: {
    name: "knowledge",
    environment: "node",
    include: ["test/**/*.test.js"],
  },
});
