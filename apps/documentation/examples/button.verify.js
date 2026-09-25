/** Verify steps for button.tsx. */
export default async function verify({ page, step, eventually }) {
  const status = page.getByText(/^Saved \d+ times?\.$/);

  await step("the count starts at zero", async () => {
    await eventually(() => status.textContent(), "Saved 0 times.", "click count");
  });

  await step("selecting Save changes counts one save", async () => {
    await page.locator("ds-button", { hasText: "Save changes" }).click();
    await eventually(() => status.textContent(), "Saved 1 time.", "click count");
  });
}
