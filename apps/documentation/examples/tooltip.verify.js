/**
 * Verify steps for tooltip.tsx. The tooltip names each icon-only button through
 * its accessible name, which only the browser's accessibility tree reports, so
 * the naming step reads it with `exposedNodes`. The bubble is a popover, so a
 * step reads whether it is open with `:popover-open`.
 */
export default async function verify({ page, step, eventually, exposedNodes }) {
  const tooltip = (id) => page.locator(`[data-tooltip-subject="${id}"]`);
  const button = (id) => tooltip(id).locator("button");
  const bubble = (id) => tooltip(id).locator('[part~="bubble"]');
  const isOpen = (id) => bubble(id).evaluate((element) => element.matches(":popover-open"));

  await step("each icon-only button is named by its tooltip label", async () => {
    for (const name of ["Rename file", "Download file", "Delete file"]) {
      const named = async () =>
        (await exposedNodes()).some((node) => node.role === "button" && node.name === name);
      await eventually(named, true, `button named ${name}`);
    }
  });

  await step("keyboard focus shows the label at once, above the button", async () => {
    await button("rename").focus();
    await page.keyboard.press("Tab");
    await eventually(() => isOpen("download"), true, "Download bubble open");
    await eventually(() => bubble("download").textContent(), "Download file", "bubble text");
    const [trigger, box] = await Promise.all([
      button("download").boundingBox(),
      bubble("download").boundingBox(),
    ]);
    if (!(box.y + box.height <= trigger.y)) {
      throw new Error(
        `expected the bubble above the button, bubble ends at ${box.y + box.height}, button starts at ${trigger.y}`,
      );
    }
  });

  await step("Escape hides the label and leaves focus on the button", async () => {
    await page.keyboard.press("Escape");
    await eventually(() => isOpen("download"), false, "Download bubble open");
    const focused = await button("download").evaluate((element) => element.matches(":focus"));
    if (!focused) throw new Error("expected focus to stay on the Download button");
  });

  await step("pointing at a button shows its label, and moving away hides it", async () => {
    await button("rename").hover();
    await eventually(() => isOpen("rename"), true, "Rename bubble open");
    await page.locator("[data-tooltip-row] > span").first().hover();
    await eventually(() => isOpen("rename"), false, "Rename bubble open");
  });

  await step("activating a button closes its label", async () => {
    await button("rename").hover();
    await eventually(() => isOpen("rename"), true, "Rename bubble open");
    await button("rename").click();
    await eventually(() => page.getByRole("status").textContent(), "Rename file…", "status");
    await eventually(() => isOpen("rename"), false, "Rename bubble open after the click");
  });
}
