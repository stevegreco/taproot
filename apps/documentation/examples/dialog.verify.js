export default async function verify({ page, step, eventually }) {
  const host = page.locator("[data-dialog-example]");
  const trigger = page.locator("[data-dialog-trigger]");
  const surface = host.locator("dialog");
  await step("opening a confirmation focuses its visible title", async () => {
    await trigger.click();
    await eventually(
      () => surface.evaluate((element) => element.matches(":modal")),
      true,
      "modal open",
    );
    await eventually(
      () => host.evaluate((element) => element.shadowRoot.activeElement?.getAttribute("part")),
      "title",
      "title focus",
    );
  });
  await step("Escape cancels and restores focus to the opener", async () => {
    await page.keyboard.press("Escape");
    await eventually(() => surface.evaluate((element) => element.open), false, "closed");
    await eventually(
      () => trigger.evaluate((element) => element.shadowRoot.activeElement?.tagName),
      "BUTTON",
      "opener focus",
    );
  });
  await step("the explicit action completes the task and closes", async () => {
    await trigger.click();
    await host.locator("[data-dialog-confirm]").click();
    await eventually(
      () => page.locator("[data-dialog-status]").textContent(),
      "Archived project deleted.",
      "completed task",
    );
    await eventually(
      () => surface.evaluate((element) => element.open),
      false,
      "closed after completion",
    );
  });
}
