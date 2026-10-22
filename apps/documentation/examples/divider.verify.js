/**
 * Verify steps for divider.tsx. Divider sets its role through ElementInternals,
 * which only the browser's accessibility tree reports, so the first step reads
 * it with `exposedNodes`.
 */
export default async function verify({ page, step, eventually, exposedNodes }) {
  const sections = page.locator('[data-divider-subject="sections"]');
  const actions = page.locator('[data-divider-subject="actions"]');
  const actionRow = page.locator("[data-divider-actions]");
  const box = async (locator) => {
    const { width, height } = await locator.boundingBox();
    return { width: Math.round(width), height: Math.round(height) };
  };

  await step("both dividers are announced as unnamed separators", async () => {
    const separators = async () =>
      (await exposedNodes())
        .filter((node) => node.role === "separator")
        .map((node) => node.name)
        .join(",");
    await eventually(separators, ",", "separator names");
  });

  await step("the horizontal divider is a one-pixel line across the card's sections", async () => {
    const paragraph = page.locator("ds-card p").first();
    await eventually(async () => (await box(sections)).height, 1, "line thickness");
    await eventually(
      async () => (await box(sections)).width,
      (await box(paragraph)).width,
      "line width against the section width",
    );
  });

  await step("the vertical divider spans the height of the action row", async () => {
    await eventually(async () => (await box(actions)).width, 1, "line thickness");
    await eventually(
      async () => (await box(actions)).height,
      (await box(actionRow)).height,
      "line height against the row height",
    );
  });

  await step("keyboard focus moves from one action to the next, past the divider", async () => {
    await page.locator("ds-button", { hasText: "Change plan" }).locator("button").focus();
    await page.keyboard.press("Tab");
    await eventually(
      () => page.evaluate(() => document.activeElement?.textContent?.trim()),
      "Download invoice",
      "focused action",
    );
  });
}
