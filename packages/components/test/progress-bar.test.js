import { cdp } from "vitest/browser";
import { afterEach, beforeAll, describe, expect, test } from "vitest";

import { defineProgressBar } from "../src/progress-bar.js";
import { exposedNodes } from "./helpers/accessibility.js";
import { expectRendered } from "./helpers/rendered.js";
import { resolvedValue } from "./helpers/tokens.js";

const tagName = "test-ds-progress-bar";

beforeAll(() => {
  defineProgressBar(tagName);
});

afterEach(async () => {
  document.body.replaceChildren();
  await cdp().send("Emulation.setEmulatedMedia", { features: [] });
});

function render(markup) {
  document.body.innerHTML = markup;
  return document.body.querySelector(tagName);
}

function part(bar, name) {
  return bar.shadowRoot.querySelector(`[part~="${name}"]`);
}

/** The fill's length as a fraction of the track's. */
function filled(bar) {
  return (
    part(bar, "fill").getBoundingClientRect().width /
    part(bar, "track").getBoundingClientRect().width
  );
}

/**
 * The value, minimum, and maximum the browser exposes for the progress bar
 * named `name`. `exposedNodes()` returns only role and name, so this reads the
 * same frame-safe tree and picks the range properties off the matching node.
 */
async function exposedRange(name) {
  await exposedNodes();
  const { frameTree } = await cdp().send("Page.getFrameTree");
  const frameIds = [];
  const collect = (tree) => {
    frameIds.push(tree.frame.id);
    tree.childFrames?.forEach(collect);
  };
  collect(frameTree);
  for (const frameId of frameIds) {
    const { nodes } = await cdp().send("Accessibility.getFullAXTree", { frameId });
    const node = nodes.find((n) => n.role?.value === "progressbar" && n.name?.value === name);
    if (node) {
      const property = (key) => node.properties?.find((p) => p.name === key)?.value.value;
      return { now: node.value?.value, min: property("valuemin"), max: property("valuemax") };
    }
  }
  throw new Error(`No progress bar named "${name}" in the accessibility tree.`);
}

describe("DsProgressBar", () => {
  test("[named-by-label] is a progress indicator named by its visible label", async () => {
    const bar = render(`<${tagName} label="Uploading report.pdf" value="40"></${tagName}>`);

    expect(part(bar, "label").textContent).toBe("Uploading report.pdf");
    expect(await exposedNodes()).toContainEqual({
      role: "progressbar",
      name: "Uploading report.pdf",
    });

    bar.label = "Uploading notes.txt";

    expect(part(bar, "label").textContent).toBe("Uploading notes.txt");
    expect(await exposedNodes()).toContainEqual({
      role: "progressbar",
      name: "Uploading notes.txt",
    });
  });

  test("[named-by-label] exposes its value and its range from 0 to max", async () => {
    const bar = render(`<${tagName} label="Importing contacts" value="3" max="12"></${tagName}>`);

    expect(await exposedRange("Importing contacts")).toEqual({ now: 3, min: 0, max: 12 });

    bar.value = 7;

    expect(await exposedRange("Importing contacts")).toEqual({ now: 7, min: 0, max: 12 });
  });

  test("[named-by-label] defaults to 0 of 100", async () => {
    render(`<${tagName} label="Uploading"></${tagName}>`);

    expect(await exposedRange("Uploading")).toEqual({ now: 0, min: 0, max: 100 });
  });

  test("fills the track in proportion to value over max", () => {
    const bar = render(
      `<${tagName} label="Uploading" value="1" max="4" style="width: 400px"></${tagName}>`,
    );
    part(bar, "fill").style.transition = "none";

    expect(filled(bar)).toBeCloseTo(0.25);
  });

  test.each([
    ["-5", "100", 0, 0],
    ["150", "100", 1, 100],
    ["abc", "100", 0, 0],
  ])(
    "[value-clamped] value %s of %s fills %s and exposes %s",
    async (value, max, fraction, now) => {
      const bar = render(
        `<${tagName} label="Uploading" value="${value}" max="${max}"></${tagName}>`,
      );
      part(bar, "fill").style.transition = "none";

      expect(filled(bar)).toBeCloseTo(fraction);
      expect(bar.value).toBe(now);
      expect((await exposedRange("Uploading")).now).toBe(now);
    },
  );

  test.each(["0", "-10", "abc"])("[value-clamped] a max of %s is treated as 100", async (max) => {
    const bar = render(`<${tagName} label="Uploading" value="50" max="${max}"></${tagName}>`);
    part(bar, "fill").style.transition = "none";

    expect(bar.max).toBe(100);
    expect(filled(bar)).toBeCloseTo(0.5);
    expect(await exposedRange("Uploading")).toEqual({ now: 50, min: 0, max: 100 });
  });

  test("[fills-from-start] grows from the left edge in left-to-right layouts", () => {
    const bar = render(`<${tagName} label="Uploading" value="25"></${tagName}>`);

    expect(part(bar, "fill").getBoundingClientRect().left).toBe(
      part(bar, "track").getBoundingClientRect().left,
    );
  });

  test("[fills-from-start] grows from the right edge in right-to-left layouts", () => {
    render(`<div dir="rtl"><${tagName} label="Uploading" value="25"></${tagName}></div>`);
    const bar = document.querySelector(tagName);
    const fill = part(bar, "fill").getBoundingClientRect();
    const track = part(bar, "track").getBoundingClientRect();

    expect(fill.width).toBeLessThan(track.width);
    expect(fill.right).toBe(track.right);
  });

  test("[not-announced] is not a live region", async () => {
    const bar = render(`<${tagName} label="Uploading" value="10"></${tagName}>`);
    expectRendered(bar, "label", "track", "fill");

    bar.value = 60;
    const nodes = await exposedNodes();

    expect(nodes.filter((node) => ["status", "alert", "log"].includes(node.role))).toEqual([]);
    expect(bar.shadowRoot.querySelector("[aria-live], [role=status], [role=alert]")).toBe(null);
  });

  test("[not-a-control] takes no focus and exposes no control", () => {
    const bar = render(`<${tagName} label="Uploading" value="10"></${tagName}>`);
    expectRendered(bar, "label", "track", "fill");

    bar.focus();

    expect(document.activeElement).not.toBe(bar);
    expect(bar.shadowRoot.querySelector("a[href], button, input, [tabindex]")).toBe(null);
  });

  test("[reduced-motion-instant] animates the fill when the value changes", () => {
    const bar = render(`<${tagName} label="Uploading" value="10"></${tagName}>`);
    expectRendered(bar, "fill");
    const style = getComputedStyle(part(bar, "fill"));

    expect(style.transitionProperty).toContain("inline-size");
    expect(parseFloat(style.transitionDuration)).toBe(
      parseFloat(resolvedValue("transition-duration", "var(--ds-primitives-duration-slow)")),
    );
  });

  test("[reduced-motion-instant] changes at once under reduced motion", async () => {
    const bar = render(`<${tagName} label="Uploading" value="10"></${tagName}>`);
    expectRendered(bar, "fill");

    await cdp().send("Emulation.setEmulatedMedia", {
      features: [{ name: "prefers-reduced-motion", value: "reduce" }],
    });

    expect(getComputedStyle(part(bar, "fill")).transitionDuration).toBe("0s");
  });

  test("[forced-colors-visible] outlines the track and paints the fill in a system color", async () => {
    const bar = render(`<${tagName} label="Uploading" value="50"></${tagName}>`);
    expectRendered(bar, "track", "fill");

    await cdp().send("Emulation.setEmulatedMedia", {
      features: [{ name: "forced-colors", value: "active" }],
    });

    const track = getComputedStyle(part(bar, "track"));
    const fill = getComputedStyle(part(bar, "fill"));
    expect(track.borderTopStyle).toBe("solid");
    expect(parseFloat(track.borderTopWidth)).toBeGreaterThan(0);
    expect(fill.backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
    expect(fill.backgroundColor).not.toBe(track.backgroundColor);
  });

  test("paints the track muted and the fill in the brand color", () => {
    const bar = render(`<${tagName} label="Uploading" value="50"></${tagName}>`);
    expectRendered(bar, "track", "fill");

    expect(getComputedStyle(part(bar, "track")).backgroundColor).toBe(
      resolvedValue("background-color", "var(--ds-semantic-color-background-muted)"),
    );
    expect(getComputedStyle(part(bar, "fill")).backgroundColor).toBe(
      resolvedValue("background-color", "var(--ds-semantic-color-background-brand-default)"),
    );
  });
});
