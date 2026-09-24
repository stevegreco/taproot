/**
 * Verify steps for link.tsx. Anchors live in shadow DOM; Playwright CSS
 * locators pierce open shadow roots, so `ds-link a` reaches the inner anchor.
 */
export default async function verify({ page, step, eventually }) {
  const example = page.locator("[data-link-example]");
  const inline = example.locator("ds-link:not([variant]) a");
  const standalone = example.locator('ds-link[variant="standalone"] a');
  const status = example.locator("[data-link-status]");
  const underline = (anchor) => anchor.evaluate((a) => getComputedStyle(a).textDecorationLine);

  await step("the inline link renders an underlined anchor to #link-adr", async () => {
    await eventually(() => inline.getAttribute("href"), "#link-adr", "inline href");
    await eventually(() => underline(inline), "underline", "inline text-decoration-line");
  });

  await step("the standalone link has no underline at rest", async () => {
    await eventually(() => standalone.getAttribute("href"), "#link-billing", "standalone href");
    await eventually(() => underline(standalone), "none", "standalone text-decoration-line");
  });

  await step("following View billing history reports the destination", async () => {
    await example.getByText("View billing history").click();
    await eventually(() => status.textContent(), "Followed #link-billing.", "[data-link-status]");
  });
}
