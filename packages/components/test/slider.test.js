import { afterEach, beforeAll, describe, expect, test } from "vitest";
import { cdp, userEvent } from "vitest/browser";

import { defineButton } from "../src/button.js";
import { defineSlider } from "../src/slider.js";
import { exposedNodes } from "./helpers/accessibility.js";
import { expectRendered } from "./helpers/rendered.js";
import { resolvedValue } from "./helpers/tokens.js";

const tagName = "test-ds-slider";
const buttonTag = "test-ds-slider-button";

beforeAll(() => {
  defineSlider(tagName);
  defineButton(buttonTag);
});

afterEach(async () => {
  document.body.replaceChildren();
  await cdp().send("Emulation.setEmulatedMedia", { features: [] });
});

function render(markup) {
  document.body.innerHTML = markup;
  return document.body.firstElementChild;
}

function part(slider, name) {
  return slider.shadowRoot.querySelector(`[part~="${name}"]`);
}

function controlOf(slider) {
  return part(slider, "control");
}

function recordEvents(slider) {
  const events = [];
  for (const type of ["input", "change"]) {
    slider.addEventListener(type, (event) =>
      events.push(`${type}:${event.target === slider ? slider.value : "inner"}`),
    );
  }
  return events;
}

/** Press the pointer at `ratio` of the track's length, optionally drag to other ratios, then release. */
async function pointer(slider, ratios) {
  const rect = controlOf(slider).getBoundingClientRect();
  const y = rect.top + rect.height / 2;
  const at = (ratio) => ({ x: rect.left + rect.width * ratio, y });
  const [first, ...rest] = ratios;
  await cdp().send("Input.dispatchMouseEvent", { type: "mouseMoved", ...at(first) });
  await cdp().send("Input.dispatchMouseEvent", {
    type: "mousePressed",
    button: "left",
    clickCount: 1,
    ...at(first),
  });
  for (const ratio of rest) {
    await cdp().send("Input.dispatchMouseEvent", {
      type: "mouseMoved",
      button: "left",
      buttons: 1,
      ...at(ratio),
    });
  }
  const last = at(rest.length > 0 ? rest.at(-1) : first);
  await cdp().send("Input.dispatchMouseEvent", {
    type: "mouseReleased",
    button: "left",
    clickCount: 1,
    ...last,
  });
}

describe("DsSlider", () => {
  test("[value-in-range] clamps to min and max and snaps to the nearest step", () => {
    const slider = render(`<${tagName} label="Volume" min="10" max="50" step="5"></${tagName}>`);
    expectRendered(slider, "track", "thumb");

    expect(slider.value).toBe(10);
    slider.value = 200;
    expect(slider.value).toBe(50);
    slider.value = -4;
    expect(slider.value).toBe(10);
    slider.value = 23;
    expect(slider.value).toBe(25);
    slider.value = 21;
    expect(slider.value).toBe(20);

    slider.max = 30;
    slider.value = 45;
    expect(slider.value).toBe(30);
  });

  test("[value-in-range] the value attribute is the initial value, defaulting to min", () => {
    const slider = render(`<${tagName} label="Volume" min="20" max="80" value="47"></${tagName}>`);
    expect(slider.value).toBe(47);

    slider.removeAttribute("value");
    expect(slider.value).toBe(20);
  });

  test("[drag-or-press] pressing the track moves the value there, and dragging reports input for each new value", async () => {
    const slider = render(`<${tagName} label="Volume"></${tagName}>`);
    expectRendered(slider, "track", "thumb");
    const events = recordEvents(slider);

    await pointer(slider, [0.5, 0.7, 0.9]);

    expect(slider.value).toBeGreaterThan(80);
    const inputs = events.filter((event) => event.startsWith("input:"));
    expect(inputs.length).toBeGreaterThanOrEqual(3);
    expect(new Set(inputs).size).toBe(inputs.length);
    expect(events.at(-1)).toBe(`change:${slider.value}`);
  });

  test("[keyboard-steps] arrows step, Page keys move a tenth, Home and End go to the ends", async () => {
    const slider = render(
      `<${tagName} label="Price" min="0" max="200" step="5" value="100"></${tagName}>`,
    );
    const events = recordEvents(slider);
    slider.focus();

    await userEvent.keyboard("{ArrowRight}");
    expect(slider.value).toBe(105);
    await userEvent.keyboard("{ArrowUp}");
    expect(slider.value).toBe(110);
    await userEvent.keyboard("{ArrowLeft}");
    await userEvent.keyboard("{ArrowDown}");
    expect(slider.value).toBe(100);
    await userEvent.keyboard("{PageUp}");
    expect(slider.value).toBe(120);
    await userEvent.keyboard("{PageDown}");
    expect(slider.value).toBe(100);
    await userEvent.keyboard("{End}");
    expect(slider.value).toBe(200);
    await userEvent.keyboard("{Home}");
    expect(slider.value).toBe(0);

    expect(events.slice(0, 2)).toEqual(["input:105", "change:105"]);
    expect(events).toHaveLength(16);
  });

  test("[keyboard-steps] Page keys round a tenth of the range to a step", async () => {
    const slider = render(`<${tagName} label="Rating" max="10" step="3"></${tagName}>`);
    slider.focus();

    await userEvent.keyboard("{PageUp}");
    expect(slider.value).toBe(3);
  });

  test("[keyboard-steps] arrow keys follow the visual direction in right-to-left layouts", async () => {
    const slider = render(`<${tagName} dir="rtl" label="Volume" value="50"></${tagName}>`);
    slider.focus();

    await userEvent.keyboard("{ArrowRight}");
    expect(slider.value).toBe(49);
    await userEvent.keyboard("{ArrowLeft}");
    await userEvent.keyboard("{ArrowLeft}");
    expect(slider.value).toBe(51);
    await userEvent.keyboard("{ArrowUp}");
    expect(slider.value).toBe(52);

    const thumb = part(slider, "thumb").getBoundingClientRect();
    const track = part(slider, "track").getBoundingClientRect();
    slider.value = 0;
    expect(part(slider, "thumb").getBoundingClientRect().right).toBeCloseTo(track.right, 0);
    expect(thumb.left).toBeGreaterThan(track.left);
  });

  test("[change-on-release] reports change once on release, and not when the value ends where it started", async () => {
    const slider = render(`<${tagName} label="Volume" value="50"></${tagName}>`);
    expectRendered(slider, "track", "thumb");
    const events = recordEvents(slider);

    await pointer(slider, [0.5, 0.8, 0.5]);
    expect(events.filter((event) => event.startsWith("change"))).toEqual([]);
    expect(events.filter((event) => event.startsWith("input")).length).toBeGreaterThan(0);

    events.length = 0;
    await pointer(slider, [0.5, 0.8]);
    expect(events.filter((event) => event.startsWith("change"))).toEqual([
      `change:${slider.value}`,
    ]);

    events.length = 0;
    slider.focus();
    await userEvent.keyboard("{End}");
    await userEvent.keyboard("{End}");
    expect(events).toEqual(["input:100", "change:100"]);
  });

  test("[programmatic-no-events] setting the value, min, max, or a form reset reports nothing", async () => {
    const form = render(`<form><${tagName} label="Volume" value="40"></${tagName}></form>`);
    const slider = form.querySelector(tagName);
    expectRendered(slider, "track", "thumb");
    const events = recordEvents(slider);

    slider.value = 70;
    slider.setAttribute("value", "20");
    slider.max = 50;
    form.reset();
    expect(slider.value).toBe(20);
    expect(events).toEqual([]);
  });

  test("[value-shown] shows the value as locale text and gives assistive technology the same text", async () => {
    const slider = render(
      `<${tagName} label="Maximum price (USD)" min="0" max="5000" step="250" value="1250"></${tagName}>`,
    );
    const text = new Intl.NumberFormat().format(1250);

    expect(part(slider, "value").textContent).toBe(text);
    expect(controlOf(slider).getAttribute("aria-valuetext")).toBe(text);

    slider.value = 2500;
    expect(part(slider, "value").textContent).toBe(new Intl.NumberFormat().format(2500));

    const nodes = await exposedNodes();
    expect(nodes.filter((node) => node.role === "slider")).toHaveLength(1);
    expect(nodes.some((node) => node.role === "StaticText" && node.name === text)).toBe(false);
  });

  test("[label-is-name] exposes one slider named by its visible label", async () => {
    const slider = render(`<${tagName} label="Volume"></${tagName}>`);
    expectRendered(slider, "label");

    expect(part(slider, "label").textContent).toBe("Volume");
    expect(controlOf(slider).labels).toContain(part(slider, "label"));
    const nodes = await exposedNodes();
    expect(nodes.filter((node) => node.role === "slider")).toEqual([
      { role: "slider", name: "Volume" },
    ]);
  });

  test("[described-by-hint-and-error] describes the control with the messages that have text", () => {
    const slider = render(
      `<${tagName} label="Volume" hint="Applies to every device."></${tagName}>`,
    );
    const input = controlOf(slider);

    expect(input.getAttribute("aria-describedby")).toBe("hint");
    expect(part(slider, "hint").textContent).toBe("Applies to every device.");
    expect(part(slider, "error").hidden).toBe(true);

    slider.error = "Lower the volume to 80 or less.";
    expect(input.getAttribute("aria-describedby")).toBe("hint error");
    expect(part(slider, "error").hidden).toBe(false);

    slider.hint = "";
    expect(input.getAttribute("aria-describedby")).toBe("error");
  });

  test("[error-marks-invalid] [invalid-not-color-alone] a non-empty error marks it invalid and shows the message", () => {
    const slider = render(`<${tagName} label="Budget" error="Choose 500 or less."></${tagName}>`);
    const input = controlOf(slider);

    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(getComputedStyle(part(slider, "error")).display).not.toBe("none");
    expect(part(slider, "error").textContent).toBe("Choose 500 or less.");
    expect(getComputedStyle(part(slider, "fill")).backgroundColor).toBe(
      resolvedValue(
        "background-color",
        "var(--ds-semantic-color-background-status-danger-default)",
      ),
    );

    slider.error = "";
    expect(input.hasAttribute("aria-invalid")).toBe(false);
    expect(getComputedStyle(part(slider, "error")).display).toBe("none");
  });

  test("[error-blocks-submit] [form-value] submits the number under its name, and blocks submit while in error", () => {
    const form = render(`
      <form>
        <${tagName} label="Budget" name="budget" min="0" max="1000" step="50" value="300"></${tagName}>
        <${buttonTag} type="submit">Search</${buttonTag}>
      </form>
    `);
    const slider = form.querySelector(tagName);

    expect(new FormData(form).get("budget")).toBe("300");
    slider.value = 450;
    expect(new FormData(form).get("budget")).toBe("450");
    expect(form.checkValidity()).toBe(true);

    slider.error = "Choose 400 or less.";
    expect(form.checkValidity()).toBe(false);
    expect(slider.matches(":invalid")).toBe(true);

    form.reset();
    expect(slider.value).toBe(300);
    expect(slider.error).toBe("Choose 400 or less.");
    slider.error = "";
    expect(form.checkValidity()).toBe(true);
  });

  test("[disabled-prevents-interaction] ignores pointer and keyboard while disabled, including from a fieldset", async () => {
    const fieldset = render(`
      <fieldset><${tagName} label="Volume" value="30" disabled></${tagName}></fieldset>
    `);
    const slider = fieldset.querySelector(tagName);
    expectRendered(slider, "track", "thumb");
    const events = recordEvents(slider);

    expect(controlOf(slider).disabled).toBe(true);
    await pointer(slider, [0.9]);
    slider.focus();
    await userEvent.keyboard("{End}");
    expect(slider.value).toBe(30);
    expect(events).toEqual([]);

    slider.disabled = false;
    expect(controlOf(slider).disabled).toBe(false);
    fieldset.disabled = true;
    expect(controlOf(slider).disabled).toBe(true);
    await pointer(slider, [0.9]);
    expect(events).toEqual([]);
  });

  test("[disabled-submits-nothing] a disabled slider submits nothing", () => {
    const form = render(
      `<form><${tagName} label="Volume" name="volume" value="30"></${tagName}></form>`,
    );
    const slider = form.querySelector(tagName);
    expect(new FormData(form).get("volume")).toBe("30");

    slider.disabled = true;
    expect(new FormData(form).has("volume")).toBe(false);
  });

  test("[thumb-contrast] paints the fill and thumb in the action color against a muted track", () => {
    const slider = render(`<${tagName} label="Volume" value="50"></${tagName}>`);
    expectRendered(slider, "track", "fill", "thumb");
    const action = resolvedValue(
      "background-color",
      "var(--ds-semantic-color-background-action-primary-default)",
    );

    expect(getComputedStyle(part(slider, "track")).backgroundColor).toBe(
      resolvedValue("background-color", "var(--ds-semantic-color-background-muted)"),
    );
    expect(getComputedStyle(part(slider, "fill")).backgroundColor).toBe(action);
    expect(getComputedStyle(part(slider, "thumb")).backgroundColor).toBe(action);
    expect(getComputedStyle(part(slider, "thumb")).borderTopColor).toBe(
      resolvedValue("border-top-color", "var(--ds-semantic-color-background-surface)"),
    );
  });

  test("[not-color-alone] the thumb position and fill length show the value", () => {
    const slider = render(`<${tagName} label="Volume" value="25"></${tagName}>`);
    expectRendered(slider, "track", "fill", "thumb");
    const track = part(slider, "track").getBoundingClientRect();
    const quarter = part(slider, "fill").getBoundingClientRect().width;

    slider.value = 75;
    const threeQuarters = part(slider, "fill").getBoundingClientRect().width;
    expect(threeQuarters).toBeGreaterThan(quarter);
    expect(threeQuarters).toBeLessThan(track.width);

    slider.value = 100;
    expect(part(slider, "thumb").getBoundingClientRect().right).toBeCloseTo(track.right, 0);
  });

  test("[visible-focus] rings the thumb when the control has keyboard focus", async () => {
    const slider = render(`<${tagName} label="Volume"></${tagName}>`);
    expectRendered(slider, "thumb");

    await userEvent.tab();
    expect(controlOf(slider).matches(":focus-visible")).toBe(true);
    const thumb = getComputedStyle(part(slider, "thumb"));
    expect(thumb.outlineStyle).toBe("solid");
    expect(thumb.outlineColor).toBe(
      resolvedValue("outline-color", "var(--ds-semantic-color-border-focus)"),
    );
  });

  test("[forced-colors] outlines the track and keeps the fill, thumb, and focus visible", async () => {
    await cdp().send("Emulation.setEmulatedMedia", {
      features: [{ name: "forced-colors", value: "active" }],
    });
    const slider = render(`<${tagName} label="Volume" value="50"></${tagName}>`);
    expectRendered(slider, "track", "fill", "thumb");

    for (const setup of [() => {}, () => (slider.disabled = true)]) {
      setup();
      const track = getComputedStyle(part(slider, "track"));
      const fill = getComputedStyle(part(slider, "fill"));
      const thumb = getComputedStyle(part(slider, "thumb"));
      expect(track.borderTopStyle).toBe("solid");
      expect(parseFloat(track.borderTopWidth)).toBeGreaterThan(0);
      expect(fill.backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
      expect(fill.backgroundColor).not.toBe(track.backgroundColor);
      expect(thumb.backgroundColor).not.toBe(track.backgroundColor);
    }

    slider.disabled = false;
    await userEvent.tab();
    expect(getComputedStyle(part(slider, "thumb")).outlineStyle).toBe("solid");
  });

  test("marks the thumb while it is dragged", async () => {
    const slider = render(`<${tagName} label="Volume"></${tagName}>`);
    expectRendered(slider, "thumb");
    const pressed = resolvedValue(
      "background-color",
      "var(--ds-semantic-color-background-action-primary-pressed)",
    );
    const seen = [];
    slider.addEventListener("input", () =>
      seen.push(getComputedStyle(part(slider, "thumb")).backgroundColor),
    );

    await pointer(slider, [0.2, 0.6]);

    expect(seen).toContain(pressed);
    expect(getComputedStyle(part(slider, "thumb")).backgroundColor).not.toBe(pressed);
  });
});
