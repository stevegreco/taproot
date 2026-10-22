/**
 * Verify steps for avatar.tsx. Avatar sets its role and name through
 * ElementInternals, which only the browser's accessibility tree reports, so the
 * naming steps read it with `exposedNodes`.
 */
export default async function verify({ page, step, eventually, exposedNodes }) {
  const account = page.locator("[data-avatar-account]");
  const commentAvatar = (id) => page.locator(`[data-avatar-comment="${id}"] ds-avatar`);

  /** Which of the picture, initials, and placeholder an avatar shows, comma-separated. */
  const showing = (avatar) =>
    avatar.evaluate((element) =>
      ["image", "initials", "placeholder"]
        .filter((name) => {
          const part = element.shadowRoot.querySelector(`[part~="${name}"]`);
          return getComputedStyle(part).display !== "none";
        })
        .join(","),
    );

  await step("the account avatar shows the picture and is named for the person", async () => {
    await eventually(() => showing(account), "image", "account avatar parts");
    const named = async () =>
      (await exposedNodes()).filter((node) => node.role === "image" && node.name === "Ada Lovelace")
        .length;
    await eventually(named, 1, "images named Ada Lovelace");
  });

  await step("an author whose picture fails to load shows their initials", async () => {
    await eventually(() => showing(commentAvatar("grace")), "initials", "Grace's avatar parts");
    await eventually(
      () => commentAvatar("grace").evaluate((element) => element.shadowRoot.textContent.trim()),
      "GH",
      "Grace's initials",
    );
  });

  await step("an author with no name shows the placeholder symbol", async () => {
    await eventually(
      () => showing(commentAvatar("former")),
      "placeholder",
      "former member's avatar parts",
    );
  });

  await step("avatars beside a printed name are not read a second time", async () => {
    await eventually(() => showing(commentAvatar("ada")), "image", "Ada's comment avatar parts");
    const images = async () =>
      (await exposedNodes())
        .filter((node) => node.role === "image" || node.role === "img")
        .map((node) => node.name)
        .join(",");
    // Only the account avatar is an image: the three comment avatars are decorative.
    await eventually(images, "Ada Lovelace", "named images");
  });
}
