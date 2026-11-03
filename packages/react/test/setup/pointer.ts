/**
 * The real mouse stays where the last test left it, so a control rendered under it starts out
 * hovered and token checks read hover colors. Move it to the page corner, outside any rendered
 * content, before each test.
 */
import { beforeEach } from "vitest";
import { cdp } from "vitest/browser";

beforeEach(async () => {
  await cdp().send("Input.dispatchMouseEvent", { type: "mouseMoved", x: 0, y: 0 });
});
