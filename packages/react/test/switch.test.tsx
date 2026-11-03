import { useState } from "react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { cdp, page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { Switch, type SwitchProps } from "../src/switch/Switch";

function Example(props: Partial<SwitchProps>) {
  return (
    <>
      <button type="button">Before</button>
      <Switch label="Email notifications" {...props} />
      <button type="button">After</button>
    </>
  );
}

const input = () => document.querySelector<HTMLInputElement>('input[role="switch"]')!;
const part = (name: string) => document.querySelector<HTMLElement>(`.ds-switch__${name}`)!;
const sw = () => page.getByRole("switch", { name: "Email notifications" });

async function tabToSwitch() {
  page.getByRole("button", { name: "Before" }).element().focus();
  await userEvent.tab();
}

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

/** Thumb offset from the track's inline start, in pixels. */
function thumbOffset() {
  const track = part("control").getBoundingClientRect();
  const thumb = part("indicator").getBoundingClientRect();
  return { fromLeft: thumb.left - track.left, fromRight: track.right - thumb.right };
}

describe("component.switch#stable-visible-label (MUST)", () => {
  test("the visible label is the accessible name in both states", async () => {
    await render(<Example />);
    await expect.element(sw()).toBeInTheDocument();
    expect(part("label").textContent).toBe("Email notifications");
    expect(part("label").getBoundingClientRect().width).toBeGreaterThan(0);
    await userEvent.click(part("control"));
    await expect.element(sw()).toBeChecked();
    expect(part("label").textContent).toBe("Email notifications");
  });

  test("warns when the label is empty", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await render(<Switch label="  " />);
    expect(warn.mock.calls.flat().join("\n")).toMatch(/label is empty/);
    warn.mockRestore();
  });
});

describe("component.switch#toggle-on-activate (MUST)", () => {
  test("clicking the track toggles and reports input then change", async () => {
    const calls: string[] = [];
    await render(
      <Example
        onInput={(c) => calls.push(`input:${c}`)}
        onChange={(c) => calls.push(`change:${c}`)}
      />,
    );
    await userEvent.click(part("control"));
    expect(input().checked).toBe(true);
    expect(calls).toEqual(["input:true", "change:true"]);
    await userEvent.click(part("control"));
    expect(input().checked).toBe(false);
    expect(calls).toEqual(["input:true", "change:true", "input:false", "change:false"]);
  });

  test("clicking the label toggles", async () => {
    const onChange = vi.fn();
    await render(<Example onChange={onChange} />);
    await userEvent.click(part("label"));
    expect(input().checked).toBe(true);
    expect(onChange).toHaveBeenCalledExactlyOnceWith(true);
  });

  test("Space toggles and reports input then change", async () => {
    const calls: string[] = [];
    await render(
      <Example
        onInput={(c) => calls.push(`input:${c}`)}
        onChange={(c) => calls.push(`change:${c}`)}
      />,
    );
    await tabToSwitch();
    expect(document.activeElement).toBe(input());
    await userEvent.keyboard(" ");
    expect(input().checked).toBe(true);
    expect(calls).toEqual(["input:true", "change:true"]);
  });

  test("a disabled switch does not toggle and is skipped by Tab", async () => {
    const onChange = vi.fn();
    await render(<Example disabled onChange={onChange} />);
    await userEvent.click(part("label"), { force: true });
    expect(input().checked).toBe(false);
    expect(onChange).not.toHaveBeenCalled();
    await tabToSwitch();
    expect(document.activeElement?.textContent).toBe("After");
  });
});

describe("component.switch#programmatic-no-events (MUST)", () => {
  test("changing checked from the parent reports nothing", async () => {
    const onInput = vi.fn();
    const onChange = vi.fn();
    const screen = await render(<Example checked={false} onInput={onInput} onChange={onChange} />);
    await screen.rerender(<Example checked onInput={onInput} onChange={onChange} />);
    expect(input().checked).toBe(true);
    await screen.rerender(<Example checked={false} onInput={onInput} onChange={onChange} />);
    expect(input().checked).toBe(false);
    expect(onInput).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
  });

  test("form reset reports nothing", async () => {
    const onChange = vi.fn();
    await render(
      <form>
        <Switch label="Email notifications" onChange={onChange} />
      </form>,
    );
    await userEvent.click(part("control"));
    onChange.mockClear();
    document.querySelector("form")!.reset();
    await expect.element(sw()).not.toBeChecked();
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("component.switch#immediate-effect (MUST)", () => {
  test("change fires on each toggle with no submit, and a failed save restores the prior state", async () => {
    function Setting() {
      const [on, setOn] = useState(false);
      const [error, setError] = useState<string>();
      return (
        <Switch
          label="Email notifications"
          checked={on}
          error={error}
          onChange={(next) => {
            setOn(next);
            // The save fails: restore the prior state and explain.
            setOn(!next);
            setError("Could not save. Try again.");
          }}
        />
      );
    }
    await render(<Setting />);
    await userEvent.click(part("control"));
    await expect.element(sw()).not.toBeChecked();
    await expect.element(sw()).toHaveAccessibleDescription("Could not save. Try again.");
    await expect.element(sw()).toHaveAttribute("aria-invalid", "true");
  });

  test("a controlled switch follows onChange immediately", async () => {
    function Controlled() {
      const [on, setOn] = useState(false);
      return (
        <>
          <Switch label="Email notifications" checked={on} onChange={setOn} />
          <output>{String(on)}</output>
        </>
      );
    }
    await render(<Controlled />);
    await userEvent.click(part("control"));
    expect(document.querySelector("output")?.textContent).toBe("true");
    await expect.element(sw()).toBeChecked();
  });
});

describe("component.switch#form-value (SHOULD)", () => {
  const data = () => [...new FormData(document.querySelector("form")!).entries()];

  test("records the value only when on", async () => {
    await render(
      <form>
        <Switch label="Email notifications" name="email" value="yes" />
      </form>,
    );
    expect(data()).toEqual([]);
    await userEvent.click(part("control"));
    expect(data()).toEqual([["email", "yes"]]);
  });

  test("the value defaults to on", async () => {
    await render(
      <form>
        <Switch label="Email notifications" name="email" defaultChecked />
      </form>,
    );
    expect(data()).toEqual([["email", "on"]]);
  });

  test("a disabled switch records nothing", async () => {
    await render(
      <form>
        <Switch label="Email notifications" name="email" defaultChecked disabled />
      </form>,
    );
    expect(data()).toEqual([]);
  });

  test("reset restores the initial state", async () => {
    await render(
      <form>
        <Switch label="Email notifications" name="email" defaultChecked />
      </form>,
    );
    await userEvent.click(part("control"));
    await expect.element(sw()).not.toBeChecked();
    document.querySelector("form")!.reset();
    await expect.element(sw()).toBeChecked();
    expect(data()).toEqual([["email", "on"]]);
  });

  test("a non-empty error blocks the form from submitting (pattern.form-field)", async () => {
    await render(
      <form>
        <Switch label="Email notifications" error="Could not save." />
      </form>,
    );
    expect(document.querySelector("form")!.checkValidity()).toBe(false);
    expect(document.querySelector("input")!.validationMessage).toBe("Could not save.");
  });
});

describe("accessibility", () => {
  test("exposes the switch role, hint and error as its description", async () => {
    await render(<Example hint="Sent weekly." error="Could not save." />);
    await expect.element(sw()).toHaveAccessibleDescription("Sent weekly. Could not save.");
    await expect.element(sw()).toHaveAttribute("aria-invalid", "true");
  });

  test("an empty error is not invalid", async () => {
    await render(<Example error="" />);
    expect(input().getAttribute("aria-invalid")).toBeNull();
    expect(part("error")).toBeNull();
  });
});

describe("component.switch#state-not-color-alone (MUST)", () => {
  test("the thumb sits at the start when off and at the end when on", async () => {
    await render(<Example />);
    const off = thumbOffset();
    expect(off.fromLeft).toBeLessThan(off.fromRight);
    await userEvent.click(part("control"));
    const on = thumbOffset();
    expect(on.fromLeft).toBeGreaterThan(on.fromRight);
  });

  test("the thumb follows the inline direction in right-to-left layouts", async () => {
    await render(
      <div dir="rtl">
        <Example />
      </div>,
    );
    const off = thumbOffset();
    expect(off.fromRight).toBeLessThan(off.fromLeft);
    await userEvent.click(part("control"));
    const on = thumbOffset();
    expect(on.fromRight).toBeGreaterThan(on.fromLeft);
  });

  test("a disabled switch still shows its position", async () => {
    await render(<Example disabled defaultChecked />);
    const on = thumbOffset();
    expect(on.fromLeft).toBeGreaterThan(on.fromRight);
  });
});

describe("component.switch#forced-colors (MUST)", () => {
  afterEach(async () => {
    await cdp().send("Emulation.setEmulatedMedia", { features: [] });
  });

  test("track outline, thumb, and focus ring stay visible", async () => {
    await cdp().send("Emulation.setEmulatedMedia", {
      features: [{ name: "forced-colors", value: "active" }],
    });
    expect(matchMedia("(forced-colors: active)").matches).toBe(true);
    await render(<Example />);
    await tabToSwitch();
    const track = getComputedStyle(part("control"));
    const thumb = getComputedStyle(part("indicator"));
    expect(track.borderTopStyle).toBe("solid");
    expect(parseFloat(track.borderTopWidth)).toBeGreaterThan(0);
    expect(track.borderTopColor).not.toBe(track.backgroundColor);
    expect(thumb.backgroundColor).toBe(asColor("CanvasText"));
    expect(thumb.backgroundColor).not.toBe(track.backgroundColor);
    expect(track.outlineStyle).toBe("solid");
    expect(parseFloat(track.outlineWidth)).toBeGreaterThan(0);
    expect(track.outlineColor).toBe(asColor("Highlight"));
    await userEvent.keyboard(" ");
    const checkedTrack = getComputedStyle(part("control"));
    expect(getComputedStyle(part("indicator")).backgroundColor).not.toBe(
      checkedTrack.backgroundColor,
    );
  });
});

describe("token bindings", () => {
  test("field and choice gaps", async () => {
    await render(<Example hint="Sent weekly." />);
    expect(getComputedStyle(document.querySelector(".ds-switch")!).rowGap).toBe(
      resolve("--ds-primitives-space-1"),
    );
    expect(getComputedStyle(part("choice")).columnGap).toBe(resolve("--ds-primitives-space-2"));
  });

  test("control and indicator base", async () => {
    await render(<Example />);
    const track = getComputedStyle(part("control"));
    expect(track.backgroundColor).toBe(token("--ds-semantic-color-background-surface"));
    expect(track.borderTopColor).toBe(token("--ds-semantic-color-border-default"));
    expect(track.borderTopLeftRadius).toBe(resolve("--ds-semantic-radius-pill"));
    expect(getComputedStyle(part("indicator")).backgroundColor).toBe(
      token("--ds-semantic-color-foreground-default"),
    );
  });

  test("control hover: strong border only while unchecked", async () => {
    await render(<Example />);
    await userEvent.hover(part("control"));
    expect(getComputedStyle(part("control")).borderTopColor).toBe(
      token("--ds-semantic-color-border-strong"),
    );
    await userEvent.click(part("control"));
    expect(getComputedStyle(part("control")).borderTopColor).toBe(
      token("--ds-semantic-color-border-action-primary-default"),
    );
  });

  test("control focus: focus ring color", async () => {
    await render(<Example />);
    await tabToSwitch();
    expect(getComputedStyle(part("control")).outlineColor).toBe(
      token("--ds-semantic-color-border-focus"),
    );
  });

  test("checked: primary background and border, on-primary thumb", async () => {
    await render(<Example defaultChecked />);
    const track = getComputedStyle(part("control"));
    expect(track.backgroundColor).toBe(
      token("--ds-semantic-color-background-action-primary-default"),
    );
    expect(track.borderTopColor).toBe(token("--ds-semantic-color-border-action-primary-default"));
    expect(getComputedStyle(part("indicator")).backgroundColor).toBe(
      token("--ds-semantic-color-foreground-on-action-primary"),
    );
  });

  test("invalid: danger border; checked and invalid keep the checked background", async () => {
    await render(<Example defaultChecked error="Could not save." />);
    const track = getComputedStyle(part("control"));
    expect(track.borderTopColor).toBe(token("--ds-semantic-color-border-status-danger-default"));
    expect(track.backgroundColor).toBe(
      token("--ds-semantic-color-background-action-primary-default"),
    );
    await userEvent.hover(part("control"));
    expect(getComputedStyle(part("control")).borderTopColor).toBe(
      token("--ds-semantic-color-border-status-danger-default"),
    );
  });

  test("disabled overrides checked and invalid", async () => {
    await render(<Example defaultChecked disabled error="Could not save." hint="Sent weekly." />);
    const track = getComputedStyle(part("control"));
    expect(track.backgroundColor).toBe(token("--ds-semantic-color-background-disabled"));
    expect(track.borderTopColor).toBe(token("--ds-semantic-color-border-disabled"));
    const disabled = token("--ds-semantic-color-foreground-disabled");
    expect(getComputedStyle(part("indicator")).backgroundColor).toBe(disabled);
    expect(getComputedStyle(part("label")).color).toBe(disabled);
    expect(getComputedStyle(part("hint")).color).toBe(disabled);
  });

  test("label, hint, and error typography and color", async () => {
    await render(<Example hint="Sent weekly." error="Could not save." />);
    const label = getComputedStyle(part("label"));
    expect(label.color).toBe(token("--ds-semantic-color-foreground-default"));
    expect(label.fontSize).toBe(resolve("--ds-semantic-typography-body-md-font-size"));
    expect(label.fontWeight).toBe(resolve("--ds-semantic-typography-body-md-font-weight"));
    const hint = getComputedStyle(part("hint"));
    expect(hint.color).toBe(token("--ds-semantic-color-foreground-muted"));
    expect(hint.fontSize).toBe(resolve("--ds-semantic-typography-body-sm-font-size"));
    const error = getComputedStyle(part("error"));
    expect(error.color).toBe(token("--ds-semantic-color-foreground-status-danger-default"));
    expect(error.fontSize).toBe(resolve("--ds-semantic-typography-body-sm-font-size"));
  });
});
