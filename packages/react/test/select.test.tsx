import { useState } from "react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { cdp, page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { Select, type SelectItem, type SelectProps } from "../src/select/Select";

const LABEL = "Shirt size";
const SIZES: SelectItem[] = [
  { value: "s", label: "Small" },
  { value: "m", label: "Medium" },
  { value: "l", label: "Large" },
];

function Example(props: Partial<SelectProps>) {
  return (
    <>
      <button type="button">Before</button>
      <Select label={LABEL} options={SIZES} {...props} />
    </>
  );
}

const select = () => document.querySelector<HTMLSelectElement>("select")!;
const control = () => page.elementLocator(select());
const root = () => document.querySelector<HTMLElement>(".ds-select")!;
const part = (name: string) => document.querySelector<HTMLElement>(`.ds-select__${name}`)!;

/** Record the order of input and change calls. */
function recorder() {
  const calls: string[] = [];
  return {
    calls,
    onInput: vi.fn((value: string) => calls.push(`input:${value}`)),
    onChange: vi.fn((value: string) => calls.push(`change:${value}`)),
  };
}

async function tabToSelect() {
  page.getByRole("button", { name: "Before" }).element().focus();
  await userEvent.tab();
  expect(document.activeElement).toBe(select());
}

function formData(form: HTMLFormElement) {
  return [...new FormData(form).entries()].map(([k, v]) => `${k}=${String(v)}`);
}

describe("component.select#named-choices (MUST)", () => {
  test("each choice shows its text and carries its value", async () => {
    await render(<Example />);
    const options = [...select().options];
    expect(options.map((o) => [o.value, o.textContent])).toEqual([
      ["s", "Small"],
      ["m", "Medium"],
      ["l", "Large"],
    ]);
  });

  test("an unavailable choice stays listed by its text but cannot be chosen", async () => {
    await render(
      <Example
        options={[
          { value: "s", label: "Small" },
          { value: "m", label: "Medium", disabled: true },
          { label: "Tall", disabled: true, options: [{ value: "lt", label: "Large tall" }] },
        ]}
      />,
    );
    const medium = [...select().options].find((o) => o.value === "m")!;
    const tall = [...select().options].find((o) => o.value === "lt")!;
    expect(medium.textContent).toBe("Medium");
    expect(medium.disabled).toBe(true);
    expect(tall.textContent).toBe("Large tall");
    expect(tall.matches(":disabled")).toBe(true);
    // Keyboard navigation from Small skips both unavailable choices.
    await tabToSelect();
    await userEvent.keyboard("{ArrowDown}");
    expect(select().value).toBe("s");
  });

  test("an empty choice text or a repeated value logs a warning", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await render(
      <Example
        options={[
          { value: "s", label: "Small" },
          { value: "s", label: "Small again" },
          { value: "m", label: " " },
        ]}
      />,
    );
    const messages = warn.mock.calls.map((c) => String(c[0]));
    expect(messages.some((m) => m.startsWith("Select:") && m.includes('"s" repeats'))).toBe(true);
    expect(messages.some((m) => m.startsWith("Select:") && m.includes("no visible text"))).toBe(
      true,
    );
    warn.mockRestore();
  });

  test("an empty label logs a warning", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await render(<Select label="" options={SIZES} />);
    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/^Select: label is empty/));
    warn.mockRestore();
  });
});

describe("component.select#stable-selection (MUST)", () => {
  test("new, removed, and reordered choices keep the current value while it remains", async () => {
    const r = recorder();
    const screen = await render(<Example defaultValue="m" onChange={r.onChange} />);
    expect(select().value).toBe("m");
    await screen.rerender(
      <Example
        defaultValue="m"
        onChange={r.onChange}
        options={[
          { value: "xl", label: "Extra large" },
          { value: "m", label: "Medium" },
          { value: "xs", label: "Extra small" },
        ]}
      />,
    );
    expect(select().value).toBe("m");
    expect(r.calls).toEqual([]);
  });

  test("a controlled value stays selected when choices change", async () => {
    const screen = await render(<Example value="l" />);
    await screen.rerender(
      <Example value="l" options={[{ value: "l", label: "Large" }, ...SIZES.slice(0, 2)]} />,
    );
    expect(select().value).toBe("l");
  });

  test("when the value is removed, the platform picks a choice and no event fires", async () => {
    const r = recorder();
    const screen = await render(
      <form>
        <Select label={LABEL} name="size" options={SIZES} defaultValue="l" {...r} />
      </form>,
    );
    await screen.rerender(
      <form>
        <Select label={LABEL} name="size" options={SIZES.slice(0, 2)} defaultValue="l" {...r} />
      </form>,
    );
    // Chromium selects the first available choice.
    expect(select().value).toBe("s");
    expect(formData(document.querySelector("form")!)).toEqual(["size=s"]);
    // The kept value follows what is shown, so the removed choice does not come back on its own.
    await screen.rerender(
      <form>
        <Select label={LABEL} name="size" options={SIZES} defaultValue="l" {...r} />
      </form>,
    );
    expect(select().value).toBe("s");
    expect(r.calls).toEqual([]);
  });
});

describe("component.select#form-value (SHOULD)", () => {
  test("the selected choice submits under the name", async () => {
    await render(
      <form>
        <Select label={LABEL} name="size" options={SIZES} defaultValue="m" />
      </form>,
    );
    const form = document.querySelector("form")!;
    expect(formData(form)).toEqual(["size=m"]);
    await userEvent.selectOptions(control(), "l");
    expect(formData(form)).toEqual(["size=l"]);
  });

  test("with no value given, the first available choice is selected and submits", async () => {
    await render(
      <form>
        <Select
          label={LABEL}
          name="size"
          options={[{ value: "s", label: "Small", disabled: true }, ...SIZES.slice(1)]}
        />
      </form>,
    );
    expect(formData(document.querySelector("form")!)).toEqual(["size=m"]);
  });

  test("a disabled choice or a choice in a disabled group submits nothing", async () => {
    await render(
      <form>
        <Select
          label="A"
          name="a"
          value="m"
          options={[
            { value: "s", label: "Small" },
            { value: "m", label: "Medium", disabled: true },
          ]}
        />
        <Select
          label="B"
          name="b"
          value="lt"
          options={[
            { value: "s", label: "Small" },
            { label: "Tall", disabled: true, options: [{ value: "lt", label: "Large tall" }] },
          ]}
        />
      </form>,
    );
    expect(formData(document.querySelector("form")!)).toEqual([]);
  });

  test("a disabled select submits nothing", async () => {
    await render(
      <form>
        <Select label={LABEL} name="size" options={SIZES} disabled />
      </form>,
    );
    expect(select().disabled).toBe(true);
    expect(formData(document.querySelector("form")!)).toEqual([]);
  });

  test("reset restores the initial selection without events", async () => {
    const r = recorder();
    await render(
      <form>
        <Select label={LABEL} name="size" options={SIZES} defaultValue="m" {...r} />
      </form>,
    );
    const form = document.querySelector("form")!;
    await userEvent.selectOptions(control(), "l");
    expect(formData(form)).toEqual(["size=l"]);
    r.calls.length = 0;
    form.reset();
    await expect.poll(() => select().value).toBe("m");
    expect(formData(form)).toEqual(["size=m"]);
    expect(r.calls).toEqual([]);
  });

  test("reset restores the first choice when no value was given", async () => {
    await render(
      <form>
        <Select label={LABEL} name="size" options={SIZES} />
      </form>,
    );
    await userEvent.selectOptions(control(), "l");
    document.querySelector("form")!.reset();
    await expect.poll(() => select().value).toBe("s");
  });

  test("a reset button leaves a controlled select on its value without events", async () => {
    const onChange = vi.fn();
    await render(
      <form>
        <Select label={LABEL} options={SIZES} value="l" onChange={onChange} />
        <button type="reset">Reset</button>
      </form>,
    );
    await userEvent.click(page.getByRole("button", { name: "Reset" }));
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(select().value).toBe("l");
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("events", () => {
  test("choosing fires input then change with the new value", async () => {
    const r = recorder();
    await render(<Example onInput={r.onInput} onChange={r.onChange} />);
    await userEvent.selectOptions(control(), "m");
    expect(select().value).toBe("m");
    expect(r.calls).toEqual(["input:m", "change:m"]);
  });

  test("a controlled select follows onChange", async () => {
    function Controlled() {
      const [value, setValue] = useState("s");
      return (
        <>
          <Select label={LABEL} options={SIZES} value={value} onChange={setValue} />
          <output>{value}</output>
        </>
      );
    }
    await render(<Controlled />);
    await userEvent.selectOptions(control(), "l");
    expect(document.querySelector("output")?.textContent).toBe("l");
    expect(select().value).toBe("l");
  });

  test("a controlled select that ignores onChange keeps its value", async () => {
    const onChange = vi.fn();
    await render(<Example value="s" onChange={onChange} />);
    await userEvent.selectOptions(control(), "l");
    expect(onChange).toHaveBeenCalledWith("l");
    await expect.poll(() => select().value).toBe("s");
  });

  test("a value set by the parent fires nothing", async () => {
    const r = recorder();
    const screen = await render(<Example value="s" {...r} />);
    await screen.rerender(<Example value="l" {...r} />);
    expect(select().value).toBe("l");
    expect(r.calls).toEqual([]);
  });
});

describe("keyboard (accessibility table)", () => {
  test("Tab moves focus to and from the control", async () => {
    await render(
      <>
        <Example />
        <button type="button">After</button>
      </>,
    );
    await tabToSelect();
    await userEvent.tab();
    expect(document.activeElement?.textContent).toBe("After");
  });

  test("a disabled select is skipped by Tab", async () => {
    await render(
      <>
        <Example disabled />
        <button type="button">After</button>
      </>,
    );
    page.getByRole("button", { name: "Before" }).element().focus();
    await userEvent.tab();
    expect(document.activeElement?.textContent).toBe("After");
  });

  test("typing a choice's text selects it", async () => {
    const r = recorder();
    await render(<Example {...r} />);
    await tabToSelect();
    await userEvent.keyboard("l");
    expect(select().value).toBe("l");
    expect(r.calls).toEqual(["input:l", "change:l"]);
  });
});

describe("parameters (pattern.form-field)", () => {
  test("label is the accessible name and the role is a single-choice selection", async () => {
    await render(<Example />);
    await expect.element(page.getByRole("combobox", { name: LABEL })).toBeInTheDocument();
    expect(select().multiple).toBe(false);
  });

  test("hint and error form the accessible description", async () => {
    await render(<Example hint="Sizes run small." error="Choose a size." />);
    await expect
      .element(page.getByRole("combobox", { name: LABEL }))
      .toHaveAccessibleDescription("Sizes run small. Choose a size.");
  });

  test("a non-empty error marks the control invalid; clearing it removes that", async () => {
    const screen = await render(<Example error="Choose a size." />);
    expect(select().getAttribute("aria-invalid")).toBe("true");
    expect(root().hasAttribute("data-invalid")).toBe(true);
    expect(part("error").textContent).toBe("Choose a size.");
    await screen.rerender(<Example error="" />);
    expect(select().hasAttribute("aria-invalid")).toBe(false);
    expect(root().hasAttribute("data-invalid")).toBe(false);
    expect(document.querySelector(".ds-select__error")).toBeNull();
  });

  test("a non-empty error blocks the form from submitting", async () => {
    const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());
    const screen = await render(
      <form onSubmit={onSubmit}>
        <Select label={LABEL} options={SIZES} error="Choose a size." />
      </form>,
    );
    document.querySelector("form")!.requestSubmit();
    expect(onSubmit).not.toHaveBeenCalled();
    expect(select().validationMessage).toBe("Choose a size.");
    await screen.rerender(
      <form onSubmit={onSubmit}>
        <Select label={LABEL} options={SIZES} />
      </form>,
    );
    document.querySelector("form")!.requestSubmit();
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  test("required is announced, shown in text, and blocks submit until a value is chosen", async () => {
    const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());
    await render(
      <form onSubmit={onSubmit}>
        <Select
          label={LABEL}
          required
          options={[{ value: "", label: "Choose a size" }, ...SIZES]}
        />
      </form>,
    );
    expect(select().required).toBe(true);
    expect(part("required").textContent).toContain("required");
    await expect
      .element(page.getByRole("combobox", { name: LABEL, exact: true }))
      .toBeInTheDocument();
    const form = document.querySelector("form")!;
    form.requestSubmit();
    expect(onSubmit).not.toHaveBeenCalled();
    expect(root().hasAttribute("data-invalid")).toBe(false);
    await userEvent.selectOptions(control(), "m");
    form.requestSubmit();
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  test("disabled prevents choosing", async () => {
    const r = recorder();
    await render(<Example disabled {...r} />);
    await userEvent.click(control(), { force: true });
    expect(r.calls).toEqual([]);
    expect(root().hasAttribute("data-disabled")).toBe(true);
  });

  test("className is added to the root", async () => {
    await render(<Example className="extra" />);
    expect(root().classList.contains("extra")).toBe(true);
  });
});

describe("forced colors (rationale: high contrast)", () => {
  afterEach(async () => {
    await cdp().send("Emulation.setEmulatedMedia", { features: [] });
  });

  const system = (keyword: string) => {
    const probe = document.createElement("span");
    probe.style.color = keyword;
    document.body.append(probe);
    const color = getComputedStyle(probe).color;
    probe.remove();
    return color;
  };

  const cases: [string, Partial<SelectProps>][] = [
    ["default", {}],
    ["invalid", { error: "Choose a size." }],
    ["disabled", { disabled: true }],
  ];

  for (const [state, props] of cases) {
    test(`${state}: the outline stays visible`, async () => {
      await cdp().send("Emulation.setEmulatedMedia", {
        features: [{ name: "forced-colors", value: "active" }],
      });
      await render(<Example {...props} />);
      const style = getComputedStyle(select());
      expect(parseFloat(style.borderTopWidth)).toBeGreaterThan(0);
      expect(style.borderTopStyle).toBe("solid");
      expect(style.borderTopColor).not.toBe(system("Canvas"));
    });
  }

  test("focus keeps a solid Highlight outline", async () => {
    await cdp().send("Emulation.setEmulatedMedia", {
      features: [{ name: "forced-colors", value: "active" }],
    });
    await render(<Example />);
    await tabToSelect();
    const style = getComputedStyle(select());
    expect(style.outlineStyle).toBe("solid");
    expect(parseFloat(style.outlineWidth)).toBeGreaterThan(0);
    expect(style.outlineColor).toBe(system("Highlight"));
  });
});

describe("token bindings", () => {
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
  const color = (token: string) => asColor(resolve(token));
  const controlStyle = () => getComputedStyle(select());

  test("field gap", async () => {
    await render(<Example hint="Hint" />);
    expect(getComputedStyle(root()).rowGap).toBe(resolve("--ds-primitives-space-1"));
  });

  test("label: default foreground and label.md typography", async () => {
    await render(<Example />);
    const label = getComputedStyle(part("label"));
    expect(label.color).toBe(color("--ds-semantic-color-foreground-default"));
    expect(label.fontSize).toBe(resolve("--ds-semantic-typography-label-md-font-size"));
    expect(label.fontWeight).toBe(resolve("--ds-semantic-typography-label-md-font-weight"));
  });

  test("control base: surface, default text and border, control radius, padding, body.md", async () => {
    await render(<Example />);
    const s = controlStyle();
    expect(s.backgroundColor).toBe(color("--ds-semantic-color-background-surface"));
    expect(s.color).toBe(color("--ds-semantic-color-foreground-default"));
    expect(s.borderTopColor).toBe(color("--ds-semantic-color-border-default"));
    expect(s.borderTopLeftRadius).toBe(resolve("--ds-semantic-radius-control"));
    expect(s.paddingInlineStart).toBe(resolve("--ds-primitives-space-3"));
    expect(s.paddingTop).toBe(resolve("--ds-primitives-space-2"));
    expect(s.fontSize).toBe(resolve("--ds-semantic-typography-body-md-font-size"));
    expect(s.fontWeight).toBe(resolve("--ds-semantic-typography-body-md-font-weight"));
  });

  test("control hover: strong border", async () => {
    await render(<Example />);
    await userEvent.hover(control());
    expect(controlStyle().borderTopColor).toBe(color("--ds-semantic-color-border-strong"));
  });

  test("control focus: focus ring color", async () => {
    await render(<Example />);
    await tabToSelect();
    expect(controlStyle().outlineColor).toBe(color("--ds-semantic-color-border-focus"));
  });

  test("control invalid, and invalid + hover: danger border", async () => {
    await render(<Example error="Choose a size." />);
    const danger = color("--ds-semantic-color-border-status-danger-default");
    expect(controlStyle().borderTopColor).toBe(danger);
    await userEvent.hover(control());
    expect(controlStyle().borderTopColor).toBe(danger);
  });

  test("disabled: control, label, and hint use the disabled roles", async () => {
    await render(<Example disabled hint="Hint" error="Choose a size." />);
    const s = controlStyle();
    const fg = color("--ds-semantic-color-foreground-disabled");
    expect(s.backgroundColor).toBe(color("--ds-semantic-color-background-disabled"));
    expect(s.color).toBe(fg);
    expect(s.borderTopColor).toBe(color("--ds-semantic-color-border-disabled"));
    expect(getComputedStyle(part("label")).color).toBe(fg);
    expect(getComputedStyle(part("hint")).color).toBe(fg);
  });

  test("hint: muted body.sm; error: danger body.sm", async () => {
    await render(<Example hint="Hint" error="Error" />);
    const hint = getComputedStyle(part("hint"));
    const error = getComputedStyle(part("error"));
    expect(hint.color).toBe(color("--ds-semantic-color-foreground-muted"));
    expect(hint.fontSize).toBe(resolve("--ds-semantic-typography-body-sm-font-size"));
    expect(error.color).toBe(color("--ds-semantic-color-foreground-status-danger-default"));
    expect(error.fontSize).toBe(resolve("--ds-semantic-typography-body-sm-font-size"));
  });
});
