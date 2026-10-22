/**
 * Verify steps for card.tsx. The heading and link live inside the shadow
 * root, so the naming step reads the browser's accessibility tree with
 * `exposedNodes`.
 */
export default async function verify({ page, step, eventually, exposedNodes }) {
  const cards = page.locator("[data-card-subject]");
  const first = cards.first();
  const share = page.locator("[data-card-share]").first();
  const shared = page.locator("[data-card-shared]");
  const hash = () => page.evaluate(() => location.hash);

  await step("each card's title is a heading and a link named by its label alone", async () => {
    await eventually(() => cards.count(), 3, "card count");
    const named = async (role) =>
      (await exposedNodes())
        .filter((node) => node.role === role)
        .map((node) => node.name)
        .filter((name) => ["Quarterly revenue report", "Hiring plan", "Office move"].includes(name))
        .join(", ");
    await eventually(
      () => named("heading"),
      "Quarterly revenue report, Hiring plan, Office move",
      "headings",
    );
    await eventually(
      () => named("link"),
      "Quarterly revenue report, Hiring plan, Office move",
      "links",
    );
  });

  await step("clicking the summary text opens the card's destination", async () => {
    await page.evaluate(() => history.replaceState(null, "", location.pathname));
    const box = await first.boundingBox();
    // The middle of the card is summary text, covered by the title link's target.
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await eventually(hash, "#project-revenue-report", "location hash");
  });

  await step("Share is its own tab stop and does not open the destination", async () => {
    await page.evaluate(() => history.replaceState(null, "", location.pathname));
    await first.locator('[part="title-link"]').focus();
    await page.keyboard.press("Tab");
    await eventually(
      () => share.evaluate((element) => element.matches(":focus-within")),
      true,
      "Share focused after the title link",
    );
    await page.keyboard.press("Enter");
    await eventually(
      () => shared.textContent(),
      "Copied a link to Quarterly revenue report.",
      "status text",
    );
    await eventually(hash, "", "location hash after Share");
  });

  await step("keyboard focus on the title draws the ring around the whole card", async () => {
    await page.keyboard.press("Shift+Tab");
    await eventually(
      () =>
        first
          .locator('[part="surface"]')
          .evaluate((surface) => getComputedStyle(surface).outlineStyle),
      "solid",
      "surface outline",
    );
  });
}
