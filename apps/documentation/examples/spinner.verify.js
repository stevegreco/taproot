/**
 * Verify steps for spinner.tsx. Spinner sets its role and name through
 * ElementInternals, which only the browser's accessibility tree reports, so the
 * naming step reads it with `exposedNodes`.
 */
export default async function verify({ page, step, eventually, exposedNodes }) {
  const load = page.locator("[data-spinner-load] button");
  const region = page.locator("[data-spinner-region]");
  const spinner = page.locator("[data-spinner-subject]");
  const outcome = page.locator("[data-spinner-outcome]");

  await step("nothing is loading before the person asks", async () => {
    await eventually(() => spinner.count(), 0, "spinners before loading");
    await eventually(() => region.getAttribute("aria-busy"), "false", "region aria-busy");
  });

  await step("a short wait shows no spinner, but the region is busy at once", async () => {
    await load.click();
    await eventually(() => region.getAttribute("aria-busy"), "true", "region aria-busy");
    // The spinner is held back for a second, so it is still absent right after the click. Read it
    // once: polling for zero would also pass for a spinner that showed at once and then left.
    const count = await spinner.count();
    if (count !== 0) throw new Error(`expected no spinner right after the click, found ${count}`);
  });

  await step("a longer wait shows a spinner named for what is loading", async () => {
    await eventually(() => spinner.count(), 1, "spinners after a second");
    const named = async () =>
      (await exposedNodes()).some(
        (node) => node.role === "progressbar" && node.name === "Loading comments",
      );
    await eventually(named, true, "progress indicator named Loading comments");
  });

  await step("the spinner goes away and an alert reports the outcome", async () => {
    await eventually(() => spinner.count(), 0, "spinners after loading");
    await eventually(() => page.locator("[data-spinner-comments] li").count(), 3, "comments");
    await eventually(() => outcome.count(), 1, "outcome alerts");
    await eventually(() => region.getAttribute("aria-busy"), "false", "region aria-busy");
  });
}
