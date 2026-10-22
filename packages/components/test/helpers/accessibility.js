import { cdp } from "vitest/browser";

/**
 * The browser's accessibility tree for the frame the test renders into, as
 * `{ role, name }` for each node that is not ignored. With `{ properties: true }`,
 * each node also has `properties`: each property the browser reports, such as
 * orientation or level, mapped to its value. Roles, names, and hidden
 * state set through ElementInternals only show up here: the DOM has no
 * attributes for them, and role locators do not see them.
 *
 * Tests run in an iframe, and `Accessibility.getFullAXTree` reads the top frame
 * unless told otherwise. Reading the wrong frame makes every "is hidden"
 * assertion pass. So this places a uniquely named sentinel in the test's
 * document, reads every frame, keeps only the frame that contains the sentinel,
 * and throws if no frame does.
 */
export async function exposedNodes({ properties = false } = {}) {
  const sentinelName = `accessibility-tree-sentinel-${crypto.randomUUID()}`;
  const sentinel = document.createElement("button");
  sentinel.setAttribute("aria-label", sentinelName);
  document.body.append(sentinel);

  try {
    await cdp().send("Accessibility.enable");
    const { frameTree } = await cdp().send("Page.getFrameTree");
    const frameIds = [];
    const collect = (tree) => {
      frameIds.push(tree.frame.id);
      tree.childFrames?.forEach(collect);
    };
    collect(frameTree);

    const trees = await Promise.all(
      frameIds.map((frameId) => cdp().send("Accessibility.getFullAXTree", { frameId })),
    );
    const nodes = trees
      .map((tree) =>
        tree.nodes
          .filter((node) => !node.ignored)
          .map((node) => ({
            role: node.role?.value,
            name: node.name?.value ?? "",
            ...(properties && {
              properties: Object.fromEntries(
                (node.properties ?? []).map((entry) => [entry.name, entry.value?.value]),
              ),
            }),
          })),
      )
      .find((frame) => frame.some((node) => node.name === sentinelName));

    if (!nodes) {
      throw new Error(
        `The accessibility tree has no frame containing the test document (read ${frameIds.length} frames).`,
      );
    }
    return nodes.filter((node) => node.name !== sentinelName);
  } finally {
    sentinel.remove();
  }
}
