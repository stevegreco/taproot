import { afterEach, beforeAll, describe, expect, test } from "vitest";
import { cdp, userEvent } from "vitest/browser";

import { defineDivider } from "../src/divider.js";
import { exposedNodes } from "./helpers/accessibility.js";
import { expectRendered } from "./helpers/rendered.js";
import { resolvedValue } from "./helpers/tokens.js";

const tagName = "test-ds-divider";

beforeAll(() => {
  defineDivider(tagName);
});

afterEach(async () => {
  document.body.replaceChildren();
  await cdp().send("Emulation.setEmulatedMedia", { features: [] });
});

function render(markup) {
  document.body.innerHTML = markup;
  return document.body.querySelector(tagName);
}

function lineOf(divider) {
  return divider.shadowRoot.querySelector('[part="line"]');
}

const separators = async () =>
  (await exposedNodes({ properties: true })).filter((node) => node.role === "separator");

describe("DsDivider", () => {
  test("[exposed-as-separator] is a separator with no name, horizontal by default", async () => {
    render(`<${tagName}></${tagName}>`);
    const [separator, ...rest] = await separators();
    expect(rest).toEqual([]);
    expect(separator.name).toBe("");
    expect(separator.properties.orientation).toBe("horizontal");
  });

  test("[exposed-as-separator] reports a vertical orientation, and follows changes to it", async () => {
    const divider = render(`<${tagName} orientation="vertical"></${tagName}>`);
    expect((await separators())[0].properties.orientation).toBe("vertical");

    divider.orientation = "horizontal";
    expect((await separators())[0].properties.orientation).toBe("horizontal");
  });

  test("[exposed-as-separator] an unknown orientation is reported as horizontal", async () => {
    render(`<${tagName} orientation="diagonal"></${tagName}>`);
    expect((await separators())[0].properties.orientation).toBe("horizontal");
  });

  test("[not-a-control] takes no focus and ignores its content", async () => {
    render(`<button>Before</button><${tagName}>Ignored text</${tagName}><button>After</button>`);
    const divider = document.querySelector(tagName);
    expectRendered(divider, "line");

    await userEvent.tab();
    await userEvent.tab();
    expect(document.activeElement.textContent).toBe("After");
    expect(divider.shadowRoot.querySelector("slot")).toBeNull();
    expect(lineOf(divider).getBoundingClientRect().height).toBeLessThan(4);
  });

  test("[spans-container] horizontal: full width, border-width thick, no margin", () => {
    render(`<div style="width: 300px"><${tagName}></${tagName}></div>`);
    const divider = document.querySelector(tagName);
    const box = divider.getBoundingClientRect();
    const width = parseFloat(resolvedValue("width", "var(--ds-semantic-border-width)"));
    const style = getComputedStyle(divider);

    expect(box.width).toBe(300);
    expect(box.height).toBe(width);
    expect([style.marginTop, style.marginBottom, style.marginLeft, style.marginRight]).toEqual([
      "0px",
      "0px",
      "0px",
      "0px",
    ]);
  });

  test("[spans-container] vertical: full height of its row, border-width thick", () => {
    render(
      `<div style="display: flex; height: 40px"><span>A</span><${tagName} orientation="vertical"></${tagName}><span>B</span></div>`,
    );
    const divider = document.querySelector(tagName);
    const box = divider.getBoundingClientRect();
    const width = parseFloat(resolvedValue("width", "var(--ds-semantic-border-width)"));

    expect(box.height).toBe(40);
    expect(box.width).toBe(width);
  });

  test("[spans-container] vertical: full height of a row that is sized by its content", () => {
    render(
      `<div style="display: flex; align-items: center"><span style="display: block; height: 32px">A</span><${tagName} orientation="vertical"></${tagName}><span>B</span></div>`,
    );
    expect(document.querySelector(tagName).getBoundingClientRect().height).toBe(32);
  });

  test("paints the line in the subtle border color", () => {
    const divider = render(`<${tagName}></${tagName}>`);
    const line = getComputedStyle(lineOf(divider));
    expect(line.borderTopStyle).toBe("solid");
    expect(line.borderTopColor).toBe(
      resolvedValue("color", "var(--ds-semantic-color-border-subtle)"),
    );
  });

  test("[forced-colors] the line takes the system text color under forced colors", async () => {
    await cdp().send("Emulation.setEmulatedMedia", {
      features: [{ name: "forced-colors", value: "active" }],
    });
    expect(matchMedia("(forced-colors: active)").matches).toBe(true);
    for (const orientation of ["horizontal", "vertical"]) {
      const divider = render(
        `<div style="display: flex; flex-direction: column; height: 40px"><${tagName} orientation="${orientation}"></${tagName}></div>`,
      );
      const line = getComputedStyle(lineOf(divider));
      const edge = orientation === "horizontal" ? "Top" : "Left";
      expect(line[`border${edge}Style`]).toBe("solid");
      expect(parseFloat(line[`border${edge}Width`])).toBeGreaterThan(0);
      expect(line[`border${edge}Color`]).toBe(resolvedValue("color", "CanvasText"));
    }
  });
});
