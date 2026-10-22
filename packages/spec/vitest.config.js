import { defineProject } from "vitest/config";

export default defineProject({
  test: {
    name: "spec",
    environment: "node",
    include: ["test/**/*.test.js"],
    // CLI tests spawn the CLI several times each, and every spawn reads the whole corpus. On a
    // shared CI runner one test can pass the 5 second default as records are added.
    testTimeout: 20_000,
  },
});
