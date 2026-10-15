/**
 * Verify steps for tabs.tsx. The tab list, tabs, and panel live in the shadow root; Playwright's
 * CSS locators pierce it, and names come from the browser's accessibility tree.
 */
export default async function verify({ page, step, eventually, exposedNodes }) {
  const tabs = page.locator("[data-tabs-order]");
  const tab = (name) => tabs.locator('[part="tab"]', { hasText: name });
  const panel = (value) => page.locator(`[data-tabs-panel="${value}"]`);
  const visiblePanels = async () => {
    const shown = [];
    for (const value of ["details", "shipments", "history"]) {
      if (await panel(value).isVisible()) shown.push(value);
    }
    return shown.join(", ");
  };

  await step("only the selected section is shown on load", async () => {
    await eventually(visiblePanels, "details", "visible panels on load");
    await eventually(
      () => tab("Details").getAttribute("aria-selected"),
      "true",
      "Details selected",
    );
  });

  await step("the tab list, its tabs, and the panel are named", async () => {
    const has = async (role, name) =>
      (await exposedNodes()).some((node) => node.role === role && node.name === name);
    await eventually(() => has("tablist", "Order 1042"), true, "tab list named Order 1042");
    for (const name of ["Details", "Shipments", "History"]) {
      await eventually(() => has("tab", name), true, `tab named ${name}`);
    }
    await eventually(() => has("tabpanel", "Details"), true, "panel named by Details");
  });

  await step("clicking a tab shows its section and hides the others", async () => {
    await tab("Shipments").click();
    await eventually(visiblePanels, "shipments", "visible panels after click");
    await eventually(
      () => tab("Details").getAttribute("aria-selected"),
      "false",
      "Details no longer selected",
    );
  });

  await step("arrow keys, Home, and End move the selection", async () => {
    await tab("Shipments").focus();
    await page.keyboard.press("ArrowRight");
    await eventually(visiblePanels, "history", "ArrowRight selects History");
    await page.keyboard.press("ArrowRight");
    await eventually(visiblePanels, "details", "ArrowRight wraps to Details");
    await page.keyboard.press("End");
    await eventually(visiblePanels, "history", "End selects History");
    await page.keyboard.press("Home");
    await eventually(visiblePanels, "details", "Home selects Details");
  });

  await step("Tab moves from the tab list into the panel's content", async () => {
    await tab("Shipments").click();
    await page.keyboard.press("Tab");
    await eventually(
      () => tabs.locator('[part="panel"]').evaluate((node) => node.matches(":focus")),
      true,
      "panel focused",
    );
    await page.keyboard.press("Tab");
    await eventually(
      () => page.locator("[data-tabs-tracking]").evaluate((node) => node.matches(":focus-within")),
      true,
      "Track package link focused",
    );
  });
}
