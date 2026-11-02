import react from "@vitejs/plugin-react";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    name: "react",
    include: ["test/**/*.test.tsx", "bakeoff/**/*.test.tsx"],
    setupFiles: ["test/setup/tokens.ts"],
    // Process the token stylesheet and component styles. Vitest replaces CSS with an empty module
    // unless it is included here.
    css: { include: [/\.css$/] },
    browser: {
      enabled: true,
      headless: true,
      instances: [{ browser: "chromium" }],
      provider: playwright(),
    },
  },
});
