export default async function verify({ page, step, eventually }) {
  const control = page.locator("[data-switch-control]");
  const status = page.locator("[data-switch-status]");
  await step("label activation immediately applies the setting", async () => {
    await control.locator("label").click();
    await eventually(() => status.textContent(), "Notifications on.", "setting on");
  });
  await step("Space turns the setting off", async () => {
    await control.locator("input").focus();
    await page.keyboard.press("Space");
    await eventually(() => status.textContent(), "Notifications off.", "setting off");
  });
  await step("disabled setting remains on", async () => {
    await eventually(
      () => page.locator("[data-switch-disabled] input").isDisabled(),
      true,
      "disabled setting",
    );
    await eventually(
      () => page.locator("[data-switch-disabled] input").isChecked(),
      true,
      "disabled state",
    );
  });
}
