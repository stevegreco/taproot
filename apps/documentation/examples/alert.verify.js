/**
 * Verify steps for alert.tsx. The live region role sits inside the shadow
 * root, so the announcing steps read the browser's accessibility tree with
 * `exposedNodes`.
 */
export default async function verify({ page, step, eventually, exposedNodes }) {
  const onload = page.locator("[data-alert-onload]");
  const saved = page.locator("[data-alert-saved]");
  const save = page.locator("[data-alert-save]");
  const liveRoles = async () =>
    (await exposedNodes())
      .filter((node) => node.role === "status" || node.role === "alert")
      .map((node) => node.role)
      .join(", ");

  await step("the alert present on load is shown without being announced", async () => {
    await eventually(() => onload.isVisible(), true, "on-load alert visible");
    await eventually(liveRoles, "", "live regions before saving");
  });

  await step("saving shows a polite status with the outcome", async () => {
    await save.click();
    await eventually(() => saved.isVisible(), true, "saved alert visible");
    await eventually(liveRoles, "status", "live regions after saving");
    await eventually(
      async () => (await exposedNodes()).some((node) => node.name === "Changes saved"),
      true,
      "title in the accessibility tree",
    );
  });

  await step("the dismiss control is a button named Dismiss", async () => {
    await eventually(
      async () =>
        (await exposedNodes()).some((node) => node.role === "button" && node.name === "Dismiss"),
      true,
      "button named Dismiss",
    );
  });

  await step(
    "dismissing by keyboard removes the alert and moves focus to Save settings",
    async () => {
      await saved.locator('[part="dismiss"]').focus();
      await page.keyboard.press("Enter");
      await eventually(() => saved.count(), 0, "saved alerts after dismissal");
      await eventually(
        () => save.evaluate((element) => element.matches(":focus-within")),
        true,
        "Save settings focused",
      );
    },
  );
}
