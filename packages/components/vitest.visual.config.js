import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

// Screenshots differ between operating systems, so this runs on its own, not in
// `pnpm test`. CI on Linux compares against the committed references.
export default defineConfig({
  test: {
    name: "visual",
    include: ["visual/**/*.test.js"],
    setupFiles: ["test/setup/tokens.js"],
    css: { include: [/tokens\.css$/] },
    browser: {
      enabled: true,
      headless: true,
      viewport: { width: 800, height: 600 },
      instances: [{ browser: "chromium" }],
      provider: playwright(),
      expect: {
        toMatchScreenshot: {
          comparatorName: "pixelmatch",
          // Strict enough to catch a one-step change to a quiet color, such as
          // a subtle border.
          comparatorOptions: { threshold: 0.01, includeAA: true, allowedMismatchedPixels: 0 },
          screenshotOptions: { animations: "disabled" },
        },
      },
    },
  },
});
