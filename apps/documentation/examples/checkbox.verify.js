/**
 * Verify steps for checkbox.tsx. The label, box, hint, and error live in
 * shadow DOM; Playwright CSS locators pierce open shadow roots.
 */
export default async function verify({ page, step, eventually }) {
  const form = page.locator("[data-checkbox-form]");
  const status = form.locator("[data-checkbox-status]");
  const all = form.locator("ds-checkbox[data-checkbox-all]");
  const push = form.locator('ds-checkbox[value="push"]');
  const terms = form.locator('ds-checkbox[name="terms"]');
  const submit = () => form.locator("ds-button", { hasText: "Continue" }).click();

  await step("the parent checkbox is indeterminate while only some channels are on", async () => {
    await eventually(
      () => all.locator("input").evaluate((input) => input.indeterminate),
      true,
      "parent indeterminate",
    );
  });

  await step("submitting without the terms shows the error", async () => {
    await submit();
    await eventually(
      () => terms.locator('[part="error"]').textContent(),
      "Agree to the terms to continue.",
      "terms error",
    );
  });

  await step(
    "checking push by its label and agreeing to the terms submits both channels",
    async () => {
      await push.locator("label").click();
      await terms.locator("label").click();
      await submit();
      await eventually(() => status.textContent(), "Saved: email, push.", "status");
    },
  );
}
