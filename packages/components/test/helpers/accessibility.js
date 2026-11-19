import { cdp } from "vitest/browser";

/**
 * The browser's accessibility tree for the frame the test renders into, as
 * `{ role, name }` for each node that is not ignored. With `{ properties: true }`,
 * each node also has its `description` and `properties`: each property the
 * browser reports, such as orientation or level, mapped to its value. Roles, names, and hidden
 * state set through ElementInternals only show up here: the DOM has no
 * attributes for them, and role locators do not see them.
 *
 * Tests run in an iframe, and `Accessibility.getFullAXTree` reads the top frame
 * unless told otherwise. Reading the wrong frame makes every "is hidden"
 * assertion pass. So this places a uniquely named sentinel in the test's
 * document, reads every frame, keeps only the frame that contains the sentinel,
 * and throws if no frame does. An open modal dialog makes the sentinel inert, so
 * then it keeps the one frame at this document's URL.
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
    const urls = [];
    const collect = (tree) => {
      frameIds.push(tree.frame.id);
      urls.push(tree.frame.url);
      tree.childFrames?.forEach(collect);
    };
    collect(frameTree);

    const trees = await Promise.all(
      frameIds.map((frameId) => cdp().send("Accessibility.getFullAXTree", { frameId })),
    );
    const frames = trees.map((tree) =>
      tree.nodes
        .filter((node) => !node.ignored)
        .map((node) => ({
          role: node.role?.value,
          name: node.name?.value ?? "",
          ...(properties && {
            description: node.description?.value ?? "",
            properties: Object.fromEntries(
              (node.properties ?? []).map((entry) => [entry.name, entry.value?.value]),
            ),
          }),
        })),
    );
    const here = urls.filter((url) => url === location.href);
    const nodes =
      frames.find((frame) => frame.some((node) => node.name === sentinelName)) ??
      (here.length === 1 ? frames[urls.indexOf(location.href)] : undefined);

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
