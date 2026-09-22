/**
 * Verify steps for text-field.tsx. The label, hint, error, and input live in
 * shadow DOM; Playwright CSS locators pierce open shadow roots.
 */
export default async function verify({ page, step, eventually }) {
  const form = page.locator("[data-text-field-form]");
  const status = form.locator("[data-text-field-status]");
  const input = form.locator("ds-text-field input");
  const error = form.locator('ds-text-field [part="error"]');
  const submit = () => form.locator("ds-button", { hasText: "Continue" }).click();

  await step("submitting an empty email shows the field error", async () => {
    await submit();
    await eventually(() => status.textContent(), "Submit an email to continue.", "status");
    await eventually(
      () => error.textContent(),
      "Enter an email address with an @ sign.",
      "field error",
    );
  });

  await step("submitting ada@example.com reports it", async () => {
    await input.fill("ada@example.com");
    await submit();
    await eventually(() => status.textContent(), "Submitted ada@example.com.", "status");
  });
}
