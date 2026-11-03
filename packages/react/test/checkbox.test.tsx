import { useState } from "react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { cdp, page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { Checkbox, type CheckboxProps } from "../src/checkbox/Checkbox";

const LABEL = "Email me product updates";

function Example(props: Partial<CheckboxProps>) {
  return (
    <>
      <button type="button">Before</button>
      <Checkbox label={LABEL} {...props} />
    </>
  );
}

const input = () => document.querySelector<HTMLInputElement>('input[type="checkbox"]')!;
const choice = () => document.querySelector<HTMLElement>(".ds-checkbox__choice")!;
const control = () => document.querySelector<HTMLElement>(".ds-checkbox__control")!;
const indicator = () => document.querySelector<SVGElement>(".ds-checkbox__indicator");
const box = () => page.elementLocator(control());

/** Record the order of input and change calls. */
function recorder() {
  const calls: string[] = [];
  return {
    calls,
    onInput: vi.fn((checked: boolean) => calls.push(`input:${checked}`)),
    onChange: vi.fn((checked: boolean) => calls.push(`change:${checked}`)),
  };
}

async function tabToCheckbox() {
  page.getByRole("button", { name: "Before" }).element().focus();
  await userEvent.tab();
  expect(document.activeElement).toBe(input());
}

function formData(form: HTMLFormElement) {
  return [...new FormData(form).entries()].map(([k, v]) => `${k}=${String(v)}`);
}

describe("component.checkbox#toggle-on-activate (MUST)", () => {
  test("clicking the box toggles checked and fires input then change", async () => {
    const r = recorder();
    await render(<Example onInput={r.onInput} onChange={r.onChange} />);
    await userEvent.click(box());
    expect(input().checked).toBe(true);
    expect(r.calls).toEqual(["input:true", "change:true"]);
    await userEvent.click(box());
    expect(input().checked).toBe(false);
    expect(r.calls).toEqual(["input:true", "change:true", "input:false", "change:false"]);
  });

  test("clicking the label toggles checked and fires input then change", async () => {
    const r = recorder();
    await render(<Example onInput={r.onInput} onChange={r.onChange} />);
    await userEvent.click(page.getByText(LABEL));
    expect(input().checked).toBe(true);
    expect(r.calls).toEqual(["input:true", "change:true"]);
  });

  test("Space on the focused box toggles checked and fires input then change", async () => {
    const r = recorder();
    await render(<Example onInput={r.onInput} onChange={r.onChange} />);
    await tabToCheckbox();
    await userEvent.keyboard(" ");
    expect(input().checked).toBe(true);
    await userEvent.keyboard(" ");
    expect(input().checked).toBe(false);
    expect(r.calls).toEqual(["input:true", "change:true", "input:false", "change:false"]);
  });

  test("a controlled checkbox follows onChange", async () => {
    function Controlled() {
      const [checked, setChecked] = useState(false);
      return (
        <>
          <Checkbox label={LABEL} checked={checked} onChange={setChecked} />
          <output>{String(checked)}</output>
        </>
      );
    }
    await render(<Controlled />);
    await userEvent.click(page.getByText(LABEL));
    expect(document.querySelector("output")?.textContent).toBe("true");
    expect(input().checked).toBe(true);
  });

  test("a controlled checkbox that ignores onChange stays unchecked", async () => {
    const onChange = vi.fn();
    await render(<Example checked={false} onChange={onChange} />);
    await userEvent.click(box());
    expect(onChange).toHaveBeenCalledWith(true);
    expect(input().checked).toBe(false);
  });

  test("a disabled checkbox does not toggle or fire events", async () => {
    const r = recorder();
    await render(<Example disabled onInput={r.onInput} onChange={r.onChange} />);
    expect(input().disabled).toBe(true);
    await userEvent.click(page.getByText(LABEL), { force: true });
    expect(input().checked).toBe(false);
    expect(r.calls).toEqual([]);
  });
});

describe("component.checkbox#indeterminate-clears-on-activate (MUST)", () => {
  test("clicking an indeterminate checkbox clears indeterminate and toggles checked", async () => {
    const r = recorder();
    await render(<Example indeterminate onInput={r.onInput} onChange={r.onChange} />);
    expect(input().indeterminate).toBe(true);
    await userEvent.click(box());
    expect(input().indeterminate).toBe(false);
    expect(input().checked).toBe(true);
    expect(choice().hasAttribute("data-indeterminate")).toBe(false);
    expect(r.calls).toEqual(["input:true", "change:true"]);
  });

  test("Space on an indeterminate checked box clears indeterminate and unchecks it", async () => {
    await render(<Example indeterminate defaultChecked />);
    await tabToCheckbox();
    await userEvent.keyboard(" ");
    expect(input().indeterminate).toBe(false);
    expect(input().checked).toBe(false);
  });

  test("a new indeterminate value from the parent sets it again", async () => {
    const screen = await render(<Example indeterminate />);
    await userEvent.click(box());
    expect(input().indeterminate).toBe(false);
    await screen.rerender(<Example indeterminate={false} />);
    await screen.rerender(<Example indeterminate />);
    expect(input().indeterminate).toBe(true);
  });
});

describe("component.checkbox#indeterminate-not-a-value (MUST)", () => {
  test("indeterminate does not change checked", async () => {
    const screen = await render(<Example indeterminate={false} defaultChecked />);
    expect(input().checked).toBe(true);
    await screen.rerender(<Example indeterminate defaultChecked />);
    expect(input().checked).toBe(true);
    expect(input().indeterminate).toBe(true);
  });

  test("an indeterminate checkbox submits by its checked state alone", async () => {
    await render(
      <form>
        <Checkbox label="Unchecked" name="a" indeterminate />
        <Checkbox label="Checked" name="b" value="yes" indeterminate defaultChecked />
      </form>,
    );
    expect(formData(document.querySelector("form")!)).toEqual(["b=yes"]);
  });
});

describe("component.checkbox#programmatic-no-events (MUST)", () => {
  test("setting checked or indeterminate from the parent fires nothing", async () => {
    const r = recorder();
    const screen = await render(
      <Example checked={false} onInput={r.onInput} onChange={r.onChange} />,
    );
    await screen.rerender(<Example checked onInput={r.onInput} onChange={r.onChange} />);
    expect(input().checked).toBe(true);
    await screen.rerender(
      <Example checked indeterminate onInput={r.onInput} onChange={r.onChange} />,
    );
    expect(input().indeterminate).toBe(true);
    await screen.rerender(<Example checked={false} onInput={r.onInput} onChange={r.onChange} />);
    expect(input().checked).toBe(false);
    expect(r.calls).toEqual([]);
  });

  test("form reset fires nothing", async () => {
    const r = recorder();
    await render(
      <form>
        <Checkbox label={LABEL} defaultChecked onInput={r.onInput} onChange={r.onChange} />
      </form>,
    );
    await userEvent.click(box());
    r.calls.length = 0;
    document.querySelector("form")!.reset();
    await expect.poll(() => input().checked).toBe(true);
    expect(r.calls).toEqual([]);
  });
});

describe("component.checkbox#form-value (SHOULD)", () => {
  test("checked submits the value under the name; unchecked submits nothing", async () => {
    await render(
      <form>
        <Checkbox label="Updates" name="updates" value="weekly" defaultChecked />
        <Checkbox label="Offers" name="offers" value="yes" />
      </form>,
    );
    const form = document.querySelector("form")!;
    expect(formData(form)).toEqual(["updates=weekly"]);
    await userEvent.click(page.getByText("Offers"));
    expect(formData(form)).toEqual(["updates=weekly", "offers=yes"]);
  });

  test("the value defaults to on", async () => {
    await render(
      <form>
        <Checkbox label="Terms" name="terms" defaultChecked />
      </form>,
    );
    expect(formData(document.querySelector("form")!)).toEqual(["terms=on"]);
  });

  test("a disabled checkbox submits nothing", async () => {
    await render(
      <form>
        <Checkbox label="Terms" name="terms" defaultChecked disabled />
      </form>,
    );
    expect(formData(document.querySelector("form")!)).toEqual([]);
  });

  test("reset restores the initial checked state and clears indeterminate", async () => {
    await render(
      <form>
        <Checkbox label="On first" name="a" defaultChecked indeterminate />
        <Checkbox label="Off first" name="b" />
      </form>,
    );
    const form = document.querySelector("form")!;
    const [a, b] = document.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');
    await userEvent.click(page.getByText("On first"));
    await userEvent.click(page.getByText("Off first"));
    expect([a.checked, b.checked]).toEqual([false, true]);
    form.reset();
    await expect.poll(() => [a.checked, b.checked]).toEqual([true, false]);
    expect(a.indeterminate).toBe(false);
    // Reset clears indeterminate even when it was never activated.
    await render(
      <form id="second">
        <Checkbox label="Mixed" indeterminate />
      </form>,
    );
    const mixed = document.querySelector<HTMLInputElement>("#second input")!;
    expect(mixed.indeterminate).toBe(true);
    (document.querySelector("#second") as HTMLFormElement).reset();
    await expect.poll(() => mixed.indeterminate).toBe(false);
  });

  test("a reset button restores the initial state of a controlled checkbox without events", async () => {
    const onChange = vi.fn();
    await render(
      <form>
        <Checkbox label={LABEL} checked onChange={onChange} />
        <button type="reset">Reset</button>
      </form>,
    );
    await userEvent.click(page.getByRole("button", { name: "Reset" }));
    // The parent owns a controlled value, so the box keeps showing it.
    await expect.poll(() => input().checked).toBe(true);
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("component.checkbox#mixed-state (MUST)", () => {
  async function axChecked(name: string) {
    // The test page runs in a frame: read that frame's tree.
    const { frameTree } = (await cdp().send("Page.getFrameTree")) as {
      frameTree: { frame: { id: string }; childFrames?: { frame: { id: string } }[] };
    };
    const frames = [frameTree.frame.id, ...(frameTree.childFrames ?? []).map((f) => f.frame.id)];
    const nodes = [];
    for (const frameId of frames) {
      const tree = (await cdp().send("Accessibility.getFullAXTree", { frameId })) as {
        nodes: AXNode[];
      };
      nodes.push(...tree.nodes);
    }
    return find(nodes, name);
  }
  type AXNode = {
    role?: { value: string };
    name?: { value: string };
    properties?: { name: string; value: { value: unknown } }[];
  };
  function find(nodes: AXNode[], name: string) {
    const node = nodes.find((n) => n.role?.value === "checkbox" && n.name?.value === name);
    return node?.properties?.find((p) => p.name === "checked")?.value.value;
  }

  test("indeterminate is exposed as mixed", async () => {
    await render(<Example indeterminate />);
    expect(await axChecked(LABEL)).toBe("mixed");
  });

  test("checked and unchecked are exposed as true and false", async () => {
    const screen = await render(<Example checked />);
    expect(await axChecked(LABEL)).toBe("true");
    await screen.rerender(<Example checked={false} />);
    expect(await axChecked(LABEL)).toBe("false");
  });
});

describe("component.checkbox#state-not-color-alone (MUST)", () => {
  const shape = () => indicator()?.querySelector("path")?.getAttribute("d");

  test("unchecked shows no indicator; checked shows a mark; indeterminate shows a dash", async () => {
    const screen = await render(<Example checked={false} />);
    expect(indicator()).toBeNull();
    await screen.rerender(<Example checked />);
    const mark = shape();
    expect(mark).toBeTruthy();
    await screen.rerender(<Example checked indeterminate />);
    const dash = shape();
    expect(dash).toBeTruthy();
    expect(dash).not.toBe(mark);
  });

  test("the indicator is hidden from assistive technology", async () => {
    await render(<Example checked />);
    expect(indicator()!.getAttribute("aria-hidden")).toBe("true");
  });

  test("a disabled checked box still shows its mark", async () => {
    await render(<Example checked disabled />);
    expect(indicator()).not.toBeNull();
  });
});

describe("component.checkbox#forced-colors (MUST)", () => {
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

  const cases: [string, Partial<CheckboxProps>][] = [
    ["unchecked", {}],
    ["checked", { checked: true }],
    ["indeterminate", { indeterminate: true }],
    ["invalid", { error: "Accept the terms" }],
    ["checked + invalid", { checked: true, error: "Accept the terms" }],
    ["disabled", { disabled: true }],
    ["checked + disabled", { checked: true, disabled: true }],
  ];

  for (const [state, props] of cases) {
    test(`${state}: the box outline and indicator stay visible`, async () => {
      await cdp().send("Emulation.setEmulatedMedia", {
        features: [{ name: "forced-colors", value: "active" }],
      });
      expect(matchMedia("(forced-colors: active)").matches).toBe(true);
      await render(<Example {...props} />);
      const style = getComputedStyle(control());
      expect(parseFloat(style.borderTopWidth)).toBeGreaterThan(0);
      expect(style.borderTopStyle).toBe("solid");
      const canvas = system("Canvas");
      expect(style.borderTopColor).not.toBe(canvas);
      if (indicator()) {
        // The indicator color differs from the fill it sits on.
        expect(getComputedStyle(indicator()!).color).not.toBe(style.backgroundColor);
      }
      if (props.checked || props.indeterminate) expect(indicator()).not.toBeNull();
    });
  }

  test("focus keeps a solid Highlight outline", async () => {
    await cdp().send("Emulation.setEmulatedMedia", {
      features: [{ name: "forced-colors", value: "active" }],
    });
    await render(<Example checked />);
    await tabToCheckbox();
    const style = getComputedStyle(control());
    expect(style.outlineStyle).toBe("solid");
    expect(parseFloat(style.outlineWidth)).toBeGreaterThan(0);
    expect(style.outlineColor).toBe(system("Highlight"));
  });
});

describe("parameters (pattern.form-field)", () => {
  test("label is the accessible name", async () => {
    await render(<Example />);
    await expect.element(page.getByRole("checkbox", { name: LABEL })).toBeInTheDocument();
  });

  test("hint and error form the accessible description", async () => {
    await render(<Example hint="About once a month." error="Choose how often." />);
    await expect
      .element(page.getByRole("checkbox", { name: LABEL }))
      .toHaveAccessibleDescription("About once a month. Choose how often.");
  });

  test("a non-empty error marks the control invalid; clearing it removes that", async () => {
    const screen = await render(<Example error="Accept the terms to continue." />);
    expect(input().getAttribute("aria-invalid")).toBe("true");
    expect(choice().hasAttribute("data-invalid")).toBe(true);
    await screen.rerender(<Example error="" />);
    expect(input().hasAttribute("aria-invalid")).toBe(false);
    expect(choice().hasAttribute("data-invalid")).toBe(false);
    expect(document.querySelector(".ds-checkbox__error")).toBeNull();
  });

  test("a non-empty error blocks the form from submitting", async () => {
    const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());
    await render(
      <form onSubmit={onSubmit}>
        <Checkbox label={LABEL} defaultChecked error="Fix this" />
      </form>,
    );
    document.querySelector("form")!.requestSubmit();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test("required is announced, shown in text, and blocks submit until checked", async () => {
    const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());
    await render(
      <form onSubmit={onSubmit}>
        <Checkbox label="I agree to the terms" required />
      </form>,
    );
    expect(input().required).toBe(true);
    expect(document.querySelector(".ds-checkbox__required")?.textContent).toContain("required");
    // The visible marker does not repeat in the accessible name.
    await expect
      .element(page.getByRole("checkbox", { name: "I agree to the terms", exact: true }))
      .toBeInTheDocument();
    const form = document.querySelector("form")!;
    form.requestSubmit();
    expect(onSubmit).not.toHaveBeenCalled();
    // A required checkbox with no error does not paint itself invalid.
    expect(choice().hasAttribute("data-invalid")).toBe(false);
    await userEvent.click(box());
    form.requestSubmit();
    expect(onSubmit).toHaveBeenCalledTimes(1);
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
  const boxStyle = () => getComputedStyle(control());

  test("field and choice gaps", async () => {
    await render(<Example hint="Hint" />);
    expect(getComputedStyle(document.querySelector(".ds-checkbox")!).rowGap).toBe(
      resolve("--ds-primitives-space-1"),
    );
    expect(getComputedStyle(choice()).columnGap).toBe(resolve("--ds-primitives-space-2"));
  });

  test("control base: surface background, default border, compact radius, 16px", async () => {
    await render(<Example />);
    expect(boxStyle().backgroundColor).toBe(color("--ds-semantic-color-background-surface"));
    expect(boxStyle().borderTopColor).toBe(color("--ds-semantic-color-border-default"));
    expect(boxStyle().borderTopLeftRadius).toBe(resolve("--ds-semantic-radius-compact"));
    expect(control().getBoundingClientRect().width).toBe(16);
  });

  test("control hover: strong border", async () => {
    await render(<Example />);
    await userEvent.hover(page.getByText(LABEL));
    expect(boxStyle().borderTopColor).toBe(color("--ds-semantic-color-border-strong"));
  });

  test("control checked, and checked + hover: primary fill and border; indicator on-primary", async () => {
    await render(<Example checked />);
    const fill = color("--ds-semantic-color-background-action-primary-default");
    const border = color("--ds-semantic-color-border-action-primary-default");
    expect(boxStyle().backgroundColor).toBe(fill);
    expect(boxStyle().borderTopColor).toBe(border);
    expect(getComputedStyle(indicator()!).color).toBe(
      color("--ds-semantic-color-foreground-on-action-primary"),
    );
    await userEvent.hover(page.getByText(LABEL));
    expect(choice().hasAttribute("data-hovered")).toBe(true);
    expect(boxStyle().backgroundColor).toBe(fill);
    expect(boxStyle().borderTopColor).toBe(border);
  });

  test("control indeterminate, and indeterminate + hover: primary fill and border", async () => {
    await render(<Example indeterminate />);
    const fill = color("--ds-semantic-color-background-action-primary-default");
    expect(boxStyle().backgroundColor).toBe(fill);
    await userEvent.hover(page.getByText(LABEL));
    expect(boxStyle().backgroundColor).toBe(fill);
    expect(boxStyle().borderTopColor).toBe(
      color("--ds-semantic-color-border-action-primary-default"),
    );
  });

  test("control invalid, invalid + hover, checked + invalid: danger border", async () => {
    const danger = color("--ds-semantic-color-border-status-danger-default");
    const screen = await render(<Example error="Fix" />);
    expect(boxStyle().borderTopColor).toBe(danger);
    await userEvent.hover(page.getByText(LABEL));
    expect(boxStyle().borderTopColor).toBe(danger);
    await screen.rerender(<Example error="Fix" checked />);
    expect(boxStyle().borderTopColor).toBe(danger);
    expect(boxStyle().backgroundColor).toBe(
      color("--ds-semantic-color-background-action-primary-default"),
    );
  });

  test("control disabled in every combination; indicator and label disabled foreground", async () => {
    const bg = color("--ds-semantic-color-background-disabled");
    const border = color("--ds-semantic-color-border-disabled");
    const fg = color("--ds-semantic-color-foreground-disabled");
    const screen = await render(<Example disabled />);
    expect([boxStyle().backgroundColor, boxStyle().borderTopColor]).toEqual([bg, border]);
    for (const props of [{ checked: true }, { indeterminate: true }, { error: "Fix" }]) {
      await screen.rerender(<Example disabled {...props} />);
      expect([boxStyle().backgroundColor, boxStyle().borderTopColor]).toEqual([bg, border]);
    }
    await screen.rerender(<Example disabled checked hint="Hint" />);
    expect(getComputedStyle(indicator()!).color).toBe(fg);
    expect(getComputedStyle(document.querySelector(".ds-checkbox__label")!).color).toBe(fg);
    expect(getComputedStyle(document.querySelector(".ds-checkbox__hint")!).color).toBe(fg);
  });

  test("control focus: focus ring color", async () => {
    await render(<Example />);
    await tabToCheckbox();
    expect(boxStyle().outlineColor).toBe(color("--ds-semantic-color-border-focus"));
  });

  test("label: default foreground and body.md typography", async () => {
    await render(<Example />);
    const label = getComputedStyle(document.querySelector(".ds-checkbox__label")!);
    expect(label.color).toBe(color("--ds-semantic-color-foreground-default"));
    expect(label.fontSize).toBe(resolve("--ds-semantic-typography-body-md-font-size"));
    expect(label.fontWeight).toBe(resolve("--ds-semantic-typography-body-md-font-weight"));
  });

  test("hint: muted body.sm; error: danger body.sm", async () => {
    await render(<Example hint="Hint" error="Error" />);
    const hint = getComputedStyle(document.querySelector(".ds-checkbox__hint")!);
    const error = getComputedStyle(document.querySelector(".ds-checkbox__error")!);
    expect(hint.color).toBe(color("--ds-semantic-color-foreground-muted"));
    expect(hint.fontSize).toBe(resolve("--ds-semantic-typography-body-sm-font-size"));
    expect(error.color).toBe(color("--ds-semantic-color-foreground-status-danger-default"));
    expect(error.fontSize).toBe(resolve("--ds-semantic-typography-body-sm-font-size"));
  });
});
