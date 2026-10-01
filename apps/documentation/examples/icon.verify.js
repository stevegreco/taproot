/**
 * Verify steps for icon.tsx. Icon sets its role and name through
 * ElementInternals, which only the browser's accessibility tree reports, so the
 * labeled-icon step reads it over CDP.
 */
export default async function verify({ page, step, eventually }) {
  const example = page.locator("[data-icon-example]");
  const color = (locator) => locator.evaluate((element) => getComputedStyle(element).color);
  const side = (locator) =>
    locator.evaluate((element) => {
      const { width, height } = element.getBoundingClientRect();
      return width === height ? `${width}px square` : `${width}x${height}`;
    });

  await step("decorative icons add nothing to the button's accessible name", async () => {
    await eventually(
      () => page.getByRole("button", { name: "Delete project", exact: true }).count(),
      1,
      "buttons named exactly Delete project",
    );
  });

  await step("the labeled icon is announced as an image named Warning", async () => {
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Accessibility.enable");
    const named = async () => {
      const { nodes } = await cdp.send("Accessibility.getFullAXTree");
      return nodes.some(
        (node) => !node.ignored && node.role?.value === "image" && node.name?.value === "Warning",
      );
    };
    await eventually(named, true, "image named Warning in the accessibility tree");
  });

  await step("an icon in a disabled button takes the disabled text color", async () => {
    const button = example.locator("[data-icon-disabled] button");
    const icon = example.locator("[data-icon-disabled] ds-icon");
    await eventually(
      async () => (await color(icon)) === (await color(button)),
      true,
      "colors match",
    );
  });

  await step("an icon in a link follows the link's color on hover", async () => {
    const link = example.locator("[data-icon-link]");
    const anchor = link.locator("a");
    const icon = link.locator("ds-icon");
    const rest = await color(icon);
    await anchor.hover();
    await eventually(
      async () => (await color(icon)) === (await color(anchor)),
      true,
      "colors match",
    );
    await eventually(async () => (await color(icon)) !== rest, true, "icon color changed on hover");
  });

  await step("small, medium, and large render 16, 20, and 24 pixel squares", async () => {
    const icons = example.locator("[data-icon-sizes] ds-icon");
    await eventually(() => side(icons.nth(0)), "16px square", "small");
    await eventually(() => side(icons.nth(1)), "20px square", "medium");
    await eventually(() => side(icons.nth(2)), "24px square", "large");
  });
}
