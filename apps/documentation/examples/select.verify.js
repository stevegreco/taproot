export default async function verify({ page, step, eventually }) {
  const form = page.locator("[data-select-form]");
  const field = form.locator("[data-select-control]");
  const control = field.locator("select");
  await step("Empty submission displays a correction", async () => {
    await form.locator('ds-button[type="submit"]').click();
    await eventually(() => control.getAttribute("aria-invalid"), "true", "invalid state");
  });
  await step("Editing clears the error and submits the current value", async () => {
    await control.selectOption("express");
    await eventually(() => control.getAttribute("aria-invalid"), null, "cleared invalid state");
    await form.locator('ds-button[type="submit"]').click();
    await eventually(
      () => form.locator("[data-select-status]").textContent(),
      "Saved express.",
      "submitted value",
    );
  });
  await step("Reset restores the initial empty value", async () => {
    await form.locator('ds-button[type="reset"]').click();
    await eventually(() => control.inputValue(), "", "reset value");
  });
}
