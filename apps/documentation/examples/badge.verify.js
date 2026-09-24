/** Verify steps for badge.tsx. */
const LABELS = [
  [null, "Default"],
  ["accent", "Accent"],
  ["success", "Active"],
  ["danger", "Failed"],
  ["warning", "Pending"],
  ["info", "Beta"],
];

export default async function verify({ page, step, eventually }) {
  const badges = page.locator("ds-badge");

  await step("each variant renders its label", async () => {
    await eventually(() => badges.count(), LABELS.length, "badge count");
    for (const [index, [variant, label]] of LABELS.entries()) {
      const badge = badges.nth(index);
      await eventually(() => badge.getAttribute("variant"), variant, `badge ${index} variant`);
      await eventually(() => badge.textContent(), label, `badge ${index} label`);
    }
  });

  await step("badges are not interactive and set no live region", async () => {
    const interactive = await badges.evaluateAll(
      (hosts) =>
        hosts.filter(
          (host) =>
            host.tabIndex >= 0 ||
            host.hasAttribute("role") ||
            host.hasAttribute("aria-live") ||
            host.shadowRoot?.querySelector("[role], [aria-live], [tabindex], a[href], button"),
        ).length,
    );
    if (interactive > 0) {
      throw new Error(`${interactive} badges are focusable or set a role or live region`);
    }
  });
}
