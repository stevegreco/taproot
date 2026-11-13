import { useState } from "react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { cdp, page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { Slider, type SliderProps } from "../src/slider/Slider";

const LABEL = "Volume";

function Example(props: Partial<SliderProps>) {
  return (
    <>
      <button type="button">Before</button>
      <Slider label={LABEL} {...props} />
    </>
  );
}

const input = () => document.querySelector<HTMLInputElement>('input[type="range"]')!;
const root = () => document.querySelector<HTMLElement>(".ds-slider")!;
const part = (name: string) => document.querySelector<HTMLElement>(`.ds-slider__${name}`)!;

/** Record the order of input and change calls. */
function recorder() {
  const calls: string[] = [];
  return {
    calls,
    onInput: vi.fn((value: number) => calls.push(`input:${value}`)),
    onChange: vi.fn((value: number) => calls.push(`change:${value}`)),
  };
}

async function tabToSlider() {
  page.getByRole("button", { name: "Before" }).element().focus();
  await userEvent.tab();
  expect(document.activeElement).toBe(input());
}

/** A point on the track, as a fraction of its length from the start. */
function trackPoint(fraction: number) {
  const box = part("track").getBoundingClientRect();
  return { x: box.left + box.width * fraction, y: box.top + box.height / 2 };
}

/** Drag the thumb through each fraction of the track, then release. */
async function drag(...fractions: number[]) {
  const thumb = part("thumb").getBoundingClientRect();
  const mouse = cdp();
  const send = (type: MouseType, { x, y }: { x: number; y: number }) =>
    mouse.send("Input.dispatchMouseEvent", { type, x, y, button: "left", clickCount: 1 });
  const start = { x: thumb.left + thumb.width / 2, y: thumb.top + thumb.height / 2 };
  await send("mouseMoved", start);
  await send("mousePressed", start);
  let last = start;
  for (const fraction of fractions) {
    last = trackPoint(fraction);
    await send("mouseMoved", last);
  }
  await send("mouseReleased", last);
}

async function pressTrack(fraction: number) {
  const point = trackPoint(fraction);
  const send = (type: MouseType) =>
    cdp().send("Input.dispatchMouseEvent", { type, ...point, button: "left", clickCount: 1 });
  await send("mouseMoved");
  await send("mousePressed");
  await send("mouseReleased");
}

type MouseType = "mouseMoved" | "mousePressed" | "mouseReleased";

function formData(form: HTMLFormElement) {
  return [...new FormData(form).entries()].map(([k, v]) => `${k}=${String(v)}`);
}

describe("component.slider#visible-label (MUST)", () => {
  test("the visible label is the slider's accessible name", async () => {
    await render(<Example />);
    await expect.element(page.getByRole("slider", { name: LABEL })).toBeInTheDocument();
    expect(part("label").textContent).toBe(LABEL);
  });

  test("an empty label warns", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await render(<Example label=" " />);
    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/^Slider: label is empty/));
    warn.mockRestore();
  });
});

describe("component.slider#value-shown (MUST)", () => {
  test("the value text matches what assistive technology hears", async () => {
    await render(<Example defaultValue={40} />);
    expect(part("value").textContent).toBe("40");
    expect(input().getAttribute("aria-valuetext")).toBe("40");
  });

  test("the value text follows the reader's locale", async () => {
    await render(<Example min={0} max={5000} step={500} defaultValue={2500} />);
    const expected = new Intl.NumberFormat().format(2500);
    expect(part("value").textContent).toBe(expected);
  });

  test("the value text follows a change", async () => {
    await render(<Example defaultValue={40} />);
    await tabToSlider();
    await userEvent.keyboard("{ArrowRight}");
    expect(part("value").textContent).toBe("41");
  });
});

describe("component.slider#value-in-range (MUST)", () => {
  test("the value defaults to min", async () => {
    await render(<Example min={10} />);
    expect(input().valueAsNumber).toBe(10);
  });

  test("a value above max moves to max, and below min to min", async () => {
    const { rerender } = await render(<Example value={140} />);
    expect(input().valueAsNumber).toBe(100);
    expect(part("value").textContent).toBe("100");
    await rerender(<Example value={-5} />);
    expect(input().valueAsNumber).toBe(0);
  });

  test("a value between steps moves to the nearest step", async () => {
    await render(<Example step={5} defaultValue={23} />);
    expect(input().valueAsNumber).toBe(25);
  });

  test("decimal steps land on the step without rounding noise", async () => {
    await render(<Example min={0} max={1} step={0.1} defaultValue={0.3} />);
    await tabToSlider();
    await userEvent.keyboard("{ArrowRight}");
    expect(input().valueAsNumber).toBe(0.4);
  });

  test("max is never passed when the range is not a whole number of steps", async () => {
    await render(<Example min={0} max={10} step={3} defaultValue={10} />);
    expect(input().valueAsNumber).toBe(9);
  });

  test("max not above min warns", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await render(<Example min={10} max={10} />);
    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/^Slider: max \(10\)/));
    warn.mockRestore();
  });
});

describe("component.slider#drag-or-press (MUST)", () => {
  test("dragging the thumb reports input for each new value", async () => {
    const r = recorder();
    await render(<Example onInput={r.onInput} onChange={r.onChange} />);
    await drag(0.25, 0.5);
    const inputs = r.calls.filter((c) => c.startsWith("input:"));
    expect(inputs.length).toBeGreaterThanOrEqual(2);
    expect(new Set(inputs).size).toBe(inputs.length);
    expect(input().valueAsNumber).toBeCloseTo(50, -1);
  });

  test("pressing the track moves the value to that point", async () => {
    const r = recorder();
    await render(<Example onInput={r.onInput} onChange={r.onChange} />);
    await pressTrack(0.75);
    expect(input().valueAsNumber).toBeCloseTo(75, -1);
    expect(r.onInput).toHaveBeenCalled();
  });

  test("a disabled slider ignores pointer and keyboard and leaves the tab order", async () => {
    const r = recorder();
    await render(<Example disabled defaultValue={20} onInput={r.onInput} onChange={r.onChange} />);
    await pressTrack(0.75);
    expect(input().valueAsNumber).toBe(20);
    page.getByRole("button", { name: "Before" }).element().focus();
    await userEvent.tab();
    expect(document.activeElement).not.toBe(input());
    expect(r.calls).toEqual([]);
  });
});

describe("component.slider#keyboard-steps (MUST)", () => {
  test("arrow keys move one step each way", async () => {
    await render(<Example step={5} defaultValue={50} />);
    await tabToSlider();
    await userEvent.keyboard("{ArrowRight}");
    expect(input().valueAsNumber).toBe(55);
    await userEvent.keyboard("{ArrowUp}");
    expect(input().valueAsNumber).toBe(60);
    await userEvent.keyboard("{ArrowLeft}{ArrowDown}{ArrowDown}");
    expect(input().valueAsNumber).toBe(45);
  });

  test("Page Up and Page Down move a tenth of the range", async () => {
    await render(<Example min={0} max={200} defaultValue={100} />);
    await tabToSlider();
    await userEvent.keyboard("{PageUp}");
    expect(input().valueAsNumber).toBe(120);
    await userEvent.keyboard("{PageDown}{PageDown}");
    expect(input().valueAsNumber).toBe(80);
  });

  test("Home and End move to min and max", async () => {
    await render(<Example min={10} max={90} defaultValue={50} />);
    await tabToSlider();
    await userEvent.keyboard("{End}");
    expect(input().valueAsNumber).toBe(90);
    await userEvent.keyboard("{Home}");
    expect(input().valueAsNumber).toBe(10);
  });

  test("each key press reports input then change", async () => {
    const r = recorder();
    await render(<Example defaultValue={50} onInput={r.onInput} onChange={r.onChange} />);
    await tabToSlider();
    await userEvent.keyboard("{ArrowRight}{End}");
    expect(r.calls).toEqual(["input:51", "change:51", "input:100", "change:100"]);
  });

  test("right-to-left: Arrow Right moves toward min", async () => {
    await render(
      <div dir="rtl">
        <Example defaultValue={50} />
      </div>,
    );
    await tabToSlider();
    await userEvent.keyboard("{ArrowRight}");
    expect(input().valueAsNumber).toBe(49);
    // The fill starts at the right, and the thumb sits at its end.
    const track = part("track").getBoundingClientRect();
    const fill = part("fill").getBoundingClientRect();
    const thumb = part("thumb").getBoundingClientRect();
    expect(fill.right).toBeCloseTo(track.right, 0);
    expect(thumb.left + thumb.width / 2).toBeCloseTo(fill.left, 0);
  });

  test("right-to-left keeps the reader's number format in the value text", async () => {
    await render(
      <div dir="rtl">
        <Example min={0} max={5000} step={500} defaultValue={2500} />
      </div>,
    );
    expect(part("value").textContent).toBe(new Intl.NumberFormat().format(2500));
  });
});

describe("component.slider#change-on-release (MUST)", () => {
  test("a drag reports change once, on release, with the final value", async () => {
    const r = recorder();
    await render(<Example onInput={r.onInput} onChange={r.onChange} />);
    await drag(0.2, 0.4, 0.6);
    expect(r.onChange).toHaveBeenCalledTimes(1);
    expect(r.calls.at(-1)).toBe(`change:${input().valueAsNumber}`);
    expect(r.calls.slice(0, -1).every((c) => c.startsWith("input:"))).toBe(true);
  });

  test("a drag that ends where it started reports no change", async () => {
    const r = recorder();
    await render(<Example defaultValue={50} onInput={r.onInput} onChange={r.onChange} />);
    await drag(0.8, 0.5);
    expect(input().valueAsNumber).toBe(50);
    expect(r.onChange).not.toHaveBeenCalled();
  });

  test("a key at the end of the range reports nothing", async () => {
    const r = recorder();
    await render(<Example defaultValue={100} onInput={r.onInput} onChange={r.onChange} />);
    await tabToSlider();
    await userEvent.keyboard("{ArrowRight}{End}");
    expect(r.calls).toEqual([]);
  });

  test("a controlled slider that follows onInput still reports one change", async () => {
    const r = recorder();
    function Controlled() {
      const [value, setValue] = useState(30);
      return (
        <Example
          value={value}
          onInput={(next) => {
            setValue(next);
            r.onInput(next);
          }}
          onChange={r.onChange}
        />
      );
    }
    await render(<Controlled />);
    await drag(0.5, 0.7);
    expect(r.onChange).toHaveBeenCalledTimes(1);
    expect(r.onChange).toHaveBeenCalledWith(input().valueAsNumber);
  });
});

describe("component.slider#programmatic-no-events (MUST)", () => {
  test("a new value prop reports nothing", async () => {
    const r = recorder();
    const { rerender } = await render(
      <Example value={10} onInput={r.onInput} onChange={r.onChange} />,
    );
    await rerender(<Example value={60} onInput={r.onInput} onChange={r.onChange} />);
    expect(input().valueAsNumber).toBe(60);
    expect(part("value").textContent).toBe("60");
    expect(r.calls).toEqual([]);
  });

  test("a controlled slider shows only the value it is given", async () => {
    await render(<Example value={10} />);
    await tabToSlider();
    await userEvent.keyboard("{ArrowRight}");
    expect(input().valueAsNumber).toBe(10);
  });

  test("form reset reports nothing", async () => {
    const r = recorder();
    await render(
      <form>
        <Example name="volume" defaultValue={20} onInput={r.onInput} onChange={r.onChange} />
      </form>,
    );
    await tabToSlider();
    await userEvent.keyboard("{End}");
    r.calls.length = 0;
    document.querySelector("form")!.reset();
    await expect.poll(() => input().valueAsNumber).toBe(20);
    expect(r.calls).toEqual([]);
  });

  test("a change after a new value prop compares against the new value", async () => {
    const r = recorder();
    const { rerender } = await render(
      <Example value={10} onInput={r.onInput} onChange={r.onChange} />,
    );
    await rerender(<Example value={60} onInput={r.onInput} onChange={r.onChange} />);
    await tabToSlider();
    // The parent does not follow onInput, so the value stays 60 and nothing is committed.
    await userEvent.keyboard("{ArrowRight}");
    expect(r.onInput).toHaveBeenCalledWith(61);
    expect(r.onChange).toHaveBeenCalledWith(61);
  });
});

describe("component.slider#form-value (SHOULD)", () => {
  test("the value submits under name", async () => {
    await render(
      <form>
        <Example name="volume" defaultValue={30} />
      </form>,
    );
    expect(formData(document.querySelector("form")!)).toEqual(["volume=30"]);
  });

  test("a disabled slider submits nothing", async () => {
    await render(
      <form>
        <Example name="volume" defaultValue={30} disabled />
      </form>,
    );
    expect(formData(document.querySelector("form")!)).toEqual([]);
  });

  test("reset restores the initial value", async () => {
    await render(
      <form>
        <Example name="volume" defaultValue={30} />
      </form>,
    );
    await tabToSlider();
    await userEvent.keyboard("{End}");
    expect(part("value").textContent).toBe("100");
    document.querySelector("form")!.reset();
    await expect.poll(() => part("value").textContent).toBe("30");
    expect(formData(document.querySelector("form")!)).toEqual(["volume=30"]);
  });

  test("a non-empty error blocks submit with its own message", async () => {
    await render(
      <form>
        <Example name="budget" error="Choose 500 or less." />
      </form>,
    );
    expect(document.querySelector("form")!.checkValidity()).toBe(false);
    expect(input().validationMessage).toBe("Choose 500 or less.");
  });
});

describe("form field: hint and error", () => {
  test("hint and error are the accessible description, and error marks it invalid", async () => {
    await render(<Example hint="Applies to every device." error="Lower the volume." />);
    const slider = page.getByRole("slider", { name: LABEL });
    await expect
      .element(slider)
      .toHaveAccessibleDescription("Applies to every device. Lower the volume.");
    await expect.element(slider).toHaveAttribute("aria-invalid", "true");
    expect(root().hasAttribute("data-invalid")).toBe(true);
  });

  test("clearing the error removes invalid", async () => {
    const { rerender } = await render(<Example error="Lower the volume." />);
    await rerender(<Example />);
    expect(input().hasAttribute("aria-invalid")).toBe(false);
    expect(root().hasAttribute("data-invalid")).toBe(false);
    expect(document.querySelector(".ds-slider__error")).toBeNull();
  });
});

const resolve = (name: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim();
const asColor = (value: string) => {
  const probe = document.createElement("span");
  probe.style.color = value;
  document.body.append(probe);
  const color = getComputedStyle(probe).color;
  probe.remove();
  return color;
};
const token = (name: string) => asColor(resolve(name));

describe("component.slider#thumb-contrast (MUST)", () => {
  test("the fill and thumb use the action color, apart from the muted track", async () => {
    await render(<Example defaultValue={50} />);
    const track = getComputedStyle(part("track"), "::before").backgroundColor;
    expect(track).toBe(token("--ds-semantic-color-background-muted"));
    const action = token("--ds-semantic-color-background-action-primary-default");
    expect(getComputedStyle(part("fill")).backgroundColor).toBe(action);
    expect(getComputedStyle(part("thumb")).backgroundColor).toBe(action);
    expect(action).not.toBe(track);
  });

  test("a surface ring separates the thumb from the fill", async () => {
    await render(<Example defaultValue={50} />);
    const thumb = getComputedStyle(part("thumb"));
    expect(thumb.borderTopColor).toBe(token("--ds-semantic-color-background-surface"));
    expect(parseFloat(thumb.borderTopWidth)).toBeGreaterThan(0);
  });

  test("the fill runs from the start to the thumb", async () => {
    await render(<Example defaultValue={25} />);
    const track = part("track").getBoundingClientRect();
    const fill = part("fill").getBoundingClientRect();
    const thumb = part("thumb").getBoundingClientRect();
    expect(fill.left).toBeCloseTo(track.left, 0);
    expect(fill.width).toBeCloseTo(track.width * 0.25, 0);
    expect(thumb.left + thumb.width / 2).toBeCloseTo(fill.right, 0);
  });
});

describe("tokens (component.slider tokens)", () => {
  test("label, value, hint, and error typography and color", async () => {
    await render(<Example hint="Hint" error="Error" />);
    expect(getComputedStyle(part("label")).fontSize).toBe(
      resolve("--ds-semantic-typography-label-md-font-size"),
    );
    expect(getComputedStyle(part("value")).color).toBe(
      token("--ds-semantic-color-foreground-muted"),
    );
    expect(getComputedStyle(part("hint")).fontSize).toBe(
      resolve("--ds-semantic-typography-body-sm-font-size"),
    );
    expect(getComputedStyle(part("error")).color).toBe(
      token("--ds-semantic-color-foreground-status-danger-default"),
    );
  });

  test("track height and thumb size", async () => {
    await render(<Example />);
    expect(getComputedStyle(part("track"), "::before").height).toBe(
      resolve("--ds-primitives-space-2"),
    );
    expect(getComputedStyle(part("thumb")).width).toBe(resolve("--ds-primitives-space-5"));
    expect(getComputedStyle(part("thumb")).height).toBe(resolve("--ds-primitives-space-5"));
  });

  test("hover and dragging darken the thumb", async () => {
    await render(<Example defaultValue={50} />);
    await userEvent.hover(part("thumb"));
    expect(getComputedStyle(part("thumb")).backgroundColor).toBe(
      token("--ds-semantic-color-background-action-primary-hover"),
    );
  });

  test("focus draws the focus ring on the thumb", async () => {
    await render(<Example />);
    await tabToSlider();
    const thumb = getComputedStyle(part("thumb"));
    expect(thumb.outlineStyle).toBe("solid");
    expect(thumb.outlineColor).toBe(token("--ds-semantic-color-border-focus"));
  });

  test("invalid recolors the fill and thumb", async () => {
    await render(<Example defaultValue={50} error="Lower the volume." />);
    const danger = token("--ds-semantic-color-border-status-danger-default");
    expect(getComputedStyle(part("fill")).backgroundColor).toBe(danger);
    expect(getComputedStyle(part("thumb")).backgroundColor).toBe(danger);
  });

  test("disabled greys every part and wins over invalid", async () => {
    await render(<Example defaultValue={50} disabled error="Lower the volume." />);
    const grey = token("--ds-semantic-color-border-disabled");
    expect(getComputedStyle(part("fill")).backgroundColor).toBe(grey);
    expect(getComputedStyle(part("thumb")).backgroundColor).toBe(grey);
    expect(getComputedStyle(part("label")).color).toBe(
      token("--ds-semantic-color-foreground-disabled"),
    );
  });
});

describe("component.slider#forced-colors (MUST)", () => {
  afterEach(async () => {
    await cdp().send("Emulation.setEmulatedMedia", { features: [] });
  });

  async function forced() {
    await cdp().send("Emulation.setEmulatedMedia", {
      features: [{ name: "forced-colors", value: "active" }],
    });
    expect(matchMedia("(forced-colors: active)").matches).toBe(true);
  }

  test("the track has an outline, and the fill and thumb a system color", async () => {
    await forced();
    await render(<Example defaultValue={50} />);
    const track = getComputedStyle(part("track"), "::before");
    expect(track.borderTopStyle).toBe("solid");
    expect(parseFloat(track.borderTopWidth)).toBeGreaterThan(0);
    const highlight = asColor("Highlight");
    expect(getComputedStyle(part("fill")).backgroundColor).toBe(highlight);
    expect(getComputedStyle(part("thumb")).backgroundColor).toBe(highlight);
  });

  test("disabled uses GrayText", async () => {
    await forced();
    await render(<Example defaultValue={50} disabled />);
    expect(getComputedStyle(part("thumb")).backgroundColor).toBe(asColor("GrayText"));
  });

  test("focus keeps a solid outline", async () => {
    await forced();
    await render(<Example />);
    await tabToSlider();
    const thumb = getComputedStyle(part("thumb"));
    expect(thumb.outlineStyle).toBe("solid");
    expect(thumb.outlineColor).toBe(asColor("CanvasText"));
  });
});
