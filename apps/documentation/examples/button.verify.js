/** Verify steps for button.tsx. */
export default async function verify({ page, step, eventually }) {
  const status = page.getByText(/^Primary button clicked/);

  await step("the count starts at zero", async () => {
    await eventually(() => status.textContent(), "Primary button clicked 0 times.", "click count");
  });

  await step("selecting Primary counts one click", async () => {
    await page.locator("ds-button", { hasText: "Primary" }).click();
    await eventually(() => status.textContent(), "Primary button clicked 1 time.", "click count");
  });
}
