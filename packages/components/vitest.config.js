import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

import { contractCases } from "./test/commands/contract-cases.js";
import { hostElements } from "./test/commands/host-elements.js";

const nodeTests = ["test/mapping-css.test.js", "test/contract-rules.test.js"];

export default defineConfig({
  test: {
    name: "components",
    projects: [
      {
        test: {
          name: "browser",
          include: ["test/**/*.test.js"],
          exclude: nodeTests,
          setupFiles: ["test/setup/tokens.js"],
          // Process the token stylesheet the setup file imports. Vitest
          // replaces CSS with an empty module unless it is included here.
          css: { include: [/tokens\.css$/] },
          browser: {
            enabled: true,
            headless: true,
            instances: [{ browser: "chromium" }],
            provider: playwright(),
            commands: { contractCases, hostElements },
          },
        },
      },
      {
        test: {
          name: "node",
          include: nodeTests,
          environment: "node",
        },
      },
    ],
  },
});
