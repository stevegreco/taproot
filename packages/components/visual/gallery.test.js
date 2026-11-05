import { afterEach, describe, expect, test } from "vitest";
import { page } from "vitest/browser";

import "../src/index.js";
import { gallery, renderSample, themes } from "../test/fixtures/gallery.js";

afterEach(() => {
  document.body.replaceChildren();
});

describe.each(themes)("%s theme", (theme) => {
  test.each(Object.keys(gallery))("%s", async (name) => {
    const container = await renderSample(name, theme);
    // Fill the viewport so a modal, which sits in the top layer, is in frame.
    container.style.minBlockSize = "100vh";
    container.style.boxSizing = "border-box";
    container.style.alignContent = "start";
    await expect(page.elementLocator(container)).toMatchScreenshot(`${name}-${theme}`);
  });
});
