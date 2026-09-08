import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "browser",
          include: ["test/**/*.test.js"],
          exclude: ["test/mapping-css.test.js"],
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
          name: "node",
          include: ["test/mapping-css.test.js"],
          environment: "node",
        },
      },
    ],
  },
});
