import { cdp } from "vitest/browser";
import { afterEach, beforeAll, describe, expect, test } from "vitest";

import { defineSpinner } from "../src/spinner.js";
import { exposedNodes } from "./helpers/accessibility.js";
import { expectRendered } from "./helpers/rendered.js";
import { resolvedValue } from "./helpers/tokens.js";

const tagName = "test-ds-spinner";

beforeAll(() => {
  defineSpinner(tagName);
});

afterEach(async () => {
  document.body.replaceChildren();
  await cdp().send("Emulation.setEmulatedMedia", { features: [] });
});

function render(markup) {
  document.body.innerHTML = markup;
  return document.body.querySelector(tagName);
}

function indicator(spinner) {
  return spinner.shadowRoot.querySelector('[part~="indicator"]');
}

/** Seconds per turn of the indicator's rotation. */
function turnDuration(spinner) {
  return parseFloat(getComputedStyle(indicator(spinner)).animationDuration);
}

describe("DsSpinner", () => {
  test("[always-named] is a progress indicator named Loading without a label", async () => {
    render(`<${tagName}></${tagName}>`);

    const nodes = await exposedNodes();

    expect(nodes).toContainEqual({ role: "progressbar", name: "Loading" });
  });

  test("[always-named] takes its accessible name from the label", async () => {
    const spinner = render(`<${tagName} label="Loading comments"></${tagName}>`);

    expect(await exposedNodes()).toContainEqual({ role: "progressbar", name: "Loading comments" });

    spinner.label = "Saving draft";

    expect(await exposedNodes()).toContainEqual({ role: "progressbar", name: "Saving draft" });
  });

  test("[always-named] falls back to Loading when the label is emptied", async () => {
    const spinner = render(`<${tagName} label="Loading comments"></${tagName}>`);

    spinner.setAttribute("label", "");

    expect(await exposedNodes()).toContainEqual({ role: "progressbar", name: "Loading" });
  });

  test("[always-named] exposes no value, so it reads as indeterminate", () => {
    const spinner = render(`<${tagName}></${tagName}>`);
    expectRendered(spinner, "indicator");

    expect(spinner.shadowRoot.querySelector("[aria-valuenow]")).toBe(null);
    expect(spinner.hasAttribute("aria-valuenow")).toBe(false);
  });

  test("[not-announced] is not a live region", async () => {
    const spinner = render(`<${tagName}></${tagName}>`);
    expectRendered(spinner, "indicator");

    const nodes = await exposedNodes();

    expect(nodes.filter((node) => ["status", "alert", "log"].includes(node.role))).toEqual([]);
    expect(spinner.shadowRoot.querySelector("[aria-live], [role=status], [role=alert]")).toBe(null);
    expect(spinner.getAttributeNames()).toEqual([]);
  });

  test("[not-a-control] takes no focus and exposes no control", () => {
    const spinner = render(`<${tagName}></${tagName}>`);
    expectRendered(spinner, "indicator");

    spinner.focus();

    expect(document.activeElement).not.toBe(spinner);
    expect(spinner.shadowRoot.querySelector("a[href], button, input, [tabindex]")).toBe(null);
  });

  test("[follows-text-color] paints the arc in the current text color", () => {
    render(`<p style="color: rgb(200, 10, 20)"><${tagName}></${tagName}></p>`);
    const spinner = document.querySelector(tagName);
    expectRendered(spinner, "indicator");

    expect(getComputedStyle(indicator(spinner)).borderTopColor).toBe("rgb(200, 10, 20)");
  });

  test("[follows-text-color] keeps the arc distinct from the track in forced-colors mode", async () => {
    const spinner = render(`<${tagName}></${tagName}>`);
    expectRendered(spinner, "indicator");

    await cdp().send("Emulation.setEmulatedMedia", {
      features: [{ name: "forced-colors", value: "active" }],
    });

    const style = getComputedStyle(indicator(spinner));
    expect(style.borderTopColor).not.toBe(style.borderRightColor);
    expect(style.borderRightColor).toBe("rgba(0, 0, 0, 0)");
  });

  test("paints the track in the subtle border color", () => {
    const spinner = render(`<${tagName}></${tagName}>`);
    expectRendered(spinner, "indicator");

    expect(getComputedStyle(indicator(spinner)).borderRightColor).toBe(
      resolvedValue("color", "var(--ds-semantic-color-border-subtle)"),
    );
  });

  test("[square-box] inherits the surrounding text size by default", () => {
    render(`<p style="font-size: 30px"><${tagName}></${tagName}></p>`);
    const box = document.querySelector(tagName).getBoundingClientRect();

    expect(box.width).toBe(30);
    expect(box.height).toBe(30);
  });

  test.each([
    ["small", "--ds-primitives-space-4"],
    ["medium", "--ds-primitives-space-6"],
    ["large", "--ds-primitives-space-10"],
  ])("[square-box] the %s size is a square of %s", (size, token) => {
    const spinner = render(`<${tagName} size="${size}"></${tagName}>`);
    const box = spinner.getBoundingClientRect();
    const expected = parseFloat(resolvedValue("width", `var(${token})`));

    expect(box.width).toBe(expected);
    expect(box.height).toBe(expected);
  });

  test("[square-box] draws the stroke at an eighth of the size", () => {
    const spinner = render(`<${tagName} size="large"></${tagName}>`);
    const size = spinner.getBoundingClientRect().width;

    expect(parseFloat(getComputedStyle(indicator(spinner)).borderTopWidth)).toBe(size / 8);
  });

  test("[square-box] rotating does not change the space it takes", async () => {
    render(`<p style="font-size: 20px"><${tagName}></${tagName}></p>`);
    const spinner = document.querySelector(tagName);
    const before = spinner.getBoundingClientRect();

    await new Promise((resolve) => setTimeout(resolve, 150));
    const after = spinner.getBoundingClientRect();

    expect([after.width, after.height]).toEqual([before.width, before.height]);
  });

  test("turns continuously at the motion duration", () => {
    const spinner = render(`<${tagName}></${tagName}>`);
    expectRendered(spinner, "indicator");
    const style = getComputedStyle(indicator(spinner));

    expect(style.animationIterationCount).toBe("infinite");
    expect(style.animationTimingFunction).toBe("linear");
    expect(turnDuration(spinner)).toBe(
      parseFloat(resolvedValue("transition-duration", "var(--ds-primitives-duration-xslow)")),
    );
  });

  test("[reduced-motion-slows] keeps turning at a third of the speed under reduced motion", async () => {
    const spinner = render(`<${tagName}></${tagName}>`);
    expectRendered(spinner, "indicator");
    const normal = turnDuration(spinner);

    await cdp().send("Emulation.setEmulatedMedia", {
      features: [{ name: "prefers-reduced-motion", value: "reduce" }],
    });

    const style = getComputedStyle(indicator(spinner));
    expect(style.animationName).not.toBe("none");
    expect(style.animationPlayState).toBe("running");
    expect(turnDuration(spinner)).toBeCloseTo(normal * 3);
  });
});
