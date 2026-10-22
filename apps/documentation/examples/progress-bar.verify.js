/**
 * Verify steps for progress-bar.tsx. Progress bar sets its role and name
 * through ElementInternals, which only the browser's accessibility tree
 * reports, so the naming step reads it with `exposedNodes`.
 */
export default async function verify({ page, step, eventually, exposedNodes }) {
  const start = page.locator("[data-progress-bar-start] button");
  const bar = page.locator("[data-progress-bar-subject]");
  const outcome = page.locator("[data-progress-bar-outcome]");

  await step("nothing is uploading before the person asks", async () => {
    await eventually(() => bar.count(), 0, "progress bars before uploading");
  });

  await step("starting the upload shows a bar named for the task, measured in files", async () => {
    await start.click();
    await eventually(() => bar.count(), 1, "progress bars after starting");
    await eventually(() => bar.getAttribute("max"), "4", "progress bar max");
    const named = async () =>
      (await exposedNodes()).some(
        (node) => node.role === "progressbar" && node.name === "Uploading 4 photos",
      );
    await eventually(named, true, "progress indicator named Uploading 4 photos");
  });

  await step("the bar only moves forward as files finish", async () => {
    const seen = [];
    while ((await bar.count()) === 1 && seen.length < 100) {
      const value = await bar.getAttribute("value", { timeout: 200 }).catch(() => null);
      if (value !== null) seen.push(Number(value));
      await page.waitForTimeout(100);
    }
    const backwards = seen.findIndex((value, i) => i > 0 && value < seen[i - 1]);
    if (backwards !== -1) throw new Error(`value went back: ${seen.join(", ")}`);
    if (new Set(seen).size < 2)
      throw new Error(`expected the value to climb, saw ${seen.join(", ")}`);
  });

  await step("the bar goes away and an alert reports the outcome", async () => {
    await eventually(() => bar.count(), 0, "progress bars after uploading");
    await eventually(() => outcome.count(), 1, "outcome alerts");
  });
}
