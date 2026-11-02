import { expect, test } from "vitest";
import { render } from "vitest-browser-react";

// Checks the toolchain before any component exists: React renders in a real browser and the token
// stylesheet resolves.
test("renders React with the token stylesheet loaded", async () => {
  const screen = await render(
    <p style={{ background: "var(--ds-semantic-color-background-action-primary-default)" }}>
      Ready
    </p>,
  );
  const ready = screen.getByText("Ready");
  await expect.element(ready).toBeVisible();
  expect(getComputedStyle(ready.element()).backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
});
