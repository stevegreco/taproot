/**
 * The browser's accessibility tree for a Verify step. Roles, names, and hidden
 * state set through ElementInternals only show up here: the DOM has no
 * attributes for them, and role locators do not see them.
 *
 * Mirrors `packages/components/test/helpers/accessibility.js`. It places a
 * uniquely named sentinel in the example's document, reads every frame, keeps
 * only the frame that contains the sentinel, and throws if no frame does, so a
 * "nothing is exposed" check cannot pass by reading the wrong tree.
 *
 * @param {import("playwright").Page} page
 * @returns {Promise<{ role: string | undefined, name: string }[]>} each node that is not ignored
 */
export async function exposedNodes(page) {
  const sentinelName = `accessibility-tree-sentinel-${crypto.randomUUID()}`;
  await page.evaluate((name) => {
    const sentinel = document.createElement("button");
    sentinel.setAttribute("aria-label", name);
    sentinel.dataset.accessibilityTreeSentinel = "";
    document.body.append(sentinel);
  }, sentinelName);

  const cdp = await page.context().newCDPSession(page);
  try {
    await cdp.send("Accessibility.enable");
    const { frameTree } = await cdp.send("Page.getFrameTree");
    const frameIds = [];
    const collect = (tree) => {
      frameIds.push(tree.frame.id);
      tree.childFrames?.forEach(collect);
    };
    collect(frameTree);

    const trees = await Promise.all(
      frameIds.map((frameId) => cdp.send("Accessibility.getFullAXTree", { frameId })),
    );
    const nodes = trees
      .map((tree) =>
        tree.nodes
          .filter((node) => !node.ignored)
          .map((node) => ({ role: node.role?.value, name: node.name?.value ?? "" })),
      )
      .find((frame) => frame.some((node) => node.name === sentinelName));

    if (!nodes) {
      throw new Error(
        `The accessibility tree has no frame containing the example (read ${frameIds.length} frames).`,
      );
    }
    return nodes.filter((node) => node.name !== sentinelName);
  } finally {
    await cdp.detach();
    await page.evaluate(() =>
      document
        .querySelectorAll("[data-accessibility-tree-sentinel]")
        .forEach((node) => node.remove()),
    );
  }
}
