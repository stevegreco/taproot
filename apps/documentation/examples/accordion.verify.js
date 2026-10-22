/**
 * Verify steps for accordion.tsx. Triggers and panels live in the shadow root; Playwright's CSS
 * locators pierce it, and names come from the browser's accessibility tree.
 */
export default async function verify({ page, step, eventually, exposedNodes }) {
  const accordion = page.locator("[data-accordion-subject]");
  const trigger = (name) => accordion.locator('[part="trigger"]', { hasText: name });
  const section = (value) => page.locator(`[data-accordion-section="${value}"]`);
  const visibleSections = async () => {
    const shown = [];
    for (const value of ["delivery", "returns", "warranty"]) {
      if (await section(value).isVisible()) shown.push(value);
    }
    return shown.join(", ");
  };
  const toggles = () => page.evaluate(() => window.__accordionToggles.join(", "));

  await step("only the section marked expanded is shown on load", async () => {
    await eventually(visibleSections, "delivery", "visible sections on load");
    await eventually(
      () => trigger("Can I return an item?").getAttribute("aria-expanded"),
      "false",
      "Returns trigger collapsed",
    );
  });

  await step("each trigger is a named button inside a level 3 heading", async () => {
    const has = async (role, name) =>
      (await exposedNodes()).some((node) => node.role === role && node.name === name);
    for (const name of [
      "How long does delivery take?",
      "Can I return an item?",
      "Is there a warranty?",
    ]) {
      await eventually(() => has("heading", name), true, `heading named ${name}`);
      await eventually(() => has("button", name), true, `button named ${name}`);
    }
    await eventually(
      () => accordion.locator('[role="heading"]').first().getAttribute("aria-level"),
      "3",
      "heading level",
    );
  });

  await step("clicking a trigger opens its section without closing the others", async () => {
    await page.evaluate(() => {
      window.__accordionToggles = [];
      document.querySelector("[data-accordion-subject]").addEventListener("toggle", (event) => {
        window.__accordionToggles.push(
          `${event.detail.section.dataset.accordionSection} ${event.detail.section.expanded}`,
        );
      });
    });
    await trigger("Can I return an item?").click();
    await eventually(visibleSections, "delivery, returns", "visible sections after click");
    await eventually(toggles, "returns true", "toggle reported for Returns");
  });

  await step("Tab reaches the link inside an expanded section, then the next trigger", async () => {
    await trigger("Can I return an item?").focus();
    await page.keyboard.press("Tab");
    await eventually(
      () =>
        page
          .locator("[data-accordion-returns-link]")
          .evaluate((node) => node.matches(":focus-within")),
      true,
      "returns policy link focused",
    );
    await page.keyboard.press("Tab");
    await eventually(
      () => trigger("Is there a warranty?").evaluate((node) => node.matches(":focus")),
      true,
      "Warranty trigger focused",
    );
  });

  await step("Enter and Space collapse and expand the focused section", async () => {
    await trigger("How long does delivery take?").focus();
    await page.keyboard.press("Enter");
    await eventually(visibleSections, "returns", "Delivery collapsed by Enter");
    await page.keyboard.press(" ");
    await eventually(visibleSections, "delivery, returns", "Delivery expanded by Space");
  });
}
