export default async function verify({ page, step, eventually }) {
  const form = page.locator("[data-text-area-form]");
  const field = form.locator("[data-text-area-control]");
  const control = field.locator("textarea");
  await step("Empty submission displays a correction", async () => {
    await form.locator('ds-button[type="submit"]').click();
    await eventually(() => control.getAttribute("aria-invalid"), "true", "invalid state");
  });
  await step("Editing clears the error and submits the current value", async () => {
    await control.fill("A shared library\nfor the product team");
    await eventually(() => control.getAttribute("aria-invalid"), null, "cleared invalid state");
    await form.locator('ds-button[type="submit"]').click();
    await eventually(
      () => form.locator("[data-text-area-status]").textContent(),
      "Saved A shared library\nfor the product team.",
      "submitted value",
    );
  });
  await step("Reset restores the initial empty value", async () => {
    await form.locator('ds-button[type="reset"]').click();
    await eventually(() => control.inputValue(), "", "reset value");
  });
}
