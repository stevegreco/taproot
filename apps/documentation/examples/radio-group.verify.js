export default async function verify({ page, step, eventually }) {
  const form = page.locator("[data-radio-group-form]");
  const group = form.locator("[data-radio-group-control]");
  await step("arrow keys select one enabled option", async () => {
    await group.locator('input[value="standard"]').focus();
    await page.keyboard.press("ArrowDown");
    await eventually(
      () => group.locator('input[value="express"]').isChecked(),
      true,
      "express selected",
    );
    await eventually(
      () => group.locator('input[value="standard"]').isChecked(),
      false,
      "standard cleared",
    );
  });
  await step("form submission records one value", async () => {
    await form.locator('ds-button[type="submit"]').click();
    await eventually(
      () => form.locator("[data-radio-group-status]").textContent(),
      "Saved: express.",
      "saved selection",
    );
  });
  await step("reset restores the initial value", async () => {
    await form.locator('ds-button[type="reset"]').click();
    await eventually(
      () => group.locator('input[value="standard"]').isChecked(),
      true,
      "reset selection",
    );
    await eventually(
      () => group.locator('input[value="pickup"]').isDisabled(),
      true,
      "disabled option",
    );
  });
}
