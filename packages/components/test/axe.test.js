import axe from "axe-core";
import { afterEach, describe, expect, test } from "vitest";

import "../src/index.js";
import { gallery, renderSample, themes } from "./fixtures/gallery.js";

const wcagRules = {
  runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] },
};

afterEach(() => {
  document.body.replaceChildren();
  document.documentElement.dataset.theme = "light";
});

const summarize = (violations) =>
  violations.flatMap(({ id, help, nodes }) =>
    nodes.map((node) => `${id}: ${help} (${node.target.join(" > ")})`),
  );

describe.each(themes)("axe, %s theme", (theme) => {
  test.each(Object.keys(gallery))("%s has no WCAG violations", async (name) => {
    const container = await renderSample(name, theme);
    const { violations } = await axe.run(container, wcagRules);
    expect(summarize(violations)).toEqual([]);
  });
});

test("the gallery has a sample of every component", () => {
  const components = Object.keys(import.meta.glob("../src/*.css")).map((path) =>
    path.replace("../src/", "").replace(".css", ""),
  );
  expect(Object.keys(gallery).sort()).toEqual(components.sort());
});
