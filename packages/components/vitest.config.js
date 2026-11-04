import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "components",
    projects: [
      {
        test: {
          name: "browser",
          include: ["test/**/*.test.js"],
          setupFiles: ["test/setup/tokens.js"],
          // Process the token stylesheet the setup file imports. Vitest
          // replaces CSS with an empty module unless it is included here.
          css: { include: [/tokens\.css$/] },
          browser: {
            enabled: true,
            headless: true,
            instances: [{ browser: "chromium" }],
            provider: playwright(),
          },
        },
      },
      {
        test: {
          name: "types",
          include: ["test/**/*.test.ts"],
          environment: "node",
        },
      },
    ],
  },
});
